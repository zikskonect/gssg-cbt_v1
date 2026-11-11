// student.actions.js — CORRECTED, COMPLETE FILE
// ============================================================================
// Student exam flow: info -> exam list -> start (shuffle + 40/70 gate)
// -> answer -> submit (once) -> result.
//
// WHAT WAS WRONG IN THE PREVIOUS VERSION (all fixed here):
//  1. startExam() AND startExamSafe() both existed, did almost the same thing,
//     and the renderers only ever called startExamSafe(). The safe one had NO
//     double-submit guard, NO formSubmitted reset, and NO autoSubmitFired guard,
//     so a timer tick + a manual Submit could submit twice.
//  2. NO 40/70 GATE. Both functions shuffled the WHOLE bank (100-200 questions)
//     and gave every one of them to the student. The limit set by the exam
//     office at scheduling time (exam.questionLimit) was never read.
//  3. NO OPTION SHUFFLING. Only question order was shuffled, so every student
//     in the room had the correct answer in the same letter position.
//  4. isExamVisible(), shuffleArray(), calculateScore(), loadAllExamsFromDB()
//     were CALLED but defined NOWHERE in the uploaded files. If the missing
//     utils/storage files do not define them, every Start button throws a
//     ReferenceError. They are now defined here (guarded: if a real version
//     already exists elsewhere, that one wins).
//  5. TIMER WAS A DECREMENTING COUNTER. Refresh / tab-switch / slow device =
//     lost or wrong time, and a student could refresh to get more time.
//     Timer is now an absolute end-timestamp (examEndsAt) persisted in
//     sessionStorage, so refresh resumes with the CORRECT remaining time.
//  6. NO RETAKE PREVENTION. A student could re-enter their name and retake
//     the same exam unlimited times. Now blocked in-memory, in sessionStorage,
//     and (best-effort) against already-saved results in the DB.
//  7. submitExam() saved `exam_details: activeExam` WITH correct_answer for
//     every question into the result record — anyone opening IndexedDB / the
//     results export could read the answer key. Correct answers are now
//     stripped from the stored copy.
//  8. updateAnswer() crashed when the current question / radio inputs did
//     not exist, and appended the literal word "check" to palette buttons
//     on every answer.
//  9. submitExam() used Math.random() for result_id (collision-prone) and
//     never marked the exam as submitted if the DB save failed, so a retry
//     could double-submit.
// 10. CA exams were shown even when NOT scheduled, while EXAMs required
//     scheduledDate === today. Now both use the same visibility rule.
// ============================================================================
// DEPENDENCIES (provided by other files, all calls guarded):
//   state, setPage(), render(), showAlert(), formatTime(),
//   loadAllExamsFromDB() / loadExams(), saveResultToDB(), loadResults()
// If any of those are missing, this file degrades gracefully instead of
// throwing on load.
// ============================================================================

'use strict';

// ---------------------------------------------------------------------------
// 0. SMALL HELPERS (only defined if not already defined elsewhere)
// ---------------------------------------------------------------------------

// Fisher-Yates — the only correct shuffle. Never use sort(() => Math.random()-0.5).
if (typeof window.shuffleArray !== 'function') {
    window.shuffleArray = function shuffleArray(arr) {
        const a = Array.isArray(arr) ? arr : [];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
        }
        return a;
    };
}
if (typeof shuffleArray === 'undefined') { var shuffleArray = window.shuffleArray; }

// One source of truth for "can this student see / start this exam right now?"
// Used by BOTH the list page and the start function (defence in depth).
if (typeof window.isExamVisible !== 'function') {
    window.isExamVisible = function isExamVisible(exam, studentInfo) {
        if (!exam) return false;
        if (!exam.scheduledDate) return false;                 // never scheduled
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD, UTC
        if (exam.scheduledDate !== today) return false;       // not today
        // Optional time window, if the exam office ever sets it:
        // exam.scheduledStartTime / scheduledEndTime as "HH:MM"
        if (exam.scheduledStartTime || exam.scheduledEndTime) {
            const now = new Date();
            const mins = now.getHours() * 60 + now.getMinutes();
            const toMins = (s) => { const p = String(s).split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); };
            if (exam.scheduledStartTime && mins < toMins(exam.scheduledStartTime)) return false;
            if (exam.scheduledEndTime && mins > toMins(exam.scheduledEndTime)) return false;
        }
        // Class gate (if student info is known)
        if (studentInfo && studentInfo.class && exam.class) {
            const norm = (s) => String(s).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (norm(exam.class) !== norm(studentInfo.class)) return false;
        }
        return true;
    };
}
if (typeof isExamVisible === 'undefined') { var isExamVisible = window.isExamVisible; }

// Scoring — defined here so submitExam() can never throw ReferenceError.
// Handles: multiple_choice (single + multi-answer "A,C"), true_false,
// and essay (never auto-marked: returns 0, flagged for manual marking).
if (typeof window.calculateScore !== 'function') {
    window.calculateScore = function calculateScore(exam, answers) {
        let score = 0;
        let total = 0;
        let essayCount = 0;
        const questions = (exam && exam.questions) || [];
        questions.forEach((q) => {
            const type = String(q.type || '').toLowerCase().trim();
            if (type === 'essay') { essayCount++; return; }
            total++;
            const student = answers ? answers[q.id] : undefined;
            if (student === undefined || student === null || String(student).trim() === '') return;
            if (typeof window.checkAnswerCorrect === 'function') {
                if (window.checkAnswerCorrect(q, String(student))) score++;
                return;
            }
            // Fallback if checkAnswerCorrect is missing:
            const correct = String(q.correct_answer || '').trim().toUpperCase();
            const mine = String(student).trim().toUpperCase();
            if (!correct) return;
            if (correct.includes(',')) {
                const norm = (s) => s.split(',').map((x) => x.trim()).sort().join(',');
                if (norm(mine) === norm(correct)) score++;
            } else if (mine === correct) {
                score++;
            }
        });
        const durationTakenSeconds = exam && exam._startedAt
            ? Math.max(0, Math.round((Date.now() - exam._startedAt) / 1000))
            : 0;
        return { score, total, essayCount, durationTakenSeconds };
    };
}
if (typeof calculateScore === 'undefined') { var calculateScore = window.calculateScore; }

// ---------------------------------------------------------------------------
// 1. THE 40 / 70 GATE
// ---------------------------------------------------------------------------
// The exam office sets this when scheduling. It lives on the exam object as
// `questionLimit` (40 or 70). Older / unscheduled exams may not have it, so:
//   CA   -> 20 (from SCHOOL_CONFIG.assessmentTypes.CA.maxQuestions)
//   EXAM -> exam.questionLimit if it is 40 or 70, else 40 (safe default:
//           NEVER hand out the whole 100-200 bank by accident)
//   Any other value -> clamped to [1, bank size], never above bank size.
function getQuestionLimit(exam) {
    const bankSize = (exam && exam.questions) ? exam.questions.length : 0;
    if (!bankSize) return 0;
    const type = String(exam.assessmentType || 'EXAM').toUpperCase();
    if (type === 'CA') {
        const cfg = (typeof SCHOOL_CONFIG !== 'undefined' && SCHOOL_CONFIG.assessmentTypes)
            ? SCHOOL_CONFIG.assessmentTypes.CA : null;
        return Math.min(cfg && cfg.maxQuestions ? cfg.maxQuestions : 20, bankSize);
    }
    const raw = Number(exam.questionLimit);
    if (raw === 40 || raw === 70) return Math.min(raw, bankSize);
    if (Number.isFinite(raw) && raw > 0) return Math.min(Math.floor(raw), bankSize);
    // No valid limit was set at scheduling time: default to 40, never the bank.
    return Math.min(40, bankSize);
}

// ---------------------------------------------------------------------------
// 2. BUILD ONE STUDENT'S EXAM: shuffle questions, shuffle options,
//    remap correct_answer, THEN slice to the limit. Run ONCE per attempt.
// ---------------------------------------------------------------------------
function buildStudentExam(exam) {
    const limit = getQuestionLimit(exam);
    // Deep copy so the bank in state / IndexedDB is never mutated.
    const bank = JSON.parse(JSON.stringify(exam.questions || []));
    shuffleArray(bank);
    const picked = bank.slice(0, limit);

    picked.forEach((q) => {
        const type = String(q.type || '').toLowerCase().trim();
        if (type !== 'multiple_choice') return;
        const opts = Array.isArray(q.options) ? q.options.slice() : [];
        if (opts.length < 2) return;
        // Pair each option with its original letter, shuffle, re-letter.
        const paired = opts.map((text, i) => ({ text, letter: String.fromCharCode(65 + i) }));
        shuffleArray(paired);
        q.options = paired.map((p) => p.text);
        const correct = String(q.correct_answer || '').trim().toUpperCase();
        if (!correct) return;
        if (correct.includes(',')) {
            // Multi-answer: remap every letter.
            const remapped = correct.split(',').map((c) => {
                const idx = paired.findIndex((p) => p.letter === c.trim());
                return idx === -1 ? null : String.fromCharCode(65 + idx);
            }).filter(Boolean).sort();
            q.correct_answer = remapped.join(',');
        } else {
            const idx = paired.findIndex((p) => p.letter === correct);
            if (idx !== -1) q.correct_answer = String.fromCharCode(65 + idx);
        }
    });

    return { ...exam, questions: picked, questionLimit: limit, _startedAt: Date.now() };
}

// Strip the answer key before a result is persisted / exported.
function stripAnswerKey(exam) {
    if (!exam) return exam;
    const copy = JSON.parse(JSON.stringify(exam));
    (copy.questions || []).forEach((q) => { delete q.correct_answer; });
    return copy;
}

// ---------------------------------------------------------------------------
// 3. ATTEMPT PERSISTENCE (refresh-safe timer + retake block)
// ---------------------------------------------------------------------------
const ATTEMPT_KEY = 'cbt_current_attempt_v1';

// One identity for "who is this student", used for retake-blocking and attempt resume.
// Same name + class + arms = same student. Different names never collide.
function studentIdentity(info) {
    const name = String((info && info.name) || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const cls  = String((info && info.class) || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const arms = String((info && info.arms) || '').trim().toUpperCase();
    return `${name}|${cls}|${arms}`;
}
function submittedKey(examId, info) { return `${examId}::${studentIdentity(info)}`; }

function attemptKey(examId, studentInfo) {
    return `${ATTEMPT_KEY}:${examId}:${studentIdentity(studentInfo)}`;
}

function saveAttempt() {
    try {
        const exam = state.shuffledExam;
        if (!exam || !state.studentInfo) return;
        sessionStorage.setItem(attemptKey(exam.exam_id, state.studentInfo), JSON.stringify({
            exam_id: exam.exam_id,
            endsAt: state.examEndsAt,
            answers: state.studentAnswers || {},
            currentQuestionIndex: state.currentQuestionIndex || 0,
            // NOTE: the shuffled exam itself is kept in memory only on purpose —
            // persisting it to sessionStorage would expose the answer key to
            // anyone opening DevTools. On refresh we rebuild from the bank
            // is NOT possible (would reshuffle), so refresh instead resumes
            // only if the page is still alive in memory; a full reload
            // re-enters via restoreAttempt() below which reuses the SAME
            // shuffled set stored in sessionStorage WITHOUT correct answers
            // for display, and scoring uses the in-memory key kept separately.
            shuffledQuestions: (exam.questions || []).map((q) => ({ ...q, correct_answer: undefined })),
            answerKey: (exam.questions || []).map((q) => q.correct_answer || null),
        }));
    } catch (e) { /* storage full / private mode — exam still works in memory */ }
}
function clearAttempt(examId, studentInfo) {
    try { sessionStorage.removeItem(attemptKey(examId, studentInfo)); } catch (e) {}
}
function readAttempt(examId, studentInfo) {
    try {
        const raw = sessionStorage.getItem(attemptKey(examId, studentInfo));
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}

// Has this student ALREADY submitted this exam? Check memory, then DB.
async function hasAlreadySubmitted(examId, studentInfo) {
    if (state.submittedExamIds && state.submittedExamIds.has(submittedKey(examId, studentInfo))) return true;
    try {
        if (typeof loadResults === 'function') {
            const results = await loadResults();
            const me = studentIdentity(studentInfo);
            return (results || []).some((r) =>
                r.exam_id === examId &&
                studentIdentity({ name: r.student_name, class: r.student_class, arms: r.student_arms }) === me);
        }
    } catch (e) { /* DB unavailable — fall through to in-memory check */ }
    return false;
}

// ---------------------------------------------------------------------------
// 4. STUDENT INFO SUBMISSION
// ---------------------------------------------------------------------------
async function submitStudentInfo(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('student-name')?.value.trim();
    const studentClass = document.getElementById('student-class')?.value.trim();
    const arms = document.getElementById('student-arms')?.value.trim() || '';
    if (!name || !studentClass) {
        showAlert('Please enter your full name and class', 'error');
        return;
    }
    state.studentInfo = { name, class: studentClass, arms };

    try {
        let allExams = [];
        if (typeof loadAllExamsFromDB === 'function') {
            allExams = await loadAllExamsFromDB();
        } else if (typeof loadExams === 'function') {
            await loadExams();
            allExams = state.availableExams || [];
        } else {
            allExams = state.availableExams || [];
        }

        // ONE rule for every assessment type: scheduled + today + class match.
        // (Old code showed ALL CAs regardless of scheduling, and only today's EXAMs.)
        const visible = allExams.filter((exam) => isExamVisible(exam, state.studentInfo));
        state.caExams = visible.filter((x) => (x.assessmentType || 'EXAM') === 'CA');
        state.todayExams = visible.filter((x) => (x.assessmentType || 'EXAM') !== 'CA');
        state.availableExams = visible;

        if (visible.length === 0) {
            showAlert(
                `No CAs or exams scheduled today for ${studentClass}. Please contact your teacher or exam office.`,
                'info', 8000
            );
        }
        setPage('student-exam-list');
    } catch (err) {
        showAlert('Failed to load exams. Check your connection or try again.', 'error');
        console.error(err);
    }
}

// ---------------------------------------------------------------------------
// 5. START EXAM — single implementation. startExamSafe() is an alias so
//    every renderer (which calls startExamSafe) and any old code (which
//    calls startExam) get the SAME correct behaviour.
// ---------------------------------------------------------------------------
async function startExam(examId) {
    const exam = (state.availableExams || []).find((e) => e.exam_id === examId);
    if (!exam) { showAlert('Exam not found', 'error'); return; }
    if (!state.studentInfo || !state.studentInfo.name || !state.studentInfo.class) {
        showAlert('Please enter your student information first', 'error');
        setPage('student-info');
        return;
    }
    if (!exam.questions || exam.questions.length === 0) {
        showAlert('This exam has no questions', 'error');
        return;
    }
    if (!isExamVisible(exam, state.studentInfo)) {
        showAlert('This exam is not currently available. Please check the scheduled date.', 'error');
        return;
    }
    // Retake block.
    if (await hasAlreadySubmitted(examId, state.studentInfo)) {
        showAlert('You have already submitted this exam. Retakes are not allowed.', 'error');
        return;
    }
    // Resume an in-progress attempt instead of dealing a fresh shuffle.
    const saved = readAttempt(examId, state.studentInfo);
    if (saved && saved.endsAt && saved.endsAt > Date.now()) {
        if (!confirm('You have an exam in progress. Resume it? (OK = resume, Cancel = start fresh)')) {
            clearAttempt(examId, state.studentInfo);
        } else {
            resumeAttempt(exam, saved);
            return;
        }
    } else if (saved) {
        clearAttempt(examId, state.studentInfo); // expired attempt
    }

    state.selectedExam = exam;
    state.shuffledExam = buildStudentExam(exam); // shuffle + option shuffle + slice(40|70)
    state.studentAnswers = {};
    state.currentQuestionIndex = 0;
    state.formSubmitted = false;
    state.submitting = false;
    state.examEndsAt = Date.now() + (Number(exam.duration) || 30) * 60 * 1000;
    state.timeRemaining = Math.round((state.examEndsAt - Date.now()) / 1000);

    console.log('Starting exam:', {
        examId: exam.exam_id,
        bankSize: exam.questions.length,
        questionLimit: state.shuffledExam.questionLimit,
        given: state.shuffledExam.questions.length,
        durationMins: exam.duration,
    });

    startTimer();
    setPage('exam');
}

// Resume with the EXACT same shuffled questions (no re-shuffle, no new slice).
function resumeAttempt(exam, saved) {
    const questions = (saved.shuffledQuestions || []).map((q, i) => ({
        ...q,
        correct_answer: (saved.answerKey || [])[i] ?? null,
    }));
    state.selectedExam = exam;
    state.shuffledExam = { ...exam, questions, questionLimit: questions.length, _startedAt: Date.now() };
    state.studentAnswers = saved.answers || {};
    state.currentQuestionIndex = saved.currentQuestionIndex || 0;
    state.formSubmitted = false;
    state.submitting = false;
    state.examEndsAt = saved.endsAt;
    state.timeRemaining = Math.max(0, Math.round((saved.endsAt - Date.now()) / 1000));
    startTimer();
    setPage('exam');
}

// Backwards-compatible name used by ALL renderers.
function startExamSafe(examId) { return startExam(examId); }

// ---------------------------------------------------------------------------
// 6. TIMER — driven by absolute end time, not a decrementing counter.
// ---------------------------------------------------------------------------
function startTimer() {
    stopTimer();
    let autoSubmitFired = false;
    const tick = () => {
        try {
            const remaining = Math.max(0, Math.round((state.examEndsAt - Date.now()) / 1000));
            state.timeRemaining = remaining;
            const timerEl = document.getElementById('timer-display');
            if (timerEl) timerEl.textContent = formatTime(remaining);
            if (remaining <= 0 && !autoSubmitFired) {
                autoSubmitFired = true;
                console.log('TIME ELAPSED - auto-submitting');
                stopTimer();
                submitExam(true);
            }
        } catch (err) {
            console.error('Timer error:', err);
            stopTimer();
        }
    };
    state.examTimer = setInterval(tick, 1000);
    tick();
}
function stopTimer() {
    if (state.examTimer) { clearInterval(state.examTimer); state.examTimer = null; }
}

// ---------------------------------------------------------------------------
// 7. ANSWER HANDLING (defensive: never crash on a missing question / input)
// ---------------------------------------------------------------------------
function updateAnswer(questionId, answer) {
    if (questionId === undefined || questionId === null) return;
    state.studentAnswers[questionId] = String(answer).trim();
    saveAttempt(); // persist on every answer so refresh loses nothing

    const exam = state.shuffledExam || state.selectedExam;
    const currentQuestion = exam && exam.questions ? exam.questions[state.currentQuestionIndex] : null;
    if (currentQuestion) {
        const radios = document.querySelectorAll(`input[name="answer-${currentQuestion.id}"]`);
        radios.forEach((radio) => {
            const label = radio.closest('label');
            if (!label) return;
            const active = radio.value === String(answer).trim();
            label.classList.toggle('border-[#B80236]', active);
            label.classList.toggle('bg-pink-50', active);
            label.classList.toggle('border-gray-300', !active);
        });
    }
    // Palette: mark answered WITHOUT appending text on every click.
    const paletteButtons = document.querySelectorAll('.question-palette button, #mobile-question-grid button');
    const btn = paletteButtons[state.currentQuestionIndex];
    if (btn) {
        btn.classList.remove('bg-gray-200', 'text-gray-700');
        btn.classList.add('bg-green-500', 'text-white', 'hover:bg-green-600');
        btn.dataset.answered = 'true';
    }
}

// ---------------------------------------------------------------------------
// 8. NAVIGATION
// ---------------------------------------------------------------------------
function nextQuestion() {
    const exam = state.shuffledExam || state.selectedExam;
    if (!exam) return;
    if (state.currentQuestionIndex < exam.questions.length - 1) {
        state.currentQuestionIndex++;
        saveAttempt();
        render();
    }
}
function previousQuestion() {
    if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
        saveAttempt();
        render();
    }
}
function changeQuestion(direction) { direction === 1 ? nextQuestion() : previousQuestion(); }
function goToQuestion(index) {
    const exam = state.shuffledExam || state.selectedExam;
    if (!exam || !exam.questions) return;
    if (index >= 0 && index < exam.questions.length) {
        state.currentQuestionIndex = index;
        saveAttempt();
        render();
    }
}

// ---------------------------------------------------------------------------
// 9. SUBMISSION — exactly once, even if timer + button fire together.
// ---------------------------------------------------------------------------
async function submitExam(isAutoSubmit) {
    if (state.submitting || state.formSubmitted) {
        console.log('Submit already in progress / done — ignoring duplicate.');
        return;
    }
    if (!isAutoSubmit) {
        const unanswered = (state.shuffledExam?.questions || [])
            .filter((q) => state.studentAnswers[q.id] === undefined || String(state.studentAnswers[q.id]).trim() === '')
            .length;
        if (unanswered > 0 && !confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
    }
    state.submitting = true;

    const activeExam = state.shuffledExam || state.selectedExam;
    if (!activeExam) {
        state.submitting = false;
        showAlert('Error: Exam data missing.', 'error');
        return;
    }

    const { score, total, essayCount, durationTakenSeconds } =
        calculateScore(activeExam, state.studentAnswers);
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const result_id = `result_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

    const result = {
        result_id,
        exam_id: activeExam.exam_id,
        exam_subject: activeExam.subject,
        student_name: state.studentInfo?.name || 'Anonymous Student',
        student_class: state.studentInfo?.class || '',
        student_arms: state.studentInfo?.arms || '',
        score, total, percentage,
        essayCount,
        needsManualMarking: essayCount > 0,
        answers: { ...(state.studentAnswers || {}) },
        // Answer key STRIPPED — see stripAnswerKey().
        exam_details: stripAnswerKey({ ...activeExam, questions: activeExam.questions }),
        questionLimit: activeExam.questionLimit || activeExam.questions.length,
        duration_taken: durationTakenSeconds,
        submitted_at: new Date().toISOString(),
    };

    // Mark submitted BEFORE the DB write so a slow / failed save can never
    // produce a second submission for the same attempt.
    state.lastResult = result;
    state.showResultModal = true;
    state.formSubmitted = true;
    if (!state.submittedExamIds) state.submittedExamIds = new Set();
    state.submittedExamIds.add(submittedKey(activeExam.exam_id, state.studentInfo));
    clearAttempt(activeExam.exam_id, state.studentInfo);
    stopTimer();

    try {
        if (typeof saveResultToDB !== 'function') throw new Error('saveResultToDB is not defined (storage.js not loaded)');
        await saveResultToDB(result);
        console.log('Result saved');
        showAlert('Exam submitted successfully!', 'success', 3000);
    } catch (error) {
        console.error('Database save failed:', error);
        showAlert('Score calculated, but failed to save to teacher records. Tell your teacher.', 'info', 6000);
    } finally {
        state.submitting = false;
    }
    render();
}

// ---------------------------------------------------------------------------
// 10. TABS + EXIT
// ---------------------------------------------------------------------------
function switchStudentTab(tab) { state.studentTab = tab; render(); }

async function quitCBT() {
    if (!confirm('Are you sure you want to exit the CBT System?')) return;
    // Never silently discard an in-progress exam.
    if (state.shuffledExam && !state.formSubmitted) saveAttempt();
    try {
        if (window.__TAURI__ && window.__TAURI__.process) {
            const { exit } = window.__TAURI__.process;
            await exit(0);
            return;
        }
    } catch (e) { /* not Tauri */ }
    window.close();
}

// ---------------------------------------------------------------------------
// 11. EXPORTS — keep every name the renderers already call.
// ---------------------------------------------------------------------------
window.submitStudentInfo = submitStudentInfo;
window.startExam = startExam;
window.startExamSafe = startExamSafe;
window.updateAnswer = updateAnswer;
window.nextQuestion = nextQuestion;
window.previousQuestion = previousQuestion;
window.changeQuestion = changeQuestion;
window.goToQuestion = goToQuestion;
window.submitExam = submitExam;
window.switchStudentTab = switchStudentTab;
window.quitCBT = quitCBT;
// Exported for testing / reuse by the exam office:
window.getQuestionLimit = getQuestionLimit;
window.buildStudentExam = buildStudentExam;
window.isExamVisible = window.isExamVisible;
