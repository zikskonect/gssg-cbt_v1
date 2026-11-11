// teacher.actions.js - Teacher Actions
// Handles exam creation, editing, deletion, import, export, and symbol insertion

// ========================================
// CA / EXAM TOGGLE FUNCTIONS
// ========================================

function getAssessmentType() {
    if (!state.assessmentType) {
        state.assessmentType = 'EXAM';
    }
    return state.assessmentType;
}

function getMaxQuestions() {
    const type = getAssessmentType();
    const config = window.SCHOOL_CONFIG?.assessmentTypes || {
        CA: { maxQuestions: 20 },
        EXAM: { maxQuestions: 100 }
    };
    return config[type]?.maxQuestions || (type === 'CA' ? 20 : 100);
}

function getAssessmentConfig(type) {
    const config = window.SCHOOL_CONFIG?.assessmentTypes || {
        CA: { label: 'Continuous Assessment', shortLabel: 'CA', maxQuestions: 20, defaultDuration: 30, color: '#059669' },
        EXAM: { label: 'Examination', shortLabel: 'Exam', maxQuestions: 100, defaultDuration: 120, color: '#B80236' }
    };
    return config[type] || config.EXAM;
}

function toggleAssessmentType(type) {
    const config = window.SCHOOL_CONFIG?.assessmentTypes || {
        CA: { maxQuestions: 20, defaultDuration: 30 },
        EXAM: { maxQuestions: 100, defaultDuration: 120 }
    };

    state.assessmentType = type;

    const caBtn = document.getElementById('ca-toggle-btn');
    const examBtn = document.getElementById('exam-toggle-btn');
    const durationInput = document.getElementById('duration');
    const questionLimitInfo = document.getElementById('question-limit-info');

    if (caBtn && examBtn) {
        caBtn.classList.toggle('active', type === 'CA');
        examBtn.classList.toggle('active', type === 'EXAM');
    }

    if (durationInput) {
        durationInput.value = config[type].defaultDuration || 30;
    }

    if (questionLimitInfo) {
        const maxQ = config[type].maxQuestions || (type === 'CA' ? 20 : 100);
        questionLimitInfo.textContent = `Maximum ${maxQ} questions for ${type}`;
        questionLimitInfo.className = `text-xs font-medium mt-1 ${type === 'CA' ? 'text-emerald-600' : 'text-rose-600'}`;
    }

    render();
}

// ========================================
// GLOBAL SYMBOL PALETTE
// One ∑ button. Targets whichever field was last clicked.
// Auto-closes after inserting a symbol.
// ========================================

const SYMBOL_GROUPS = {
    basic:  { label: 'Basic',       symbols: ['+','−','×','÷','=','≠','≈','±','<','>','≤','≥','%','₦'] },
    greek:  { label: 'Greek',       symbols: ['α','β','γ','δ','ε','θ','λ','μ','π','ρ','σ','φ','ω','Δ','Σ','Ω'] },
    super:  { label: 'Superscript', symbols: ['⁰','¹','²','³','⁴','⁵','⁶','⁷','⁸','⁹','⁺','⁻','ⁿ','ˣ','ʸ'] },
    sub:    { label: 'Subscript',   symbols: ['₀','₁','₂','₃','₄','₅','₆','₇','₈','₉','₊','₋','ₐ','ₓ'] },
    math:   { label: 'Advanced',    symbols: ['√','∛','∞','∑','∏','∫','∂','∇','∆','→','←','↑','↓','⇌','°','∠','⊥','∥','∈','∉','∪','∩','°C','Ω','μ'] }
};

// Tracks which field the palette will target — set whenever a symbol-eligible input gets focus
let symbolTargetField = null;

// Attach document-level focus tracker ONCE — survives page re-renders
if (!window._globalSymbolFocusAttached) {
    window._globalSymbolFocusAttached = true;

    document.addEventListener('focusin', function(e) {
        const el = e.target;
        if (!el || !el.matches) return;
        if (el.matches('#question-text, #option-a, #option-b, #option-c, #option-d')) {
            symbolTargetField = el;
            // If palette is open, update the "target" label live
            updateSymbolTargetLabel();
        }
    }, true);

    // Close palette when user clicks outside of it (and outside the toggle button)
    document.addEventListener('click', function(e) {
        const palette = document.getElementById('global-symbol-palette');
        if (!palette || palette.classList.contains('hidden')) return;
        if (e.target.closest('#global-symbol-palette')) return;
        if (e.target.closest('#symbol-toggle-btn')) return;
        closeGlobalSymbols();
    });

    console.log('✅ Global symbol palette listeners attached');
}

function toggleGlobalSymbols() {
    const palette = document.getElementById('global-symbol-palette');
    if (!palette) return;

    if (!palette.classList.contains('hidden')) {
        closeGlobalSymbols();
        return;
    }

    renderGlobalSymbolPalette();
    palette.classList.remove('hidden');
    updateSymbolTargetLabel();

    // Scroll the palette into view (top of viewport) so it's always visible
    // when the user opens it from anywhere on the page
    setTimeout(() => {
        palette.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    if (window.lucide) lucide.createIcons();
}

function closeGlobalSymbols() {
    const palette = document.getElementById('global-symbol-palette');
    if (palette) palette.classList.add('hidden');
}

function updateSymbolTargetLabel() {
    const label = document.getElementById('symbol-target-label');
    if (!label) return;

    if (!symbolTargetField || !document.body.contains(symbolTargetField)) {
        label.textContent = 'Click into a field first, then pick a symbol';
        label.className = 'text-xs font-semibold text-gray-400';
        return;
    }

    let friendlyName = 'Question Text';
    if (symbolTargetField.id.startsWith('option-')) {
        friendlyName = `Option ${symbolTargetField.id.split('-')[1].toUpperCase()}`;
    }

    label.textContent = `Inserting into: ${friendlyName}`;
    label.className = 'text-xs font-semibold text-emerald-700';
}

function renderGlobalSymbolPalette() {
    const container = document.getElementById('global-symbol-groups');
    if (!container) return;

    let html = '';
    for (const [key, group] of Object.entries(SYMBOL_GROUPS)) {
        html += `
            <div class="mb-2">
                <div class="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">${group.label}</div>
                <div class="flex flex-wrap gap-1">
                    ${group.symbols.map(sym => `
                        <button type="button"
                                onclick="insertGlobalSymbol('${sym.replace(/'/g, "\\'")}')"
                                class="w-8 h-8 bg-white border border-gray-300 rounded hover:bg-[#B80236] hover:text-white hover:border-[#B80236] transition-all text-sm font-semibold">
                            ${sym}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function insertGlobalSymbol(symbol) {
    let target = symbolTargetField;

    // Fallback: if nothing tracked yet, target the question textarea
    if (!target || !document.body.contains(target)) {
        target = document.getElementById('question-text');
    }

    if (!target) {
        showAlert('Please click into a text field first', 'error', 3000);
        return;
    }

    // Insert at caret position (or append at end if caret is unknown)
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    const text = target.value;

    target.value = text.substring(0, start) + symbol + text.substring(end);

    // Restore focus and place caret after the inserted symbol
    try {
        target.focus();
        const newPos = start + symbol.length;
        target.setSelectionRange(newPos, newPos);
    } catch (e) { /* ignore */ }

    // AUTO-CLOSE the palette so the page stays clean
    closeGlobalSymbols();
}

// ========================================
// QUESTION TYPE TOGGLE
// ========================================

function toggleQuestionOptions() {
    const type = document.getElementById('question-type').value;
    const optionsContainer = document.getElementById('options-container');
    const trueFalseContainer = document.getElementById('true-false-container');
    const essayContainer = document.getElementById('essay-container');

    [optionsContainer, trueFalseContainer, essayContainer].forEach(el => el?.classList.add('hidden'));

    if (type === 'multiple_choice') optionsContainer.classList.remove('hidden');
    else if (type === 'true_false') trueFalseContainer.classList.remove('hidden');
    else if (type === 'essay') essayContainer.classList.remove('hidden');
}

// ========================================
// QUESTION CRUD OPERATIONS
// ========================================

function addQuestion() {
    const examIdInput = document.getElementById('exam-id');
    const subjectInput = document.getElementById('subject');
    const classInput = document.getElementById('class');
    const durationInput = document.getElementById('duration');
    const questionTextarea = document.getElementById('question-text');
    const questionTypeSelect = document.getElementById('question-type');

    const examId = examIdInput ? examIdInput.value.trim() : '';
    const subject = subjectInput ? subjectInput.value : '';
    const studentClass = classInput ? classInput.value : '';
    const duration = durationInput ? parseInt(durationInput.value) : NaN;

    if (!examId || !subject || !studentClass || isNaN(duration) || duration <= 0) {
        showAlert('Please fill in all exam details (ID, Subject, Class, Duration).', 'error');
        return;
    }

    const questionText = questionTextarea ? questionTextarea.value.trim() : '';
    const questionType = questionTypeSelect ? questionTypeSelect.value : '';

    if (!questionText) {
        showAlert('Please enter the question text.', 'error');
        return;
    }

    if (!state.assessmentType) {
        state.assessmentType = 'EXAM';
    }

    const isEditingQuestion = state.editingQuestionId !== null;
    const maxQuestions = getMaxQuestions();
    const currentCount = state.currentExamData?.questions?.length || 0;

    if (!isEditingQuestion && currentCount >= maxQuestions) {
        const type = getAssessmentType();
        const config = getAssessmentConfig(type);
        showAlert(`❌ ${type} limit reached! Maximum ${maxQuestions} questions for ${config.label}.`, 'error', 5000);
        return;
    }

    const questionData = {
        id: isEditingQuestion ? state.editingQuestionId : Date.now(),
        type: questionType,
        question: questionText,
        image: currentQuestionImage || null
    };

    if (!state.currentExamData) {
        const targetExam = state.availableExams.find(ex => ex.exam_id === state.editingExamId);
        state.currentExamData = targetExam ? JSON.parse(JSON.stringify(targetExam)) : {
            exam_id: examId,
            subject: subject,
            class: studentClass,
            duration: duration,
            assessmentType: getAssessmentType(),
            created_date: new Date().toISOString().split('T')[0],
            questions: []
        };
    }

    state.currentExamData.assessmentType = getAssessmentType();

    if (questionType === 'multiple_choice') {
        const options = ['a','b','c','d'].map(l => document.getElementById(`option-${l}`)?.value.trim() || '');

        const checkedRadios = Array.from(document.querySelectorAll('input[name="correct-answer"]:checked'));
        const correctAnswers = checkedRadios.map(radio => radio.value).join(',');

        if (options.some(opt => !opt)) {
            showAlert('Please fill all options.', 'error');
            return;
        }
        if (!correctAnswers) {
            showAlert('Please select at least one correct answer.', 'error');
            return;
        }

        questionData.options = options;
        questionData.correct_answer = correctAnswers;
    } else if (questionType === 'true_false') {
        const trueFalseRadio = document.querySelector('input[name="correct-answer-tf"]:checked');
        const correctAnswer = trueFalseRadio ? trueFalseRadio.value : 'True';
        questionData.correct_answer = correctAnswer;
    } else if (questionType === 'essay') {
        const markingScheme = document.getElementById('marking-scheme')?.value.trim();
        if (!markingScheme) {
            showAlert('Please provide a marking scheme.', 'error');
            return;
        }
        questionData.marking_scheme = markingScheme;
    }

    if (state.currentExamData) {
        state.currentExamData.exam_id = examId;
        state.currentExamData.subject = subject;
        state.currentExamData.class = studentClass;
        state.currentExamData.duration = duration;
    }

    if (isEditingQuestion) {
        const index = state.currentExamData.questions.findIndex(q => q.id === state.editingQuestionId);
        if (index !== -1) {
            state.currentExamData.questions[index] = questionData;
            showAlert('Question updated successfully!', 'success');
        }
        state.editingQuestionId = null;
    } else {
        state.currentExamData.questions.push(questionData);
        const remaining = maxQuestions - state.currentExamData.questions.length;
        const type = getAssessmentType();
        if (remaining > 0) {
            showAlert(`✅ Question added! ${remaining} ${type} question${remaining !== 1 ? 's' : ''} remaining.`, 'success', 3000);
        } else {
            showAlert(`✅ Question added! ${type} is now full (${maxQuestions} questions).`, 'info', 3000);
        }
    }

    if (questionTextarea) questionTextarea.value = '';

    if (questionType === 'multiple_choice') {
        ['a','b','c','d'].forEach(l => {
            const opt = document.getElementById(`option-${l}`);
            if (opt) opt.value = '';
        });
        document.querySelectorAll('input[name="correct-answer"]').forEach(radio => radio.checked = false);
    } else if (questionType === 'true_false') {
        document.querySelectorAll('input[name="correct-answer-tf"]').forEach(radio => radio.checked = false);
        const defaultRadio = document.querySelector('input[name="correct-answer-tf"][value="True"]');
        if (defaultRadio) defaultRadio.checked = true;
    }

    const markingScheme = document.getElementById('marking-scheme');
    if (markingScheme) markingScheme.value = '';

    const addButton = document.querySelector('button[onclick="addQuestion()"]');
    if (addButton) {
        addButton.innerHTML = 'Add Question';
        addButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        addButton.classList.add('bg-[#B80236]', 'hover:bg-[#900028]');
    }

    const totalQuestions = state.currentExamData.questions.length;
    state.currentQuestionPage = Math.ceil(totalQuestions / 20);

    currentQuestionImage = null;
    const previewContainer = document.getElementById('image-preview-container');
    if (previewContainer) previewContainer.innerHTML = '';
    const fileInput = document.getElementById('question-image-input');
    if (fileInput) fileInput.value = '';

    // Clear palette state for a fresh start
    closeGlobalSymbols();
    symbolTargetField = null;

    render();
}

function editQuestion(id) {
    if (state.currentPage !== 'create-exam') return;

    if (!state.currentExamData && state.editingExamId) {
        const savedExam = state.availableExams.find(ex => ex.exam_id === state.editingExamId);
        if (savedExam) state.currentExamData = JSON.parse(JSON.stringify(savedExam));
    }

    if (!state.currentExamData) {
        showAlert('Error: No active exam data found.', 'error');
        return;
    }

    const questionToEdit = state.currentExamData.questions.find(q => String(q.id) === String(id));

    if (!questionToEdit) {
        showAlert('Question not found in this exam.', 'error');
        return;
    }

    state.editingQuestionId = id;

    if (questionToEdit.image) {
        currentQuestionImage = questionToEdit.image;
        if (typeof displayImagePreview === 'function') displayImagePreview(questionToEdit.image);
    } else {
        currentQuestionImage = null;
        const previewContainer = document.getElementById('image-preview-container');
        if (previewContainer) previewContainer.innerHTML = '';
    }

    const questionTextarea = document.getElementById('question-text');
    const questionTypeSelect = document.getElementById('question-type');
    const addButton = document.querySelector('button[onclick="addQuestion()"]');

    if (questionTextarea) questionTextarea.value = questionToEdit.question;
    if (questionTypeSelect) {
        questionTypeSelect.value = questionToEdit.type;
        if (typeof toggleQuestionOptions === 'function') toggleQuestionOptions();
    }

    if (addButton) {
        addButton.innerHTML = '<i data-lucide="save" class="w-4 h-4 mr-2 inline"></i> Update Question Details';
        addButton.classList.replace('bg-[#B80236]', 'bg-blue-600');
        addButton.classList.replace('hover:bg-[#900028]', 'hover:bg-blue-700');
        if (window.lucide) lucide.createIcons();
    }

    setTimeout(() => {
        if (questionToEdit.type === 'multiple_choice') {
            ['a', 'b', 'c', 'd'].forEach((letter, index) => {
                const input = document.getElementById(`option-${letter}`);
                if (input) input.value = questionToEdit.options?.[index] || '';
            });

            const answers = (questionToEdit.correct_answer || '').split(',');
            answers.forEach(val => {
                const radio = document.querySelector(`input[name="correct-answer"][value="${val.trim()}"]`);
                if (radio) radio.checked = true;
            });
        }
        else if (questionToEdit.type === 'true_false') {
            const tfRadio = document.querySelector(`input[name="correct-answer-tf"][value="${questionToEdit.correct_answer}"]`);
            if (tfRadio) tfRadio.checked = true;
        }
        else if (questionToEdit.type === 'essay') {
            const scheme = document.getElementById('marking-scheme');
            if (scheme) scheme.value = questionToEdit.marking_scheme || '';
        }
    }, 50);

    questionTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    questionTextarea.focus();
    showAlert('Editing Question Mode Active', 'info');
}

async function deleteQuestion(questionId) {
    console.log('🗑️ Deletion requested for ID:', questionId);

    if (!confirm('Are you sure you want to delete this question?')) return;

    const exam = state.currentExamData;

    if (!exam || !exam.questions) {
        console.error("❌ No exam data found in state.currentExamData");
        return;
    }

    const originalCount = exam.questions.length;

    exam.questions = exam.questions.filter(q => String(q.id) !== String(questionId));

    if (exam.questions.length === originalCount) {
        console.warn("⚠️ ID Mismatch. Available IDs in this exam:", exam.questions.map(q => q.id));
        showAlert('Error: Question ID not found in list.', 'error');
        return;
    }

    try {
        await saveExamToDB(exam);

        if (state.exams) {
            const idx = state.exams.findIndex(e => e.exam_id === exam.exam_id);
            if (idx !== -1) state.exams[idx] = JSON.parse(JSON.stringify(exam));
        }

        if (String(state.editingQuestionId) === String(questionId)) {
            state.editingQuestionId = null;
            const addButton = document.querySelector('button[onclick="addQuestion()"]');
            if (addButton) {
                addButton.innerHTML = 'Add Question';
                addButton.className = "w-full bg-[#B80236] text-white py-3 rounded-xl font-bold hover:bg-[#900028] transition-colors";
            }
        }

        showAlert('Question deleted successfully!', 'success');

        const totalPages = Math.ceil(exam.questions.length / 20);
        if (state.currentQuestionPage > totalPages && totalPages > 0) {
            state.currentQuestionPage = totalPages;
        }

        render();

    } catch (error) {
        console.error("❌ DB Save Error:", error);
        showAlert('Could not save deletion to database.', 'error');
    }
}

function updateQuestionField(field, value) {
    if (state.editingQuestionId) {
        const q = state.currentExamData.questions.find(q => q.id === state.editingQuestionId);
        if (q) q[field] = value;
    }
}

// ========================================
// BULK QUESTION DELETION
// ========================================

let selectedQuestionIds = new Set();

function handleQuestionCheckboxChange(checkbox) {
    const questionId = checkbox.dataset.questionId;
    const card = checkbox.closest('.question-card');

    if (checkbox.checked) {
        selectedQuestionIds.add(String(questionId));
        if (card) card.classList.add('selected');
    } else {
        selectedQuestionIds.delete(String(questionId));
        if (card) card.classList.remove('selected');
    }

    updateBulkDeleteQuestionsUI();
}

function handleSelectAllQuestions(masterCheckbox) {
    const pageCheckboxes = document.querySelectorAll('.question-checkbox');
    const selectAll = masterCheckbox.checked;

    pageCheckboxes.forEach(cb => {
        cb.checked = selectAll;
        const questionId = cb.dataset.questionId;
        const card = cb.closest('.question-card');

        if (selectAll) {
            selectedQuestionIds.add(String(questionId));
            if (card) card.classList.add('selected');
        } else {
            selectedQuestionIds.delete(String(questionId));
            if (card) card.classList.remove('selected');
        }
    });

    updateBulkDeleteQuestionsUI();
}

function updateBulkDeleteQuestionsUI() {
    const count = selectedQuestionIds.size;
    const badge = document.getElementById('selected-questions-badge');
    const deleteBtn = document.getElementById('bulk-delete-questions-btn');
    const selectAll = document.getElementById('select-all-questions');
    const pageCheckboxes = document.querySelectorAll('.question-checkbox');

    if (badge) {
        if (count > 0) {
            badge.textContent = `${count} selected`;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    if (deleteBtn) {
        deleteBtn.disabled = count === 0;

        if (count > 0) {
            deleteBtn.innerHTML = `<i data-lucide="trash-2" class="w-4 h-4"></i><span>Delete ${count} Question${count !== 1 ? 's' : ''}</span>`;
        } else {
            deleteBtn.innerHTML = `<i data-lucide="trash-2" class="w-4 h-4"></i><span>Delete Selected</span>`;
        }

        if (window.lucide) lucide.createIcons();
    }

    if (selectAll && pageCheckboxes.length > 0) {
        const checkedOnPage = Array.from(pageCheckboxes).filter(cb => cb.checked).length;
        selectAll.checked = checkedOnPage === pageCheckboxes.length;
        selectAll.indeterminate = checkedOnPage > 0 && checkedOnPage < pageCheckboxes.length;
    }
}

async function deleteSelectedQuestions() {
    const count = selectedQuestionIds.size;

    if (count === 0) {
        showAlert('No questions selected', 'error');
        return;
    }

    if (!state.currentExamData || !state.currentExamData.questions) {
        showAlert('No exam data found', 'error');
        return;
    }

    const questionWord = count === 1 ? 'question' : 'questions';
    const confirmed = confirm(
        `⚠️ Delete ${count} ${questionWord}?\n\n` +
        `This will permanently remove ${count} ${questionWord} from this exam.\n\n` +
        `This action CANNOT be undone. Continue?`
    );

    if (!confirmed) return;

    const deleteBtn = document.getElementById('bulk-delete-questions-btn');
    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Deleting...</span>';
        if (window.lucide) lucide.createIcons();
    }

    try {
        const originalCount = state.currentExamData.questions.length;

        state.currentExamData.questions = state.currentExamData.questions.filter(
            q => !selectedQuestionIds.has(String(q.id))
        );

        const deletedCount = originalCount - state.currentExamData.questions.length;

        if (state.editingQuestionId !== null &&
            selectedQuestionIds.has(String(state.editingQuestionId))) {

            state.editingQuestionId = null;

            const questionTextarea = document.getElementById('question-text');
            if (questionTextarea) questionTextarea.value = '';

            const addBtn = document.querySelector('button[onclick="addQuestion()"]');
            if (addBtn) {
                addBtn.innerHTML = '<i data-lucide="plus-circle" class="w-5 h-5"></i> Add Question to Exam';
                addBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                addBtn.classList.add('bg-[#B80236]', 'hover:bg-[#900028]');
                if (window.lucide) lucide.createIcons();
            }
        }

        selectedQuestionIds.clear();

        const totalPages = Math.ceil(state.currentExamData.questions.length / 20);
        if (state.currentQuestionPage > totalPages && totalPages > 0) {
            state.currentQuestionPage = totalPages;
        }
        if (state.currentExamData.questions.length === 0) {
            state.currentQuestionPage = 1;
        }

        await saveExamToDB(state.currentExamData);

        const idx = state.availableExams.findIndex(e => e.exam_id === state.currentExamData.exam_id);
        if (idx !== -1) {
            state.availableExams[idx] = JSON.parse(JSON.stringify(state.currentExamData));
        }

        showAlert(`✅ ${deletedCount} ${questionWord} deleted successfully!`, 'success', 3000);

        render();

    } catch (error) {
        console.error('❌ Error deleting questions:', error);
        showAlert('Failed to delete questions. Please try again.', 'error');

        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i><span>Delete Selected</span>';
            if (window.lucide) lucide.createIcons();
        }
    }
}

function clearQuestionSelection() {
    selectedQuestionIds.clear();
}

// ========================================
// EXAM CRUD OPERATIONS
// ========================================

function editExam(examId) {
    const exam = state.availableExams.find(e => e.exam_id === examId);

    if (!exam) {
        showAlert('Error: Exam data not found.', 'error');
        return;
    }

    state.editingExamId = examId;
    state.currentExamData = JSON.parse(JSON.stringify(exam));
    state.editingQuestionId = null;

    console.log('✏️ Editing exam:', state.currentExamData);

    setPage('create-exam');
}

async function deleteExam(examId) {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) return;

    try {
        await deleteExamFromDB(examId);

        state.availableExams = state.availableExams.filter(e => e.exam_id !== examId);

        showAlert('Exam deleted successfully!', 'success');

        render();

    } catch (error) {
        console.error('Error deleting exam:', error);
        showAlert('Error deleting exam. Please try again.', 'error');
    }
}

async function saveExam(event) {
    event.preventDefault();

    const examId = document.getElementById('exam-id').value.trim();
    const subject = document.getElementById('subject').value;
    const studentClass = document.getElementById('class').value;
    const duration = parseInt(document.getElementById('duration').value);

    if (!examId || !subject || !studentClass || isNaN(duration) || duration <= 0) {
        showAlert('Please fill in all exam details.', 'error');
        return;
    }

    if (!state.currentExamData || state.currentExamData.questions.length === 0) {
        showAlert('Please add at least one question.', 'error');
        return;
    }

    const createdBy = state.user?.phone_number || 'teacher';

    const exam = {
        exam_id: examId,
        subject: subject,
        class: studentClass,
        duration: duration,
        assessmentType: getAssessmentType(),
        created_date: new Date().toISOString().split('T')[0],
        created_by: createdBy,
        questions: state.currentExamData.questions
    };

    try {
        await saveExamToDB(exam);

        state.editingExamId = null;
        state.currentExamData = null;
        state.editingQuestionId = null;

        showAlert('Exam saved successfully!', 'success');

        await loadExams();

        setTimeout(() => {
            setPage('teacher');
        }, 1000);

    } catch (error) {
        console.error('❌ Error saving exam:', error);
        showAlert('Error saving exam. Please try again.', 'error');
    }
}

// ========================================
// EXAM IMPORT/EXPORT FUNCTIONS
// ========================================

async function shareExamAsCSV(examId) {
    const exam = state.availableExams.find(e => e.exam_id === examId);

    if (!exam || !exam.questions || exam.questions.length === 0) {
        showAlert('Exam not found or has no questions.', 'error');
        return;
    }

    try {
        const headers = ['exam_id', 'subject', 'class', 'duration', 'assessment_type', 'questions_json'];
        const questionsJson = JSON.stringify(exam.questions).replace(/"/g, '""');

        const dataRow = [
            `"${exam.exam_id}"`,
            `"${exam.subject}"`,
            `"${exam.class}"`,
            `"${exam.duration || 30}"`,
            `"${exam.assessmentType || 'EXAM'}"`,
            `"${questionsJson}"`
        ];

        const csvContent = headers.join(',') + '\n' + dataRow.join(',');
        const fileName = `${exam.subject.replace(/[^a-z0-9]/gi, '_')}_${exam.class}_Exam.csv`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

        // Check if it's a desktop browser (no touch, large screen)
        const isDesktop = !('ontouchstart' in window) && navigator.maxTouchPoints === 0;

        if (isDesktop) {
            // Desktop fallback: just download
            downloadCSVFallback(blob, fileName, false);
            return;
        }

        // Mobile: Capacitor native share
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Share) {
            try {
                const result = await window.Capacitor.Plugins.Filesystem.writeFile({
                    path: fileName,
                    data: csvContent,
                    directory: window.Capacitor.Plugins.Filesystem.Directory.Cache,
                    encoding: window.Capacitor.Plugins.Filesystem.Encoding.UTF8
                });

                await window.Capacitor.Plugins.Share.share({
                    title: `${exam.subject} Exam`,
                    text: `Exam: ${exam.subject} (${exam.class})`,
                    files: [result.uri]
                });
                showAlert('✅ Exam shared successfully!', 'success');
                return;
            } catch (err) {
                console.error('Capacitor share failed:', err);
                // fall through to download if share fails
            }
        }

        // Mobile: Web Share API (fallback)
        if (navigator.share && navigator.canShare) {
            try {
                const file = new File([blob], fileName, { type: 'text/csv' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `${exam.subject} Exam`,
                        text: `Exam: ${exam.subject} (${exam.class})`
                    });
                    showAlert('✅ Exam shared successfully!', 'success');
                    return;
                }
            } catch (err) {
                if (err.name !== 'AbortError') console.warn('Web Share failed', err);
            }
        }

        // Final fallback: download
        downloadCSVFallback(blob, fileName, false);

    } catch (error) {
        console.error('❌ Export error:', error);
        showAlert('Failed to export exam.', 'error');
    }
}

function shareExamWithOptions(examId) {
    shareExamAsCSV(examId);
}

async function handleTeacherImportClick(event) {
    if (event) event.preventDefault();
    console.log('📱 Import exam triggered.');

    // Capacitor native file picker
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FilePicker) {
        try {
            const result = await window.Capacitor.Plugins.FilePicker.pickFiles({
                types: ['text/csv', 'text/comma-separated-values', 'application/csv'],
                limit: 1,
                readData: true
            });

            if (result.files && result.files.length > 0) {
                const pickedFile = result.files[0];
                // Construct a File-like object from the result
                const blob = new Blob(
                    [Uint8Array.from(atob(pickedFile.data), c => c.charCodeAt(0))],
                    { type: 'text/csv' }
                );
                const file = new File([blob], pickedFile.name, { type: 'text/csv' });
                await handleExamImport(file);
            }
            return;
        } catch (err) {
            console.error('FilePicker error:', err);
            // fall through to standard input
        }
    }

    // Fallback: standard input
        // Fallback: standard input (created on demand so it works from any page)
    let input = document.getElementById('teacher-import-input');
    if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.id = 'teacher-import-input';
        input.accept = '.csv,text/csv,application/csv';
        input.style.display = 'none';
        input.addEventListener('change', handleTeacherImportFile);
        document.body.appendChild(input);
    }
    input.value = '';
    input.click();
}

// Keep the old name as an alias in case other code calls it
function handleImportExam() {
    handleTeacherImportClick();
}

function handleTeacherImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) {
        console.log('❌ No file selected');
        return;
    }

    console.log('📂 File selected:', file.name, file.size, 'bytes');

    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv') ||
                 file.type.includes('csv') ||
                 file.type.includes('comma-separated') ||
                 file.type === 'application/vnd.ms-excel';

    if (!isCSV) {
        showAlert('❌ Please select a CSV file (.csv)', 'error', 5000);
        event.target.value = '';
        return;
    }

    handleExamImport(file).finally(() => {
        event.target.value = '';
    });
}


async function handleExamImport(file) {
    try {
        console.log('📄 Starting exam import:', {
            name: file.name,
            size: file.size,
            type: file.type
        });

        showAlert(`📂 Reading file: ${file.name}...`, 'info', 3000);

        const content = await readFileAsText(file);

        console.log('📄 File content loaded, length:', content.length);

        const lines = content.split('\n').filter(line => line.trim().length > 0);
        const expectedQuestions = lines.length - 1;
        console.log(`📊 CSV has ${expectedQuestions} data rows (expected questions)`);

        showAlert('🔍 Parsing CSV data...', 'info', 2000);

        let exam;
        try {
            exam = parseCSVWithBetterHandling(content);
            console.log('✅ CSV parsing successful');
        } catch (csvError) {
            console.error('❌ CSV parsing error:', csvError);
            throw new Error('Invalid CSV format. Please use CSV files exported from this app.');
        }

        console.log('📊 Parsed exam structure:', {
            exam_id: exam.exam_id,
            subject: exam.subject,
            class: exam.class,
            questions: exam.questions?.length || 0
        });

        if (!exam.questions || !Array.isArray(exam.questions) || exam.questions.length === 0) {
            throw new Error('No questions found in the CSV file');
        }

        const validation = validateImportedExam(exam);

        if (!validation.isValid) {
            console.warn('⚠️ Import validation issues:', validation.issues);

            const issueList = validation.issues.slice(0, 3).join('\n• ');
            const moreIssues = validation.issues.length > 3 ? `\n...and ${validation.issues.length - 3} more issues` : '';

            const proceed = confirm(
                `⚠️ Import Validation Warning:\n\n` +
                `• ${issueList}${moreIssues}\n\n` +
                `Loaded: ${validation.questionCount} questions\n` +
                `Expected: ~${expectedQuestions} questions\n\n` +
                `Do you want to proceed anyway?`
            );

            if (!proceed) {
                showAlert('Import cancelled by user', 'info');
                return;
            }
        } else {
            console.log('✅ Validation passed - all questions intact!');
        }

        exam = normalizeExamData(exam);

        const validationError = validateExamStructure(exam);
        if (validationError) {
            console.error('❌ Validation error:', validationError);
            throw new Error(`Invalid file format: ${validationError.substring(0, 150)}...`);
        }

        const existing = state.availableExams.find(e => e.exam_id === exam.exam_id);
        if (existing) {
            const replace = confirm(
                `Exam "${exam.exam_id}" already exists.\n\n` +
                `Current: ${existing.questions.length} questions\n` +
                `New: ${exam.questions.length} questions\n\n` +
                `Replace it?`
            );
            if (!replace) {
                showAlert('Import cancelled', 'info');
                return;
            }
            await deleteExamFromDB(exam.exam_id);
        }

        exam.created_by = state.user?.phone_number || 'teacher';
        exam.created_date = new Date().toISOString().split('T')[0];
        exam.assessmentType = exam.assessmentType || 'EXAM';

        showAlert('💾 Saving exam to database...', 'info', 2000);
        await saveExamToDB(exam);
        await loadExams();

        showAlert(
            `✅ "${exam.subject}" imported successfully!\n\n` +
            `📚 ${exam.questions.length} questions loaded\n` +
            `📊 Class: ${exam.class}\n` +
            `⏱️ Duration: ${exam.duration} minutes\n` +
            `📋 Type: ${exam.assessmentType === 'CA' ? 'Continuous Assessment' : 'Examination'}`,
            'success',
            6000
        );

        console.log('✅ Import completed successfully');

        setTimeout(() => {
            if (state.currentPage === 'teacher') {
                render();
            }
        }, 1000);

    } catch (err) {
        console.error('❌ Import failed:', err);

        let errorMessage = 'Import failed. ';

        if (err.message.includes('timeout')) {
            errorMessage = '❌ File is too large or taking too long to read. Please try a smaller file.';
        } else if (err.message.includes('read') || err.message.includes('empty')) {
            errorMessage = '❌ Could not read the file. The file may be corrupted or empty.';
        } else if (err.message.includes('format') || err.message.includes('CSV')) {
            errorMessage = '❌ Invalid CSV format. Please use CSV files exported from this app.';
        } else if (err.message.includes('permission')) {
            errorMessage = '❌ Permission denied. Please allow storage access in Settings.';
        } else {
            errorMessage += err.message;
        }

        showAlert(errorMessage, 'error', 8000);
    } finally {
        const fileInput = document.getElementById('teacher-import-input');
        if (fileInput) {
            fileInput.value = '';
        }
    }
}

// ========================================
// BULK EXAM DELETION
// ========================================

let selectedExamIds = new Set();

function handleExamCheckboxChange(checkbox) {
    const examId = checkbox.dataset.examId;
    const card = checkbox.closest('.exam-card');

    if (checkbox.checked) {
        selectedExamIds.add(examId);
        if (card) card.classList.add('selected');
    } else {
        selectedExamIds.delete(examId);
        if (card) card.classList.remove('selected');
    }

    updateBulkDeleteUI();
}

function handleSelectAllExams(masterCheckbox) {
    const allCheckboxes = document.querySelectorAll('.exam-checkbox');
    const selectAll = masterCheckbox.checked;

    allCheckboxes.forEach(cb => {
        cb.checked = selectAll;
        const examId = cb.dataset.examId;
        const card = cb.closest('.exam-card');

        if (selectAll) {
            selectedExamIds.add(examId);
            if (card) card.classList.add('selected');
        } else {
            selectedExamIds.delete(examId);
            if (card) card.classList.remove('selected');
        }
    });

    updateBulkDeleteUI();
}

function updateBulkDeleteUI() {
    const count = selectedExamIds.size;
    const badge = document.getElementById('selected-count-badge');
    const deleteBtn = document.getElementById('bulk-delete-btn');
    const selectAll = document.getElementById('select-all-exams');
    const allCheckboxes = document.querySelectorAll('.exam-checkbox');

    if (badge) {
        if (count > 0) {
            badge.textContent = `${count} selected`;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    if (deleteBtn) {
        deleteBtn.disabled = count === 0;
    }

    if (selectAll && allCheckboxes.length > 0) {
        selectAll.checked = count === allCheckboxes.length;
        selectAll.indeterminate = count > 0 && count < allCheckboxes.length;
    }
}

async function deleteSelectedExams() {
    const count = selectedExamIds.size;

    if (count === 0) {
        showAlert('No exams selected', 'error');
        return;
    }

    const examWord = count === 1 ? 'exam' : 'exams';
    const confirmed = confirm(
        `⚠️ Delete ${count} ${examWord}?\n\n` +
        `You are about to permanently delete:\n` +
        `${Array.from(selectedExamIds).slice(0, 5).map(id => `  • ${id}`).join('\n')}` +
        `${count > 5 ? `\n  ...and ${count - 5} more` : ''}\n\n` +
        `This action CANNOT be undone. Continue?`
    );

    if (!confirmed) return;

    const deleteBtn = document.getElementById('bulk-delete-btn');
    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Deleting...</span>';
        if (window.lucide) lucide.createIcons();
    }

    let successCount = 0;
    let failedCount = 0;
    const failedExams = [];

    for (const examId of selectedExamIds) {
        try {
            await deleteExamFromDB(examId);
            state.availableExams = state.availableExams.filter(e => e.exam_id !== examId);
            successCount++;
            console.log(`✅ Deleted: ${examId}`);
        } catch (error) {
            console.error(`❌ Failed to delete ${examId}:`, error);
            failedCount++;
            failedExams.push(examId);
        }
    }

    selectedExamIds.clear();

    if (failedCount === 0) {
        showAlert(`✅ Successfully deleted ${successCount} ${successCount === 1 ? 'exam' : 'exams'}!`, 'success', 3000);
    } else {
        showAlert(
            `⚠️ Deleted ${successCount} of ${successCount + failedCount}.\n\n` +
            `Failed: ${failedExams.join(', ')}`,
            'error',
            6000
        );
    }

    await loadExams();
    render();
}

function clearExamSelection() {
    selectedExamIds.clear();
}

// ========================================
// EXPORTS
// ========================================

// CA/Exam
window.toggleAssessmentType = toggleAssessmentType;
window.getAssessmentType = getAssessmentType;
window.getMaxQuestions = getMaxQuestions;
window.getAssessmentConfig = getAssessmentConfig;

// Global symbol palette
window.toggleGlobalSymbols = toggleGlobalSymbols;
window.closeGlobalSymbols = closeGlobalSymbols;
window.insertGlobalSymbol = insertGlobalSymbol;
window.toggleQuestionOptions = toggleQuestionOptions;

// Question CRUD
window.addQuestion = addQuestion;
window.editQuestion = editQuestion;
window.deleteQuestion = deleteQuestion;
window.updateQuestionField = updateQuestionField;

// Bulk Question Deletion
window.handleQuestionCheckboxChange = handleQuestionCheckboxChange;
window.handleSelectAllQuestions = handleSelectAllQuestions;
window.updateBulkDeleteQuestionsUI = updateBulkDeleteQuestionsUI;
window.deleteSelectedQuestions = deleteSelectedQuestions;
window.clearQuestionSelection = clearQuestionSelection;

// Exam CRUD
window.editExam = editExam;
window.deleteExam = deleteExam;
window.saveExam = saveExam;

// Import/Export
window.shareExamAsCSV = shareExamAsCSV;
window.shareExamWithOptions = shareExamWithOptions;
window.handleImportExam = handleImportExam;
window.handleExamImport = handleExamImport;

// Bulk Exam Deletion
window.handleExamCheckboxChange = handleExamCheckboxChange;
window.handleSelectAllExams = handleSelectAllExams;
window.updateBulkDeleteUI = updateBulkDeleteUI;
window.deleteSelectedExams = deleteSelectedExams;
window.clearExamSelection = clearExamSelection;
window.handleTeacherImportClick = handleTeacherImportClick;
window.handleTeacherImportFile = handleTeacherImportFile;

console.log('✅ teacher.actions.js loaded');