// student.render.js — TOTAL REDESIGN v3 "Ink & Aurora" (2026)
// ============================================================
// Visual redesign ONLY. All logic, hooks and behaviour preserved:
//  - Info form: ids student-info-form / student-name / student-class / student-arms,
//    onsubmit=submitStudentInfo(event), Arms REQUIRED <select> A–S (R fixed),
//    renderAuthBackground(), "Proceed to Exams", "Back to Home" -> setPage('home')
//  - Dashboard: class + date filter via st2Visible, Back -> setPage('student-info'),
//    "Select Your Exam", startExamSafe(exam_id)
//  - Exam list: Home button, CA / Exams Today tabs with counts, switchStudentTab(),
//    st2VisibleLists() re-filtering (defence in depth)
//  - Exam interface: fixed full-screen layout, #timer-display + formatTime(),
//    changeQuestion(-1/+1), goToQuestion(i), submitExam(), updateAnswer(),
//    MCQ 2x2 + True/False direct-DOM onclick logic (same mechanism),
//    isValidImageSrc + openImageModal(), sidebar palette, console.log kept
//  - Result modal: #result-modal, duration_taken, 3-tier message, toggleAnswers(),
//    renderDetailedAnswers(result), closeResultModal(), EXIT / NEXT / RETRY
//  - Gate: st2Gate() shows limit / shuffled-from-bank on every card
//  - All window.* exports unchanged
// ============================================================
const ST2_CSS = `
:root{--st2-ink:#0B1226;--st2-ink2:#1E293B;--st2-mute:#64748B;--st2-line:#E5E9F2;--st2-brand:#4F46E5;--st2-brand2:#7C3AED;--st2-mint:#10B981;--st2-rose:#F43F5E;--st2-amber:#F59E0B}
.st2-page,.st2-exam,.st2-modal{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:var(--st2-ink);-webkit-font-smoothing:antialiased}
.st2-page{min-height:100vh;background:radial-gradient(900px 420px at 6% -8%,rgba(99,102,241,.24),transparent 60%),radial-gradient(800px 380px at 100% 0%,rgba(236,72,153,.14),transparent 55%),radial-gradient(700px 420px at 50% 112%,rgba(16,185,129,.13),transparent 60%),#F5F6FB}
@keyframes st2-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes st2-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.st2-rise{animation:st2-rise .5s cubic-bezier(.2,.8,.2,1) both}
.st2-card{background:rgba(255,255,255,.96);backdrop-filter:blur(10px);border:1px solid var(--st2-line);border-radius:26px;box-shadow:0 24px 60px -20px rgba(15,23,42,.22),0 2px 6px rgba(15,23,42,.04)}
.st2-wrap{max-width:1080px;margin:0 auto;padding:0 20px}
.st2-top{position:relative;overflow:hidden;color:#fff;background:linear-gradient(120deg,#0B1226 0%,#1E1B4B 40%,#3730A3 75%,#6D28D9 100%);padding:26px 0 70px;border-radius:0 0 34px 34px}
.st2-top:before{content:"";position:absolute;right:-60px;top:-80px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,.55),transparent 65%)}
.st2-top:after{content:"";position:absolute;left:12%;bottom:-120px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(56,189,248,.35),transparent 65%)}
.st2-top>*{position:relative;z-index:1}
.st2-top-row{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap}
.st2-avatar{width:54px;height:54px;border-radius:18px;background:linear-gradient(135deg,#A5B4FC,#F0ABFC);color:#1E1B4B;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;box-shadow:0 10px 24px rgba(0,0,0,.28)}
.st2-hello{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#C7D2FE}
.st2-name{font-size:26px;font-weight:900;letter-spacing:-.02em;line-height:1.15;margin-top:2px}
.st2-sub{margin-top:8px;display:flex;gap:8px;flex-wrap:wrap}
.st2-ghost{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);color:#fff;border-radius:14px;padding:11px 18px;font-weight:800;font-size:13px;cursor:pointer;backdrop-filter:blur(6px);transition:all .2s}
.st2-ghost:hover{background:rgba(255,255,255,.26);transform:translateY(-1px)}
.st2-pull{margin-top:-46px;position:relative;z-index:2;padding-bottom:50px}
.st2-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:.01em}
.st2-pill-violet{background:#EDE9FE;color:#5B21B6}.st2-pill-emerald{background:#D1FAE5;color:#065F46}
.st2-pill-rose{background:#FFE4E6;color:#9F1239}.st2-pill-gray{background:#F1F5F9;color:#475569}.st2-pill-white{background:rgba(255,255,255,.16);color:#fff;border:1px solid rgba(255,255,255,.22)}
.st2-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;border:none;border-radius:16px;padding:14px 22px;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 14px 26px -8px rgba(79,70,229,.55);transition:all .2s}
.st2-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}.st2-btn:active{transform:scale(.98)}
.st2-btn-ca{background:linear-gradient(135deg,#059669,#10B981);box-shadow:0 14px 26px -8px rgba(5,150,105,.55)}
.st2-btn-rose{background:linear-gradient(135deg,#E11D48,#F43F5E);box-shadow:0 14px 26px -8px rgba(225,29,72,.5)}
.st2-input{width:100%;padding:14px 16px;border:1.5px solid #E2E8F0;border-radius:16px;background:#F8FAFC;outline:none;font-weight:600;font-size:15px;color:var(--st2-ink);transition:all .2s;box-sizing:border-box}
.st2-input:focus{border-color:#6366F1;background:#fff;box-shadow:0 0 0 4px rgba(99,102,241,.16)}
.st2-label{font-size:12px;font-weight:800;color:#334155;margin-bottom:7px;display:block;letter-spacing:.04em;text-transform:uppercase}
.st2-badge-icon{width:68px;height:68px;border-radius:22px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;color:#fff;background:linear-gradient(135deg,#4F46E5,#7C3AED 60%,#DB2777);box-shadow:0 18px 34px -10px rgba(79,70,229,.6);animation:st2-float 4s ease-in-out infinite}
.st2-linkbtn{width:100%;background:none;border:none;color:var(--st2-mute);font-size:13px;font-weight:700;padding:10px;cursor:pointer}
.st2-linkbtn:hover{color:var(--st2-brand);text-decoration:underline}
.st2-panel{background:#fff;border:1px solid var(--st2-line);border-radius:26px;box-shadow:0 24px 60px -24px rgba(15,23,42,.25);padding:24px}
.st2-panel-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap}
.st2-h2{font-size:22px;font-weight:900;letter-spacing:-.02em;margin:0}
.st2-count{padding:8px 16px;border-radius:999px;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;font-weight:800;font-size:13px}
.st2-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:18px}
.st2-ex{--ac:#4F46E5;--ac2:#7C3AED;position:relative;background:#fff;border:1px solid var(--st2-line);border-radius:22px;padding:20px 20px 20px 24px;display:flex;flex-direction:column;overflow:hidden;transition:all .25s;box-shadow:0 6px 18px -10px rgba(15,23,42,.18)}
.st2-ex:before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:linear-gradient(180deg,var(--ac),var(--ac2))}
.st2-ex:hover{transform:translateY(-4px);box-shadow:0 24px 40px -18px rgba(15,23,42,.3);border-color:transparent}
.st2-ex-ca{--ac:#059669;--ac2:#34D399}.st2-ex-exam{--ac:#E11D48;--ac2:#FB7185}
.st2-ex-title{font-size:21px;font-weight:900;letter-spacing:-.02em;margin:0;color:var(--st2-ink)}
.st2-ex-id{color:var(--st2-mute);font-weight:700;font-size:13px;margin:4px 0 0;word-break:break-all}
.st2-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.st2-meta span{display:inline-flex;align-items:center;gap:6px;background:#F1F5F9;color:#475569;border-radius:10px;padding:6px 10px;font-size:12px;font-weight:700}
.st2-sched{font-size:12px;color:var(--st2-mute);margin-top:10px;font-weight:600}
.st2-tabs{display:flex;gap:6px;background:#fff;border:1px solid var(--st2-line);border-radius:20px;padding:6px;box-shadow:0 18px 40px -22px rgba(15,23,42,.3);margin-bottom:22px}
.st2-tab{flex:1;border:none;background:transparent;color:#64748B;font-weight:800;font-size:14px;padding:14px 12px;border-radius:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s}
.st2-tab:hover{background:#F1F5F9}
.st2-tab-on-ca{background:linear-gradient(135deg,#059669,#10B981)!important;color:#fff!important;box-shadow:0 12px 22px -8px rgba(5,150,105,.6)}
.st2-tab-on-ex{background:linear-gradient(135deg,#E11D48,#F43F5E)!important;color:#fff!important;box-shadow:0 12px 22px -8px rgba(225,29,72,.55)}
.st2-tab-n{font-size:11px;padding:2px 9px;border-radius:999px;background:#E2E8F0;color:#334155}
.st2-tab-on-ca .st2-tab-n,.st2-tab-on-ex .st2-tab-n{background:rgba(255,255,255,.28);color:#fff}
.st2-row-card{display:flex;gap:18px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.st2-empty{text-align:center;padding:56px 20px;background:#fff;border:1.5px dashed #CBD5E1;border-radius:24px}
.st2-empty-ic{width:84px;height:84px;margin:0 auto 14px;border-radius:28px;background:#F1F5F9;display:flex;align-items:center;justify-content:center;color:#94A3B8}
/* ---------- EXAM WORKSPACE ---------- */
.st2-exam{position:fixed;inset:0;display:flex;flex-direction:column;height:100vh;background:radial-gradient(900px 400px at 0% 0%,rgba(99,102,241,.14),transparent 60%),#F3F5FB;overflow:hidden;margin:0;padding:0}
.st2-ehead{position:relative;flex-shrink:0;z-index:40;background:linear-gradient(100deg,#0B1226 0%,#1E1B4B 50%,#4338CA 100%);padding:10px 18px;color:#fff}
.st2-ehead:after{content:"";position:absolute;inset:0;opacity:.07;pointer-events:none;background-image:radial-gradient(circle,#fff 1px,transparent 1px);background-size:18px 18px}
.st2-ehead-in{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center;gap:12px}
.st2-timer{border-radius:16px;padding:7px 16px;background:linear-gradient(135deg,#FDE68A,#F59E0B);border:2px solid rgba(255,255,255,.55);box-shadow:0 8px 20px rgba(0,0,0,.28);text-align:center;color:#1F2937;flex-shrink:0}
.st2-timer.st2-low{background:linear-gradient(135deg,#FECACA,#EF4444);color:#450A0A}
.st2-timer small{display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
.st2-timer b{display:block;font-size:22px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:900;line-height:1.1}
.st2-ebody{display:flex;flex:1;overflow:hidden;gap:12px;padding:12px;min-height:0}
.st2-side{display:none;flex-direction:column;width:228px;flex-shrink:0;background:#fff;border:1px solid var(--st2-line);border-radius:22px;box-shadow:0 10px 30px -16px rgba(15,23,42,.25);padding:16px;overflow-y:auto}
.st2-only-mobile{display:inline}
@media(min-width:1024px){.st2-side{display:flex}.st2-only-mobile{display:none}}
.st2-qpanel{flex:1;background:#fff;border:1px solid var(--st2-line);border-radius:22px;box-shadow:0 10px 30px -16px rgba(15,23,42,.25);display:flex;flex-direction:column;overflow:hidden;min-height:0}
.st2-qhead{flex-shrink:0;padding:20px 24px 18px;border-bottom:1px solid #EEF1F7;background:linear-gradient(180deg,#FAFAFF,#fff)}
.st2-qnum{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#4F46E5;background:#EEF2FF;border-radius:999px;padding:5px 12px;margin-bottom:12px}
.st2-qtext{margin:0;font-size:18px;font-weight:700;color:#0F172A;line-height:1.65;padding-left:14px;border-left:4px solid;border-image:linear-gradient(180deg,#4F46E5,#DB2777) 1}
.st2-qopts{flex:1;display:flex;align-items:center;padding:18px 24px;overflow-y:auto;min-height:0}
.st2-optrow{display:flex;gap:12px;width:100%}
@media(max-width:560px){.st2-optrow{flex-direction:column}.st2-qtext{font-size:16px}.st2-qhead,.st2-qopts{padding-left:14px;padding-right:14px}.st2-name{font-size:21px}}
.st2-efoot{flex-shrink:0;padding:6px 12px 12px;z-index:30}
.st2-efoot-in{background:#fff;border:1px solid var(--st2-line);border-radius:18px;padding:10px 14px;box-shadow:0 10px 30px -16px rgba(15,23,42,.3);display:flex;justify-content:space-between;align-items:center}
.st2-nav{display:flex;align-items:center;gap:7px;padding:10px 22px;font-size:13px;font-weight:800;border:none;border-radius:12px;cursor:pointer;transition:all .2s}
.st2-nav:hover{transform:translateY(-1px)}
.st2-prev{background:#F1F5F9;color:#334155}
.st2-next{background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;box-shadow:0 10px 20px -8px rgba(79,70,229,.6)}
.st2-submit{background:linear-gradient(135deg,#059669,#10B981);color:#fff;box-shadow:0 10px 20px -8px rgba(5,150,105,.6)}
.st2-legend{display:flex;align-items:center;gap:8px;font-size:11px;color:#64748B;font-weight:600}
.st2-legend i{width:12px;height:12px;border-radius:4px;display:inline-block}
/* ---------- RESULT MODAL ---------- */
.st2-modal-bg{background:radial-gradient(700px 400px at 20% 10%,rgba(124,58,237,.55),transparent 60%),radial-gradient(600px 400px at 90% 90%,rgba(56,189,248,.35),transparent 60%),rgba(8,12,30,.9);backdrop-filter:blur(6px)}
.st2-mcard{background:#fff;border-radius:28px;box-shadow:0 40px 90px -20px rgba(0,0,0,.6);width:100%;max-width:400px;max-height:96vh;overflow-y:auto}
.st2-mhead{position:relative;overflow:hidden;color:#fff;padding:22px 20px 20px;border-radius:28px 28px 0 0;background:linear-gradient(135deg,#0B1226,#312E81 55%,#6D28D9)}
.st2-mhead.st2-fail{background:linear-gradient(135deg,#1F1235,#7F1D1D 60%,#EA580C)}
.st2-mhead:before{content:"";position:absolute;right:-50px;top:-50px;width:190px;height:190px;border-radius:50%;background:rgba(255,255,255,.1)}
.st2-ring{position:relative;width:132px;height:132px;margin:10px auto 8px}
.st2-ring svg{transform:rotate(-90deg)}
.st2-ring-in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.st2-stat{border-radius:16px;padding:12px 6px;text-align:center;border:1.5px solid}
.st2-stat-ic{width:30px;height:30px;margin:0 auto 6px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff}
.st2-mbtn{border:none;color:#fff;padding:12px;border-radius:14px;font-weight:800;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .2s;letter-spacing:.04em}
.st2-mbtn:active{transform:scale(.96)}
`;
function st2Inject(){ if(document.getElementById('st2-css')) return; const s=document.createElement('style'); s.id='st2-css'; s.textContent=ST2_CSS; document.head.appendChild(s); }
function st2Esc(v){ return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function st2Gate(exam){
  if(!exam) return '';
  const isCA=(exam.assessmentType||'EXAM')==='CA';
  const limit=exam.questionLimit || (isCA ? Math.min(20, exam.questions?exam.questions.length:0) : null);
  const bank=exam.questions?exam.questions.length:0;
  if(limit) return `<span class="st2-pill st2-pill-violet">🎯 ${limit} questions${bank>limit?` • shuffled from ${bank}`:''}</span>`;
  return `<span class="st2-pill st2-pill-gray">${bank} questions</span>`;
}
// ============================================================
// VISIBILITY — DEFENCE IN DEPTH
//  - CLASS: exam.class must match student.class (case / space / "SS 1" vs "SS1" tolerant)
//  - DATE:  EXAM → scheduledDate must be TODAY (YYYY-MM-DD)
//           CA   → no date gate (CAs show once uploaded, as in original actions)
//  - If student class is missing, NOTHING is visible (never "show all").
// Render re-checks this even if state.caExams / todayExams / availableExams
// was filled the wrong way — the screen can never leak another class/day.
// ============================================================
function st2NormClass(s){ return String(s ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); }
function st2Today(){ return new Date().toISOString().split('T')[0]; } // same as student.actions.js
function st2Visible(exam, student){
  if(!exam || !student || !student.class) return false;
  if(st2NormClass(exam.class) !== st2NormClass(student.class)) return false;
  const type = (exam.assessmentType || 'EXAM');
  if(type === 'CA') return true; // CAs: class only, no date gate (original behaviour)
  if(!exam.scheduledDate) return false; // EXAM never scheduled → never visible
  return String(exam.scheduledDate).slice(0,10) === st2Today();
}
function st2VisibleLists(state){
  const student = state.studentInfo || {};
  // Prefer the already-split lists, but RE-FILTER them — never trust them blindly.
  let ca = (state.caExams || []).filter(e => st2Visible(e, student));
  let today = (state.todayExams || []).filter(e => st2Visible(e, student));
  // Fallback: if the split lists are empty but availableExams has items
  // (e.g. direct navigation / dashboard), derive from availableExams with the SAME rules.
  if(ca.length===0 && today.length===0 && (state.availableExams||[]).length>0){
    const all=(state.availableExams||[]).filter(e => st2Visible(e, student));
    ca = all.filter(e => (e.assessmentType||'EXAM')==='CA');
    today = all.filter(e => (e.assessmentType||'EXAM')!=='CA');
  }
  return { ca, today };
}
function st2Answered(exam, answers){ if(!exam||!exam.questions) return 0; return exam.questions.filter(q=>answers&&answers[q.id]!==undefined&&String(answers[q.id]).trim()!=='').length; }

// ---- small shared render helper (presentation only) ----
function st2ScheduleLine(exam){
  return `📅 ${st2Esc(exam.scheduledDate || ( (exam.assessmentType||"EXAM")==="CA" ? "Available now (CA)" : "Not scheduled" ))} • Class: ${st2Esc(exam.class||"")}`;
}

// student.render.js - Student Render Functions
// Renders student pages (info form, exam list, exam interface, results)

function renderStudentInfoForm(state) {
    st2Inject();
    const studentInfo = { name: '', class: '', arms: '' };

    return `
        <div class="st2-page flex items-center justify-center p-4 relative" style="min-height:100vh;display:flex;align-items:center;justify-content:center">
            ${renderAuthBackground()}

            <div class="relative z-10 st2-card st2-rise p-6 md:p-8 w-full max-w-md animate-fadeIn" style="position:relative;z-index:10;width:100%;max-width:440px;padding:32px 28px">
                <div class="text-center mb-6" style="text-align:center;margin-bottom:24px">
                    <div class="st2-badge-icon">
                        <i data-lucide="user-check" class="w-8 h-8 text-white"></i>
                    </div>
                    <h1 style="font-size:28px;font-weight:900;letter-spacing:-.03em;margin:0 0 6px">Student Information</h1>
                    <p style="color:#64748B;font-size:14px;font-weight:500;margin:0">Please enter your details to start the exam.</p>
                </div>
                <form id="student-info-form" onsubmit="submitStudentInfo(event)" style="display:flex;flex-direction:column;gap:16px">
                    <div>
                        <label for="student-name" class="st2-label">Full Name</label>
                        <input type="text" 
                               id="student-name" 
                               name="student-name"
                               value=""
                               class="st2-input" 
                               placeholder="e.g., John Musa" 
                               required />
                    </div>
                    <div>
                        <label for="student-class" class="st2-label">Class</label>
                        <select id="student-class" 
                                class="st2-input" 
                                required>
                            <option value="">Select Class</option>
                            <option value="SS 1">SS 1</option>
                            <option value="SS 2">SS 2</option>
                            <option value="SS 3">SS 3</option>
                        </select>
                    </div>
                    <div>
                        <label for="student-arms" class="st2-label">Arms <span style="color:#E11D48">*</span> <span style="font-size:11px;color:#94A3B8;font-weight:600;text-transform:none;letter-spacing:0">— required</span></label>
                        <select id="student-arms" 
                                class="st2-input" 
                                required>
                            <option value="">Select Arms</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="E">E</option>
                            <option value="F">F</option>
                            <option value="G">G</option>
                            <option value="H">H</option>
                            <option value="I">I</option>
                            <option value="J">J</option>
                            <option value="K">K</option>
                            <option value="L">L</option>
                            <option value="M">M</option>
                            <option value="N">N</option>
                            <option value="O">O</option>
                            <option value="P">P</option>
                            <option value="Q">Q</option>
                            <option value="R">R</option>
                            <option value="S">S</option>
                        </select>
                    </div>
                    <button type="submit" class="st2-btn" style="width:100%;padding:16px;font-size:15px;margin-top:4px">
                        Proceed to Exams
                        <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                    <button type="button" onclick="setPage('home')" class="st2-linkbtn">
                        Back to Home
                    </button>
                </form>
            </div>
        </div>
    `;
}

function renderStudentDashboard(state) {
    st2Inject();
    const student = state.studentInfo;
    // Class + scheduled-date gate, via st2Visible() (same rule as submitStudentInfo).
    const filteredExams = (state.availableExams || []).filter(exam => st2Visible(exam, student));

    const examListHtml = filteredExams.length > 0 ? filteredExams.map(exam => `
        <div class="st2-ex ${(exam.assessmentType||'EXAM')==='CA' ? 'st2-ex-ca' : 'st2-ex-exam'}" style="height:100%">
            <div style="flex:1">
                <p class="st2-ex-title">${st2Esc(exam.subject)}</p>
                <p class="st2-ex-id">${st2Esc(exam.exam_id)}</p>
                <div style="margin-top:10px">${st2Gate(exam)}</div>
                <div class="st2-meta">
                    <span><i data-lucide="list" class="w-4 h-4"></i> ${exam.questions.length} Questions</span>
                    <span><i data-lucide="clock" class="w-4 h-4"></i> ${exam.duration} mins</span>
                    <span><i data-lucide="school" class="w-4 h-4"></i> ${exam.class}</span>
                </div>
            </div>
            <button onclick="startExamSafe('${exam.exam_id}')" class="st2-btn ${(exam.assessmentType||'EXAM')==='CA' ? 'st2-btn-ca' : 'st2-btn-rose'}" style="margin-top:18px;width:100%">
                Start Exam
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('') : `
        <div class="st2-empty" style="grid-column:1/-1">
            <div class="st2-empty-ic"><i data-lucide="inbox" class="w-10 h-10"></i></div>
            <p style="font-size:18px;font-weight:800;color:#475569;margin:0">No exams available for your class.</p>
        </div>
    `;

    return `
        <div class="st2-page">
            <header class="st2-top">
                <div class="st2-wrap">
                    <div class="st2-top-row">
                        <div style="display:flex;align-items:center;gap:14px">
                            <div class="st2-avatar">${st2Esc(String(student.name||'S').charAt(0).toUpperCase())}</div>
                            <div>
                                <div class="st2-hello">Student Portal</div>
                                <h1 class="st2-name" style="margin:0">Welcome, ${st2Esc(student.name)}</h1>
                                <div class="st2-sub"><span class="st2-pill st2-pill-white">🎓 Class: ${st2Esc(student.class)}${st2Esc(student.arms)}</span></div>
                            </div>
                        </div>
                        <button onclick="setPage('student-info')" class="st2-ghost">
                            <i data-lucide="arrow-left" class="w-4 h-4"></i> Back
                        </button>
                    </div>
                </div>
            </header>
            
            <main class="st2-wrap st2-pull">
                <div class="st2-panel st2-rise">
                    <div class="st2-panel-head">
                        <h2 class="st2-h2">Select Your Exam</h2>
                        <span class="st2-count">${filteredExams.length} Total</span>
                    </div>
                    
                    <div class="st2-grid">
                        ${examListHtml}
                    </div>
                </div>
            </main>
        </div>
    `;
}

function renderStudentExamList(state) {
    st2Inject();
    const { name = 'Student', class: studentClass = '', arms = '' } = state.studentInfo || {};

    // Re-filtered by class + scheduled date inside the render (see st2Visible).
    const _vis = st2VisibleLists(state);
    const caExams = _vis.ca;
    const todayExams = _vis.today;

    // Default tab: CAs if any exist, else Exams Today
    const activeTab = state.studentTab || (caExams.length > 0 ? 'ca' : 'today');

    // ---- Render CAs tab ----
    const caListHtml = caExams.length > 0
        ? caExams.map(exam => `
            <div class="st2-ex st2-ex-ca">
                <div class="st2-row-card">
                    <div style="flex:1;min-width:230px">
                        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                            <h3 class="st2-ex-title" style="font-size:24px">${st2Esc(exam.subject)}</h3>
                            <span class="st2-pill st2-pill-emerald">CA</span>
                        </div>
                        <p class="st2-ex-id">${st2Esc(exam.exam_id)}</p>
                        <div style="margin-top:10px">${st2Gate(exam)}</div>
                        <div class="st2-sched">${st2ScheduleLine(exam)}</div>
                        <div class="st2-meta">
                            <span><i data-lucide="list" class="w-4 h-4"></i> ${exam.questions.length} in bank</span>
                            <span><i data-lucide="clock" class="w-4 h-4"></i> ${exam.duration} mins</span>
                            <span><i data-lucide="school" class="w-4 h-4"></i> ${exam.class}</span>
                        </div>
                    </div>
                    <button onclick="startExamSafe('${exam.exam_id}')" class="st2-btn st2-btn-ca" style="padding:16px 30px;font-size:16px;white-space:nowrap">
                        Start CA →
                    </button>
                </div>
            </div>
        `).join('')
        : `
            <div class="st2-empty">
                <div class="st2-empty-ic"><i data-lucide="clipboard-check" class="w-10 h-10"></i></div>
                <p style="font-size:18px;color:#475569;margin:0;font-weight:600">No CAs available for</p>
                <p style="font-size:32px;font-weight:900;color:#059669;margin:8px 0 0;letter-spacing:-.02em">${studentClass}${arms || ''}</p>
                <p style="color:#94A3B8;margin-top:18px;font-weight:500">Your teacher will share CAs when they're ready.</p>
            </div>
        `;

    // ---- Render EXAMS TODAY tab ----
    const todayListHtml = todayExams.length > 0
        ? todayExams.map(exam => `
            <div class="st2-ex st2-ex-exam">
                <div class="st2-row-card">
                    <div style="flex:1;min-width:230px">
                        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                            <h3 class="st2-ex-title" style="font-size:24px">${st2Esc(exam.subject)}</h3>
                            <span class="st2-pill st2-pill-rose">EXAM</span>
                        </div>
                        <p class="st2-ex-id">${st2Esc(exam.exam_id)}</p>
                        <div style="margin-top:10px">${st2Gate(exam)}</div>
                        <div class="st2-sched">${st2ScheduleLine(exam)}</div>
                        <div class="st2-meta">
                            <span><i data-lucide="list" class="w-4 h-4"></i> ${exam.questions.length} in bank</span>
                            <span><i data-lucide="clock" class="w-4 h-4"></i> ${exam.duration} mins</span>
                            <span><i data-lucide="school" class="w-4 h-4"></i> ${exam.class}</span>
                        </div>
                    </div>
                    <button onclick="startExamSafe('${exam.exam_id}')" class="st2-btn st2-btn-rose" style="padding:16px 30px;font-size:16px;white-space:nowrap">
                        Start Exam →
                    </button>
                </div>
            </div>
        `).join('')
        : `
            <div class="st2-empty">
                <div class="st2-empty-ic"><i data-lucide="calendar-x" class="w-10 h-10"></i></div>
                <p style="font-size:22px;font-weight:900;color:#334155;margin:0">No exams scheduled for today</p>
                <p style="color:#94A3B8;margin-top:10px;font-weight:500">Check back on your exam day.</p>
            </div>
        `;

    return `
        <div class="st2-page">
            <header class="st2-top">
                <div class="st2-wrap">
                    <div class="st2-top-row">
                        <div style="display:flex;align-items:center;gap:14px">
                            <div class="st2-avatar">${st2Esc(String(name||'S').charAt(0).toUpperCase())}</div>
                            <div>
                                <div class="st2-hello">Student Portal</div>
                                <h1 class="st2-name" style="margin:0">Welcome, ${st2Esc(name)}!</h1>
                                <div class="st2-sub"><span class="st2-pill st2-pill-white">🎓 Class: ${st2Esc(studentClass)}${st2Esc(arms)}</span></div>
                            </div>
                        </div>
                        <button onclick="setPage('home')" class="st2-ghost">
                            <i data-lucide="home" class="w-5 h-5"></i> Home
                        </button>
                    </div>
                </div>
            </header>

            <main class="st2-wrap st2-pull">
                <!-- Tabs -->
                <div class="st2-tabs">
                    <button onclick="switchStudentTab('ca')" class="st2-tab ${activeTab === 'ca' ? 'st2-tab-on-ca' : ''}">
                        <i data-lucide="clipboard-check" class="w-5 h-5"></i>
                        CAs
                        <span class="st2-tab-n">${caExams.length}</span>
                    </button>
                    <button onclick="switchStudentTab('today')" class="st2-tab ${activeTab === 'today' ? 'st2-tab-on-ex' : ''}">
                        <i data-lucide="calendar-check" class="w-5 h-5"></i>
                        Exams Today
                        <span class="st2-tab-n">${todayExams.length}</span>
                    </button>
                </div>

                <div class="st2-rise" style="display:flex;flex-direction:column;gap:18px">
                    ${activeTab === 'ca' ? caListHtml : todayListHtml}
                </div>
            </main>
        </div>
    `;
}

function renderExamInterface(state) {
    st2Inject();
    const student = state.studentInfo || {};
    const welcomeName = student.name || 'Student';
    const studentClassArms = (student.class && student.arms) ? `${student.class} ${student.arms}` : 'N/A';

    const exam = state.shuffledExam || state.selectedExam;
    // Never render an exam that is not for this class / today, even if it was
    // forced into state. Same gate as startExamSafe() in actions.
    if (exam && !st2Visible(exam, state.studentInfo || {})) {
        return `<div class="st2-page" style="display:flex;align-items:center;justify-content:center;padding:24px"><div class="st2-card" style="padding:40px;text-align:center;max-width:420px"><div class="st2-empty-ic" style="background:#FFE4E6;color:#E11D48"><i data-lucide="lock" class="w-10 h-10"></i></div><p style="font-size:20px;font-weight:900;margin:0">This exam is not available</p><p style="color:#64748B;margin:10px 0 18px">It is not scheduled for your class today. Please check with the exam office.</p><button onclick="setPage('student-exam-list')" class="st2-btn">← Back to Exams</button></div></div>`;
    }

    if (!exam || !exam.questions || exam.questions.length === 0) {
        return `<div style="padding:40px;text-align:center;">Error: No Exam Loaded</div>`;
    }

    const currentQuestion = exam.questions[state.currentQuestionIndex];
    if (!currentQuestion) { return `<div class="st2-page" style="display:flex;align-items:center;justify-content:center;padding:24px"><div class="st2-card" style="padding:36px;text-align:center"><p style="font-size:18px;font-weight:800;margin:0">Question not found</p><button onclick="goToQuestion(0)" class="st2-btn" style="margin-top:16px">Back to Question 1</button></div></div>`; }
    const totalQuestions = exam.questions.length;
    const currentQuestionNumber = state.currentQuestionIndex + 1;
    const progress = (currentQuestionNumber / totalQuestions) * 100;
    const lowTime = (Number(state.timeRemaining) || 0) <= 300;

    console.log('📝 Current Question:', {
        id: currentQuestion.id,
        question: String(currentQuestion.question || '').substring(0, 50),
        type: currentQuestion.type,
        hasImage: !!currentQuestion.image,
        imageLength: currentQuestion.image ? currentQuestion.image.length : 0,
        imagePreview: currentQuestion.image ? currentQuestion.image.substring(0, 100) : 'NO IMAGE'
    });

    let optionsContent = '';
    const questionType = currentQuestion.type ? currentQuestion.type.toLowerCase().trim() : '';
    const qid = currentQuestion.id;

    /* =========================================================
       MULTIPLE CHOICE
       - 2 columns x 2 rows (A+B top row, C+D bottom row); stacks on phones
       - onclick directly updates DOM styles immediately (no re-render needed)
       - Selected = solid indigo + white text + white checkmark badge
    ========================================================= */
    if (questionType === 'multiple_choice') {
        const opts = currentQuestion.options || [];

        const buildClick = (label) => `
            (function(){
                var wrap = document.getElementById('opts-${qid}');
                if(!wrap) return;
                wrap.querySelectorAll('[data-opt]').forEach(function(lbl){
                    var mine = lbl.getAttribute('data-opt') === '${label}';
                    lbl.style.background = mine ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : '#F8FAFC';
                    lbl.style.boxShadow = mine ? '0 12px 22px -8px rgba(79,70,229,.55)' : 'inset 0 0 0 1.5px #E2E8F0';
                    var b = lbl.querySelector('[data-b]');
                    var t = lbl.querySelector('[data-t]');
                    var c = lbl.querySelector('[data-c]');
                    if(b){ b.style.background=mine?'#fff':'#E2E8F0'; b.style.color=mine?'#4F46E5':'#475569'; }
                    if(t){ t.style.color=mine?'#fff':'#1E293B'; }
                    if(c){ c.style.display=mine?'flex':'none'; }
                });
                updateAnswer('${qid}', '${label}');
            })()`.replace(/\n\s+/g, ' ');

        optionsContent += `<div id="opts-${qid}" style="display:flex;flex-direction:column;gap:12px;width:100%;">`;

        [[0,1],[2,3]].forEach(function(row) {
            optionsContent += `<div class="st2-optrow">`;
            row.forEach(function(index) {
                const optionText = (opts[index] || '').trim();
                const optionLabel = String.fromCharCode(65 + index);
                const sel = state.studentAnswers[qid] === optionLabel;
                const dis = optionText === '';

                optionsContent += `
                    <label data-opt="${optionLabel}"
                        onclick="${buildClick(optionLabel)}"
                        style="position:relative;display:flex;align-items:center;gap:12px;flex:1;
                            padding:14px 16px;border-radius:16px;transition:background .15s;
                            cursor:${dis ? 'default' : 'pointer'};
                            opacity:${dis ? '0.35' : '1'};
                            pointer-events:${dis ? 'none' : 'auto'};
                            background:${sel ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : '#F8FAFC'};
                            box-shadow:${sel ? '0 12px 22px -8px rgba(79,70,229,.55)' : 'inset 0 0 0 1.5px #E2E8F0'};
                            user-select:none;">

                        <span data-b style="display:inline-flex;align-items:center;justify-content:center;
                            width:34px;height:34px;min-width:34px;border-radius:11px;
                            font-size:14px;font-weight:900;
                            background:${sel ? '#fff' : '#E2E8F0'};
                            color:${sel ? '#4F46E5' : '#475569'};">
                            ${optionLabel}
                        </span>

                        <span data-t style="font-size:14px;font-weight:600;line-height:1.45;flex:1;min-width:0;
                            color:${sel ? '#fff' : '#1E293B'};">
                            ${optionText}
                        </span>

                        <span data-c style="display:${sel ? 'flex' : 'none'};align-items:center;justify-content:center;
                            width:24px;height:24px;min-width:24px;border-radius:50%;
                            background:rgba(255,255,255,0.25);flex-shrink:0;">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </span>

                        <input type="radio" name="answer-${qid}" value="${optionLabel}"
                            ${sel ? 'checked' : ''} ${dis ? 'disabled' : ''}
                            style="position:absolute;width:0;height:0;opacity:0;pointer-events:none;">
                    </label>`;
            });
            optionsContent += `</div>`;
        });

        optionsContent += `</div>`;
    }

    /* =========================================================
       TRUE / FALSE
       - Side by side, same direct DOM onclick approach
       - Selected = solid indigo
    ========================================================= */
    else if (questionType === 'true_false' || questionType === 'truefalse') {
        const sel = state.studentAnswers[qid];

        const tfClick = (val) => `
            (function(){
                ['True','False'].forEach(function(v){
                    var lbl = document.getElementById('tf-${qid}-'+v);
                    if(!lbl) return;
                    var mine = v === '${val}';
                    lbl.style.background = mine ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : '#F8FAFC';
                    lbl.style.boxShadow = mine ? '0 12px 22px -8px rgba(79,70,229,.55)' : 'inset 0 0 0 1.5px #E2E8F0';
                    var ic = lbl.querySelector('[data-ic]');
                    var tx = lbl.querySelector('[data-tx]');
                    if(ic){ ic.style.background = mine ? 'rgba(255,255,255,0.25)' : (v==='True'?'#DCFCE7':'#FEE2E2'); }
                    if(tx){ tx.style.color = mine ? '#fff' : '#334155'; }
                });
                updateAnswer('${qid}', '${val}');
            })()`.replace(/\n\s+/g, ' ');

        optionsContent = `
            <div style="display:flex;gap:14px;width:100%;max-width:520px;margin:0 auto;">

                <label id="tf-${qid}-True" onclick="${tfClick('True')}"
                    style="position:relative;flex:1;display:flex;flex-direction:column;
                        align-items:center;justify-content:center;gap:10px;
                        padding:24px 12px;border-radius:20px;cursor:pointer;user-select:none;transition:background .15s;
                        background:${sel === 'True' ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : '#F8FAFC'};
                        box-shadow:${sel === 'True' ? '0 12px 22px -8px rgba(79,70,229,.55)' : 'inset 0 0 0 1.5px #E2E8F0'};">
                    <div data-ic style="width:46px;height:46px;border-radius:50%;
                        display:flex;align-items:center;justify-content:center;
                        background:${sel === 'True' ? 'rgba(255,255,255,0.25)' : '#DCFCE7'};">
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
                            stroke="${sel === 'True' ? '#fff' : '#16a34a'}" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                    </div>
                    <span data-tx style="font-size:15px;font-weight:900;letter-spacing:.06em;
                        color:${sel === 'True' ? '#fff' : '#334155'};">TRUE</span>
                    <input type="radio" name="answer-${qid}" value="True"
                        ${sel === 'True' ? 'checked' : ''}
                        style="position:absolute;width:0;height:0;opacity:0;pointer-events:none;">
                </label>

                <label id="tf-${qid}-False" onclick="${tfClick('False')}"
                    style="position:relative;flex:1;display:flex;flex-direction:column;
                        align-items:center;justify-content:center;gap:10px;
                        padding:24px 12px;border-radius:20px;cursor:pointer;user-select:none;transition:background .15s;
                        background:${sel === 'False' ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : '#F8FAFC'};
                        box-shadow:${sel === 'False' ? '0 12px 22px -8px rgba(79,70,229,.55)' : 'inset 0 0 0 1.5px #E2E8F0'};">
                    <div data-ic style="width:46px;height:46px;border-radius:50%;
                        display:flex;align-items:center;justify-content:center;
                        background:${sel === 'False' ? 'rgba(255,255,255,0.25)' : '#FEE2E2'};">
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
                            stroke="${sel === 'False' ? '#fff' : '#dc2626'}" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </div>
                    <span data-tx style="font-size:15px;font-weight:900;letter-spacing:.06em;
                        color:${sel === 'False' ? '#fff' : '#334155'};">FALSE</span>
                    <input type="radio" name="answer-${qid}" value="False"
                        ${sel === 'False' ? 'checked' : ''}
                        style="position:absolute;width:0;height:0;opacity:0;pointer-events:none;">
                </label>
            </div>`;
    }

    /* =========================================================
       FULL PAGE LAYOUT
    ========================================================= */
    return `
        <div class="no-select st2-exam">

            <!-- HEADER -->
            <header class="st2-ehead">
                <div class="st2-ehead-in">
                    <div style="display:flex;align-items:center;gap:12px;min-width:0">
                        <div class="st2-avatar" style="width:42px;height:42px;border-radius:14px;font-size:18px;flex-shrink:0">
                            ${welcomeName.charAt(0).toUpperCase()}
                        </div>
                        <div style="min-width:0">
                            <div style="font-size:15px;font-weight:800;color:#fff;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${exam.subject}</div>
                            <div style="font-size:12px;color:rgba(255,255,255,0.85);display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:2px">
                                <b>${st2Esc(welcomeName)}</b>&nbsp;•&nbsp;${st2Esc(studentClassArms)} &nbsp;•&nbsp; ${st2Gate(exam)} &nbsp;•&nbsp; ✅ ${st2Answered(exam, state.studentAnswers)} answered
                            </div>
                        </div>
                    </div>
                    <div class="st2-timer ${lowTime ? 'st2-low' : ''}">
                        <small>Time Left</small>
                        <b id="timer-display">${formatTime(state.timeRemaining)}</b>
                    </div>
                </div>
            </header>

            <!-- PROGRESS BAR -->
            <div style="height:5px;background:#DDE3EE;flex-shrink:0;">
                <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,#10B981,#38BDF8,#7C3AED);transition:width 0.4s;border-radius:0 99px 99px 0"></div>
            </div>

            <!-- BODY -->
            <div class="st2-ebody">

                <!-- SIDEBAR -->
                <aside class="st2-side hidden lg:flex">

                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <span style="font-size:11px;font-weight:900;color:#94A3B8;text-transform:uppercase;letter-spacing:0.1em;">Questions</span>
                        <span style="font-size:11px;font-weight:800;color:#4F46E5;background:#EEF2FF;padding:2px 10px;border-radius:20px;">${totalQuestions}</span>
                    </div>

                    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:16px;">
                        ${exam.questions.map((q, idx) => {
                            const isAnswered = !!state.studentAnswers[q.id];
                            const isCurrent = idx === state.currentQuestionIndex;
                            const bg = isCurrent ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : isAnswered ? '#10B981' : '#F1F5F9';
                            const col = (isCurrent || isAnswered) ? '#fff' : '#64748B';
                            const ring = isCurrent ? 'box-shadow:0 0 0 2px #fff,0 0 0 4px #4F46E5;' : '';
                            return `<button onclick="goToQuestion(${idx})" style="height:36px;border-radius:10px;
                                font-size:11px;font-weight:800;border:none;cursor:pointer;
                                background:${bg};color:${col};${ring}transition:all 0.15s;">
                                ${idx + 1}
                            </button>`;
                        }).join('')}
                    </div>

                    <div style="border-top:1px solid #F1F5F9;padding-top:12px;display:flex;flex-direction:column;gap:8px;">
                        <div class="st2-legend"><i style="background:#4F46E5"></i>Current</div>
                        <div class="st2-legend"><i style="background:#10B981"></i>Answered</div>
                        <div class="st2-legend"><i style="background:#E2E8F0;border:1px solid #CBD5E1"></i>Pending</div>
                    </div>

                    <div style="margin-top:auto;padding-top:14px;border-top:1px solid #F1F5F9;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                            <span style="font-size:11px;color:#64748B;font-weight:600">Progress</span>
                            <span style="font-size:11px;font-weight:800;color:#4F46E5;">${Math.round(progress)}%</span>
                        </div>
                        <div style="height:6px;background:#E2E8F0;border-radius:99px;overflow:hidden;">
                            <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,#4F46E5,#7C3AED);border-radius:99px;transition:width 0.4s;"></div>
                        </div>
                    </div>
                </aside>

                <!-- MAIN PANEL -->
                <main style="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;min-height:0;">
                    <div class="st2-qpanel">

                        <!-- Question + image -->
                        <div class="st2-qhead">
                            <span class="st2-qnum">Question ${currentQuestionNumber} of ${totalQuestions}</span>
                            ${isValidImageSrc(currentQuestion.image) ? `
                                <div style="display:flex;justify-content:center;margin-bottom:12px;">
                                    <img src="${currentQuestion.image}" alt="Question diagram"
                                        style="max-width:100%;max-height:90px;border-radius:14px;
                                            border:2px solid #E2E8F0;box-shadow:0 6px 16px rgba(15,23,42,0.12);cursor:pointer;"
                                        onclick="openImageModal('${currentQuestion.image.replace(/'/g, "\\'")}')"/>
                                </div>` : ''}
                            <p class="st2-qtext">
                                ${currentQuestion.question}
                            </p>
                        </div>

                        <!-- Options -->
                        <div class="st2-qopts">
                            <div style="width:100%;">
                                ${optionsContent}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <!-- FOOTER -->
            <footer class="st2-efoot">
                <div class="st2-efoot-in">

                    <button onclick="changeQuestion(-1)"
                        ${state.currentQuestionIndex === 0 ? 'style="visibility:hidden;"' : ''}
                        class="st2-nav st2-prev">
                        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                        </svg>
                        Previous
                    </button>

                    <span class="st2-only-mobile lg:hidden" style="font-size:13px;font-weight:800;color:#94A3B8;">
                        ${currentQuestionNumber} / ${totalQuestions}
                    </span>

                    ${state.currentQuestionIndex === totalQuestions - 1
                        ? `<button onclick="submitExam()" class="st2-nav st2-submit">
                                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                Submit Exam
                            </button>`
                        : `<button onclick="changeQuestion(1)" class="st2-nav st2-next">
                                Next
                                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                                </svg>
                            </button>`
                    }
                </div>
            </footer>
        </div>
    `;
}

function renderStudentResultsPage() {
    return `<div class="st2-page" style="display:flex;align-items:center;justify-content:center;padding:16px"><p style="font-size:20px;color:#64748B;font-weight:600">Student result viewing is disabled.</p></div>`;
}

function renderStudentResultModal(result) {
    st2Inject();
    const percentage = result.percentage || 0;
    const passed = percentage >= 50;
    const wrong = result.total - result.score;
    const pct = Math.max(0, Math.min(100, Number(percentage) || 0));
    const C = 2 * Math.PI * 52; // ring circumference
    const dash = (C * (1 - pct / 100)).toFixed(1);
    const ringColor = passed ? '#34D399' : '#FDBA74';
    
    return `
        <div id="result-modal" class="st2-modal st2-modal-bg" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:9999;padding:12px">
            <div class="st2-mcard st2-rise">
                <!-- Header -->
                <div class="st2-mhead ${passed ? '' : 'st2-fail'}">
                    <div style="position:relative;text-align:center">
                        <h2 style="font-size:19px;font-weight:900;margin:0 0 2px;letter-spacing:-.01em">Exam Completed! 🎉</h2>
                        <p style="margin:0;font-size:12px;color:rgba(255,255,255,.78);font-weight:600">${st2Esc(result.student_name || 'Student')}</p>

                        <div class="st2-ring">
                            <svg width="132" height="132" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="10"/>
                                <circle cx="60" cy="60" r="52" fill="none" stroke="${ringColor}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${dash}"/>
                            </svg>
                            <div class="st2-ring-in">
                                <div style="font-size:38px;font-weight:900;line-height:1">${result.score}</div>
                                <div style="display:flex;align-items:center;gap:5px;color:rgba(255,255,255,.8)">
                                    <span style="height:1px;width:12px;background:rgba(255,255,255,.5)"></span>
                                    <span style="font-size:15px;font-weight:800">${result.total}</span>
                                </div>
                            </div>
                        </div>

                        <span class="st2-pill st2-pill-white" style="font-size:12px;padding:6px 14px">
                            ${passed ? 'Passed ✓' : 'Needs Improvement'} • ${percentage}%
                        </span>
                    </div>
                </div>

                <!-- Content -->
                <div style="padding:16px">
                    <!-- Stats Grid -->
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
                        <div class="st2-stat" style="background:#ECFDF5;border-color:#A7F3D0">
                            <div class="st2-stat-ic" style="background:linear-gradient(135deg,#10B981,#059669)"><i data-lucide="check" class="w-3.5 h-3.5 text-white"></i></div>
                            <p style="margin:0;font-size:22px;font-weight:900;color:#059669">${result.score}</p>
                            <p style="margin:0;font-size:9px;font-weight:800;color:#047857;text-transform:uppercase;letter-spacing:.08em">Correct</p>
                        </div>
                        <div class="st2-stat" style="background:#FFF1F2;border-color:#FECDD3">
                            <div class="st2-stat-ic" style="background:linear-gradient(135deg,#F43F5E,#E11D48)"><i data-lucide="x" class="w-3.5 h-3.5 text-white"></i></div>
                            <p style="margin:0;font-size:22px;font-weight:900;color:#E11D48">${wrong}</p>
                            <p style="margin:0;font-size:9px;font-weight:800;color:#BE123C;text-transform:uppercase;letter-spacing:.08em">Wrong</p>
                        </div>
                        <div class="st2-stat" style="background:#EEF2FF;border-color:#C7D2FE">
                            <div class="st2-stat-ic" style="background:linear-gradient(135deg,#6366F1,#4338CA)"><i data-lucide="list" class="w-3.5 h-3.5 text-white"></i></div>
                            <p style="margin:0;font-size:22px;font-weight:900;color:#4F46E5">${result.total}</p>
                            <p style="margin:0;font-size:9px;font-weight:800;color:#4338CA;text-transform:uppercase;letter-spacing:.08em">Total</p>
                        </div>
                    </div>

                    <!-- Quick Info -->
                    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:14px;padding:10px 12px;margin-bottom:12px">
                        <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px">
                            <div style="display:flex;align-items:center;gap:6px">
                                <i data-lucide="clock" class="w-3.5 h-3.5" style="color:#4F46E5"></i>
                                <span style="font-weight:800;color:#1E293B;font-family:ui-monospace,Menlo,monospace">
                                    ${Math.floor((result.duration_taken || 0) / 60)}:${((result.duration_taken || 0) % 60).toString().padStart(2, '0')}
                                </span>
                            </div>
                            <div style="height:14px;width:1px;background:#CBD5E1"></div>
                            <div style="display:flex;align-items:center;gap:6px;min-width:0">
                                <i data-lucide="book-open" class="w-3.5 h-3.5" style="color:#4F46E5"></i>
                                <span style="font-weight:700;color:#1E293B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px">
                                    ${result.exam_id || result.exam_subject || 'Exam'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Performance Message -->
                    <div style="background:${passed ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#F97316,#E11D48)'};padding:11px;border-radius:14px;margin-bottom:12px;text-align:center">
                        <p style="margin:0;font-weight:800;color:#fff;font-size:13px">
                            ${passed 
                                ? percentage >= 70 
                                    ? '🌟 Excellent work!' 
                                    : '👍 Good job!'
                                : '💪 Keep practicing!'}
                        </p>
                    </div>

                    <!-- View Answers Toggle -->
                    ${window.state?.answersExpanded ? '' : `
                    <button 
                        onclick="toggleAnswers()" 
                        class="st2-mbtn" style="width:100%;background:#F1F5F9;color:#334155;margin-bottom:12px"
                    >
                        <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                        View Answers
                    </button>
                    `}

                    ${window.state?.answersExpanded ? `
                    <div style="margin-bottom:12px">
                        <button 
                            onclick="toggleAnswers()" 
                            class="st2-mbtn" style="width:100%;background:#F1F5F9;color:#334155;margin-bottom:8px"
                        >
                            <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>
                            Hide Answers
                        </button>
                        <div style="max-height:200px;overflow-y:auto">
                            ${renderDetailedAnswers(result)}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Action Buttons -->
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                        <button 
                            onclick="closeResultModal(); setPage('home');" 
                            class="st2-mbtn" style="background:linear-gradient(135deg,#1E293B,#0B1226)"
                        >
                            <i data-lucide="home" class="w-3.5 h-3.5"></i>
                            EXIT
                        </button>
                        <button 
                            onclick="closeResultModal(); setPage('student-info');" 
                            class="st2-mbtn" style="background:${passed ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#F59E0B,#EA580C)'}"
                        >
                            <i data-lucide="${passed ? 'arrow-right' : 'refresh-cw'}" class="w-3.5 h-3.5"></i>
                            ${passed ? 'NEXT' : 'RETRY'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Export to global scope
window.renderStudentInfoForm = renderStudentInfoForm;
window.renderStudentDashboard = renderStudentDashboard;
window.renderStudentExamList = renderStudentExamList;
window.renderExamInterface = renderExamInterface;
window.renderStudentResultsPage = renderStudentResultsPage;
window.renderStudentResultModal = renderStudentResultModal;