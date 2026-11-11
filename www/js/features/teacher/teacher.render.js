// teacher.render.js — TOTAL REDESIGN v2 "Ink & Aurora" (2026)
// ============================================================
// Visual redesign + bug fixes. All logic, hooks and behaviour preserved:
//  - Pages: registration, login, dashboard, create/edit exam, results
//  - Handlers untouched: handleTeacherRegistration, handleTeacherLogin, editExam,
//    shareExamWithOptions, deleteExam, exportAllExams, deleteSelectedExams,
//    handleSelectAllExams, handleExamCheckboxChange, handleTeacherImportClick,
//    handleTeacherImportFile, saveExam, addQuestion, editQuestion, deleteQuestion,
//    changeQuestionPage, toggleAssessmentType, toggleQuestionOptions,
//    toggleGlobalSymbols, closeGlobalSymbols, handleQuestionImageUpload,
//    triggerImageUpload, handleQuestionCheckboxChange, handleSelectAllQuestions,
//    deleteSelectedQuestions, closeTeacherSidebar, toggleTeacherSidebar,
//    setPageAndCloseTeacherSidebar, logout, setPage
//  - Hooks kept: all element IDs, .exam-card/.selected, .exam-checkbox,
//    .question-card/.selected, .question-checkbox, .dashboard-menu-item,
//    .menu-item-active, .sidebar-overlay/.sidebar-transition/.sidebar-hidden,
//    .hamburger-btn, .option-row, .letter-badge, `hidden` toggles
//
// BUGS FIXED (see bottom of reply for details):
//  1. Duplicate ids (global-symbol-palette / -groups / symbol-target-label) -> one palette
//  2. Stored XSS: student names, subjects, exam ids, class were injected raw
//  3. Crashes on missing exam.questions / state.availableExams / q.type / user.name
//  4. Results % used exam_details length only (ignored result.total / essays)
//  5. Pagination page not clamped after deleting questions (blank list)
//  6. Progress bars could exceed 100%
//  7. Enter key inside an option box submitted (saved) the whole exam form
//  8. Import input missing on Results page -> sidebar "Import Exam" had nothing to click
//  9. <div> inside <ul>, href="#" jumping, ids/quotes in onclick breaking on apostrophes
// 10. Sidebar "Dashboard" now uses the same page id ('teacher') as every other page
// ============================================================

const TC_CSS = `
:root{--tc-ink:#0B1226;--tc-mute:#64748B;--tc-line:#E5E9F2;--tc-brand:#4F46E5;--tc-brand2:#7C3AED}
.tc-app,.tc-auth{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:var(--tc-ink);-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:#EEF1F8}::-webkit-scrollbar-thumb{background:#A5B4FC;border-radius:6px}::-webkit-scrollbar-thumb:hover{background:#6366F1}
@keyframes tc-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes tc-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
.tc-rise{animation:tc-rise .45s cubic-bezier(.2,.8,.2,1) both}
.tc-bg{background:radial-gradient(900px 420px at 5% -10%,rgba(99,102,241,.16),transparent 60%),radial-gradient(800px 380px at 100% 0%,rgba(236,72,153,.09),transparent 55%),#F5F6FB}
/* ----- auth ----- */
.tc-auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;position:relative;background:radial-gradient(900px 420px at 8% -8%,rgba(99,102,241,.24),transparent 60%),radial-gradient(800px 380px at 100% 0%,rgba(236,72,153,.14),transparent 55%),#F5F6FB}
.tc-card{background:rgba(255,255,255,.96);backdrop-filter:blur(10px);border:1px solid var(--tc-line);border-radius:26px;box-shadow:0 24px 60px -20px rgba(15,23,42,.22),0 2px 6px rgba(15,23,42,.04)}
.tc-auth-icon{width:68px;height:68px;border-radius:22px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;color:#fff;animation:tc-float 4s ease-in-out infinite}
.tc-label{font-size:12px;font-weight:800;color:#334155;margin-bottom:7px;display:block;letter-spacing:.04em;text-transform:uppercase}
.tc-input{width:100%;padding:13px 15px;border:1.5px solid #E2E8F0;border-radius:14px;background:#F8FAFC;outline:none;font-weight:600;font-size:15px;color:var(--tc-ink);transition:all .2s;box-sizing:border-box}
.tc-input:focus{border-color:#6366F1;background:#fff;box-shadow:0 0 0 4px rgba(99,102,241,.16)}
.tc-input[readonly]{background:#EEF1F8;color:#64748B;cursor:not-allowed}
textarea.tc-input{resize:none;font-weight:500}
.tc-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;border:none;border-radius:14px;padding:13px 22px;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 14px 26px -10px rgba(79,70,229,.6);transition:all .2s}
.tc-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}.tc-btn:active{transform:scale(.98)}
.tc-btn-green{background:linear-gradient(135deg,#059669,#10B981);box-shadow:0 14px 26px -10px rgba(5,150,105,.6)}
.tc-btn-rose{background:linear-gradient(135deg,#E11D48,#F43F5E);box-shadow:0 14px 26px -10px rgba(225,29,72,.55)}
.tc-btn-soft{background:#F1F5F9;color:#334155;box-shadow:none}
.tc-btn-soft:hover{background:#E2E8F0;filter:none}
.tc-btn[disabled]{background:#CBD5E1;box-shadow:none;cursor:not-allowed;transform:none;filter:none}
.tc-link{width:100%;background:none;border:none;color:var(--tc-mute);font-size:13px;font-weight:700;padding:10px;cursor:pointer}
.tc-link:hover{color:var(--tc-brand);text-decoration:underline}
/* ----- sidebar ----- */
.tc-side{background:linear-gradient(180deg,#0B1226 0%,#141A3F 55%,#2A1C6B 100%);color:#fff}
.tc-side .dashboard-menu-item{color:#C7D2FE;font-weight:700;font-size:14px;transition:all .2s;cursor:pointer;text-decoration:none}
.tc-side .dashboard-menu-item:hover{background:rgba(255,255,255,.09);color:#fff}
.tc-side .menu-item-active{background:linear-gradient(135deg,#4F46E5,#7C3AED)!important;color:#fff!important;box-shadow:0 12px 22px -10px rgba(99,102,241,.8)}
.tc-brand-ic{width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#A5B4FC,#F0ABFC);color:#1E1B4B;display:flex;align-items:center;justify-content:center}
.tc-user{margin:14px 16px;padding:14px;border-radius:18px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;gap:12px}
.tc-avatar{width:46px;height:46px;border-radius:15px;background:linear-gradient(135deg,#FDE68A,#F59E0B);color:#422006;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:19px;flex-shrink:0}
/* ----- topbar / panels ----- */
.tc-head{background:rgba(255,255,255,.88);backdrop-filter:blur(10px);border-bottom:1px solid var(--tc-line)}
.tc-iconbtn{padding:9px;border-radius:12px;color:#475569;background:transparent;border:none;cursor:pointer;transition:all .2s}
.tc-iconbtn:hover{background:#EEF1F8;color:var(--tc-brand)}
.tc-panel{background:#fff;border:1px solid var(--tc-line);border-radius:24px;box-shadow:0 18px 44px -26px rgba(15,23,42,.3);padding:22px}
.tc-h2{font-size:22px;font-weight:900;letter-spacing:-.02em;margin:0}
.tc-count{padding:7px 15px;border-radius:999px;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;font-weight:800;font-size:13px}
.tc-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:800}
.tc-chip-ca{background:#D1FAE5;color:#065F46}.tc-chip-ex{background:#FFE4E6;color:#9F1239}
.tc-chip-up{background:#FEF3C7;color:#92400E}.tc-chip-ok{background:#D1FAE5;color:#065F46}.tc-chip-closed{background:#FEE2E2;color:#991B1B}
.tc-chip-vio{background:#EDE9FE;color:#5B21B6}.tc-chip-gray{background:#F1F5F9;color:#475569}
/* ----- stat cards ----- */
.tc-stat{position:relative;overflow:hidden;border-radius:22px;padding:20px;color:#fff;transition:transform .25s}
.tc-stat:hover{transform:translateY(-4px)}
.tc-stat:after{content:"";position:absolute;right:-30px;top:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.14)}
.tc-stat-ic{width:46px;height:46px;border-radius:15px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center}
.tc-stat-n{font-size:34px;font-weight:900;letter-spacing:-.03em;line-height:1}
.tc-s1{background:linear-gradient(135deg,#4F46E5,#6366F1 55%,#818CF8)}.tc-s2{background:linear-gradient(135deg,#7C3AED,#A855F7)}
.tc-s3{background:linear-gradient(135deg,#059669,#10B981)}.tc-s4{background:linear-gradient(135deg,#E11D48,#FB7185)}
/* ----- banners & bulk bars ----- */
.tc-banner{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:16px 18px;border-radius:20px;background:linear-gradient(135deg,#EEF2FF,#F5F3FF 60%,#FDF2F8);border:1px solid #DDD6FE}
.tc-bulk{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 14px;border-radius:16px;background:#F8FAFC;border:1px solid var(--tc-line);margin-bottom:16px}
.tc-check{width:20px;height:20px;accent-color:#4F46E5;cursor:pointer}
#bulk-delete-btn,#bulk-delete-questions-btn{background:linear-gradient(135deg,#E11D48,#F43F5E);color:#fff;border:none;border-radius:12px;padding:10px 16px;font-weight:800;font-size:13px;display:inline-flex;align-items:center;gap:8px;cursor:pointer;transition:all .2s}
#bulk-delete-btn[disabled],#bulk-delete-questions-btn[disabled]{background:#CBD5E1;cursor:not-allowed}
#selected-count-badge,#selected-questions-badge{background:#4F46E5;color:#fff;font-size:11px;font-weight:800;padding:2px 10px;border-radius:999px}
/* ----- exam cards ----- */
.exam-card{position:relative;background:#fff;border:1px solid var(--tc-line);border-radius:22px;overflow:hidden;transition:all .25s;box-shadow:0 8px 22px -14px rgba(15,23,42,.25)}
.exam-card:hover{transform:translateY(-4px);box-shadow:0 26px 44px -20px rgba(15,23,42,.35)}
.exam-card.selected{box-shadow:0 0 0 3px #4F46E5,0 18px 34px -12px rgba(79,70,229,.4)!important;border-color:#4F46E5!important;transform:translateY(-2px)}
.tc-ex-top{padding:16px 18px;color:#fff;position:relative;overflow:hidden}
.tc-ex-top:after{content:"";position:absolute;right:-26px;top:-26px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.14)}
.tc-ex-top>*{position:relative;z-index:1}
.tc-t-ex{background:linear-gradient(135deg,#9F1239,#E11D48 60%,#FB7185)}
.tc-t-ca{background:linear-gradient(135deg,#065F46,#059669 60%,#34D399)}
.tc-meta{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.tc-meta span{display:inline-flex;align-items:center;gap:6px;background:#F1F5F9;color:#475569;border-radius:10px;padding:6px 10px;font-size:12px;font-weight:700}
.tc-acts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding-top:14px;border-top:1px solid #EEF1F7}
.tc-act{display:flex;flex-direction:column;align-items:center;gap:4px;padding:9px 4px;border-radius:14px;border:none;background:transparent;font-size:12px;font-weight:800;cursor:pointer;transition:all .2s}
.tc-act:hover{transform:translateY(-2px)}
.tc-act-e{color:#4338CA}.tc-act-e:hover{background:#EEF2FF}
.tc-act-s{color:#059669}.tc-act-s:hover{background:#ECFDF5}
.tc-act-d{color:#E11D48}.tc-act-d:hover{background:#FFF1F2}
.tc-empty{text-align:center;padding:56px 20px;border:1.5px dashed #CBD5E1;border-radius:22px;background:#FAFBFF;grid-column:1/-1}
.tc-empty-ic{width:80px;height:80px;margin:0 auto 14px;border-radius:26px;background:#EEF1F8;display:flex;align-items:center;justify-content:center;color:#94A3B8}
/* ----- create page ----- */
.tc-hero{position:relative;overflow:hidden;color:#fff;padding:26px 0 64px;border-radius:0 0 32px 32px}
.tc-hero:before{content:"";position:absolute;right:-60px;top:-80px;width:290px;height:290px;border-radius:50%;background:rgba(255,255,255,.14)}
.tc-hero>*{position:relative;z-index:1}
.tc-h-ex{background:linear-gradient(120deg,#0B1226 0%,#4C1D95 45%,#BE123C 100%)}
.tc-h-ca{background:linear-gradient(120deg,#0B1226 0%,#064E3B 50%,#059669 100%)}
.tc-wrap{max-width:920px;margin:0 auto;padding:0 18px}
.tc-pull{margin-top:-42px;position:relative;z-index:2;padding-bottom:50px}
.tc-sec{border-top:1px solid #EEF1F7;padding-top:26px}
.tc-sec-title{font-size:21px;font-weight:900;letter-spacing:-.02em;margin:0}
.tc-ghost{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.3);color:#fff;border-radius:14px;padding:11px 18px;font-weight:800;font-size:13px;cursor:pointer;transition:all .2s}
.tc-ghost:hover{background:rgba(255,255,255,.26)}
.tc-bar{height:8px;background:#E2E8F0;border-radius:99px;overflow:hidden}
.tc-bar>i{display:block;height:100%;border-radius:99px;transition:width .3s}
.option-row{display:flex;align-items:center;gap:8px;padding:10px;background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:14px;transition:all .15s}
.option-row:focus-within{border-color:#818CF8;background:#fff}
.letter-badge{width:30px;height:30px;border-radius:10px;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;flex-shrink:0}
.tc-tf{display:flex;flex:1;align-items:center;padding:16px;background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:16px;cursor:pointer;transition:all .15s}
.tc-tf:hover{background:#EEF2FF;border-color:#A5B4FC}
.question-card{position:relative;border:1.5px solid #E2E8F0;border-radius:18px;padding:16px;background:#FAFBFF;transition:all .2s}
.question-card:hover{border-color:#818CF8;background:#fff}
.question-card.selected{box-shadow:0 0 0 3px #4F46E5,0 12px 24px -10px rgba(79,70,229,.35)!important;border-color:#4F46E5!important;background:#EEF2FF!important}
.tc-qbtn{width:32px;height:32px;border-radius:10px;border:none;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s}
.tc-qbtn:hover{transform:scale(1.08)}
.tc-pgbar{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;background:#F8FAFC;border:1px solid var(--tc-line);border-radius:16px}
.tc-pg{min-width:40px;height:40px;padding:0 12px;border-radius:12px;font-weight:800;font-size:13px;border:1.5px solid #E2E8F0;background:#fff;color:#334155;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;transition:all .15s}
.tc-pg:hover{border-color:#818CF8;color:#4F46E5}
.tc-pg-on{background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;border-color:transparent}
.tc-pg[disabled]{opacity:.45;cursor:not-allowed}
/* ----- results ----- */
.tc-table{width:100%;border-collapse:separate;border-spacing:0}
.tc-table thead th{background:#F8FAFC;color:#64748B;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;padding:14px 16px;border-bottom:1px solid var(--tc-line);white-space:nowrap;position:sticky;top:0}
.tc-table tbody td{padding:14px 16px;border-bottom:1px solid #F1F5F9;font-size:14px}
.tc-table tbody tr{transition:background .15s}
.tc-table tbody tr:hover{background:#F8FAFF}
.tc-gr{display:inline-flex;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:900}
.tc-g-ok{background:#D1FAE5;color:#047857}.tc-g-mid{background:#FEF3C7;color:#92400E}.tc-g-bad{background:#FEE2E2;color:#B91C1C}.tc-g-f{background:#FECACA;color:#7F1D1D}
.tc-search{position:relative;max-width:320px;width:100%}
.tc-search i,.tc-search svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#94A3B8;pointer-events:none}
.tc-search input{padding-left:42px}
`;
function tcInject(){ if(document.getElementById('tc-css')) return; const s=document.createElement('style'); s.id='tc-css'; s.textContent=TC_CSS; document.head.appendChild(s); }

// ---- helpers (presentation-safe) ----
function tEsc(v){ return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
// For values placed inside onclick="fn('...')": JS-escape, then make attribute-safe.
function tJs(v){ return String(v ?? '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\r?\n/g,' ').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
function tDate(s){
    if(!s) return '';
    const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
    const d=m ? new Date(+m[1],+m[2]-1,+m[3]) : new Date(s);
    return isNaN(d) ? tEsc(s) : d.toLocaleDateString();
}

// Shared hidden import input (must exist in the DOM before the user clicks Import).
const TC_IMPORT_INPUT = `
    <input type="file"
        id="teacher-import-input"
        accept=".csv,text/csv,application/csv"
        style="display:none;"
        onchange="handleTeacherImportFile(event)">`;

// Shared sidebar for dashboard + results. `active` = data-page value to highlight.
function renderTeacherSidebar(state, active) {
    const user = (state && state.user) || null;
    const userName = (user && user.name) ? user.name : 'User';
    const userPhone = user ? (user.phone_number || 'N/A') : 'N/A';
    const userInitial = String(userName || 'U').charAt(0).toUpperCase();
    const cls = (page) => 'dashboard-menu-item' + (active === page ? ' menu-item-active' : '') + ' flex items-center gap-3 px-4 py-3 rounded-xl';
    return `
        <!-- Overlay for mobile -->
        <div id="sidebarOverlay" class="sidebar-overlay" onclick="closeTeacherSidebar()"></div>

        <!-- Sidebar -->
        <aside id="teacherSidebar" class="tc-side sidebar-transition w-64 flex-shrink-0 shadow-2xl fixed md:relative h-full z-50 overflow-y-auto sidebar-hidden md:sidebar-visible">
            <div class="flex flex-col h-full">
                <button onclick="closeTeacherSidebar()"
                        class="md:hidden absolute top-3 right-3 text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors z-10">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>

                <div class="p-5" style="border-bottom:1px solid rgba(255,255,255,.1)">
                    <div class="flex items-center gap-3">
                        <div class="tc-brand-ic"><i data-lucide="graduation-cap" class="w-6 h-6"></i></div>
                        <div>
                            <h1 class="text-lg font-extrabold" style="letter-spacing:-.01em;margin:0">${tEsc(window.SCHOOL_CONFIG?.schoolShortName || 'GSS')} T/M CBT</h1>
                            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#A5B4FC">Teacher Portal</p>
                        </div>
                    </div>
                </div>

                <div class="tc-user">
                    <div class="tc-avatar"><span>${tEsc(userInitial)}</span></div>
                    <div class="flex-1 min-w-0">
                        <p class="truncate" style="margin:0;font-weight:800">${tEsc(userName)}</p>
                        <p class="truncate" style="margin:2px 0 0;font-size:12px;color:#A5B4FC">${tEsc(userPhone)}</p>
                    </div>
                </div>

                <nav class="flex-1 py-2 overflow-y-auto">
                    <ul class="space-y-1 px-3" style="list-style:none;margin:0">
                        <li>
                            <a href="#" onclick="event.preventDefault(); setPageAndCloseTeacherSidebar('teacher')" class="${cls('dashboard')}" data-page="dashboard">
                                <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
                                <span>Dashboard</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" onclick="event.preventDefault(); setPageAndCloseTeacherSidebar('create-exam')" class="${cls('create-exam')}" data-page="create-exam">
                                <i data-lucide="plus-circle" class="w-5 h-5"></i>
                                <span>Create Exam</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" onclick="handleTeacherImportClick(event)" class="${cls('import')}" data-page="import">
                                <i data-lucide="upload" class="w-5 h-5"></i>
                                <span>Import Exam</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" onclick="event.preventDefault(); setPageAndCloseTeacherSidebar('view-results')" class="${cls('view-results')}" data-page="view-results">
                                <i data-lucide="bar-chart-2" class="w-5 h-5"></i>
                                <span>View Results</span>
                            </a>
                        </li>
                        <li style="border-top:1px solid rgba(255,255,255,.1);margin-top:10px;padding-top:10px">
                            <button onclick="closeTeacherSidebar(); logout();" class="w-full dashboard-menu-item flex items-center gap-3 px-4 py-3 rounded-xl text-left" style="background:transparent;border:none">
                                <i data-lucide="log-out" class="w-5 h-5"></i>
                                <span>Logout</span>
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </aside>`;
}

function renderTeacherRegistrationPage() {
    tcInject();
    return `
        <div class="tc-auth tc-auth-wrap">
            ${renderAuthBackground()}

            <div class="tc-card tc-rise relative z-10 w-full animate-fadeIn" style="position:relative;z-index:10;max-width:440px;padding:32px 28px">
                <div style="text-align:center;margin-bottom:24px">
                    <div class="tc-auth-icon" style="background:linear-gradient(135deg,#059669,#10B981);box-shadow:0 18px 34px -10px rgba(5,150,105,.6)">
                        <i data-lucide="user-plus" class="w-8 h-8 text-white"></i>
                    </div>
                    <h1 style="font-size:28px;font-weight:900;letter-spacing:-.03em;margin:0 0 6px">Teacher Registration</h1>
                    <p style="color:#64748B;font-size:14px;font-weight:500;margin:0">Create your teacher account.</p>
                </div>
                <form id="teacher-registration-form" onsubmit="handleTeacherRegistration(event)" style="display:flex;flex-direction:column;gap:16px">
                    <div>
                        <label for="register-name" class="tc-label">Full Name</label>
                        <input type="text" id="register-name" class="tc-input" autocomplete="name" required />
                    </div>
                    <div>
                        <label for="register-phone" class="tc-label">Phone Number (as ID)</label>
                        <input type="tel" id="register-phone" class="tc-input" placeholder="e.g., 08012345678" autocomplete="tel" required />
                    </div>
                    <div>
                        <label for="register-password" class="tc-label">Password</label>
                        <input type="password" id="register-password" class="tc-input" autocomplete="new-password" required />
                    </div>

                    <button type="submit" class="tc-btn tc-btn-green" style="width:100%;padding:15px;font-size:15px;margin-top:4px">
                        Register
                        <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                    <button type="button" onclick="setPage('teacher-login')" class="tc-link">
                        Already Registered? Login
                    </button>
                </form>
            </div>
        </div>
    `;
}

function renderTeacherLoginPage() {
    tcInject();
    return `
        <div class="tc-auth tc-auth-wrap">
            ${renderAuthBackground()}

            <div class="tc-card tc-rise relative z-10 w-full animate-fadeIn" style="position:relative;z-index:10;max-width:440px;padding:32px 28px">
                <div style="text-align:center;margin-bottom:24px">
                    <div class="tc-auth-icon" style="background:linear-gradient(135deg,#4F46E5,#7C3AED 60%,#DB2777);box-shadow:0 18px 34px -10px rgba(79,70,229,.6)">
                        <i data-lucide="graduation-cap" class="w-8 h-8 text-white"></i>
                    </div>
                    <h1 style="font-size:28px;font-weight:900;letter-spacing:-.03em;margin:0 0 6px">Teacher Login</h1>
                    <p style="color:#64748B;font-size:14px;font-weight:500;margin:0">Enter your phone number and password.</p>
                </div>
                <form id="teacher-login-form" onsubmit="handleTeacherLogin(event)" style="display:flex;flex-direction:column;gap:16px">
                    <div>
                        <label for="teacher-phone" class="tc-label">Phone Number</label>
                        <input type="tel" id="teacher-phone" class="tc-input" placeholder="e.g., 08012345678" autocomplete="tel" required />
                    </div>
                    <div>
                        <label for="teacher-password" class="tc-label">Password</label>
                        <input type="password" id="teacher-password" class="tc-input" autocomplete="current-password" required />
                    </div>
                    <button type="submit" class="tc-btn" style="width:100%;padding:15px;font-size:15px;margin-top:4px">
                        Login
                        <i data-lucide="log-in" class="w-4 h-4"></i>
                    </button>
                    <button type="button" onclick="setPage('teacher-register')" class="tc-link" style="color:#4F46E5">
                        Need an account? Register here.
                    </button>
                    <button type="button" onclick="setPage('home')" class="tc-link">
                        Back to Home
                    </button>
                </form>
            </div>
        </div>
    `;
}


function renderTeacherDashboard(state) {
    tcInject();
    const exams = state.availableExams || [];
    const userName = (state.user && state.user.name) ? state.user.name : 'User';
    const firstName = String(userName).trim().split(/\s+/)[0] || 'there';

    const totalExams = exams.length;
    const totalQuestions = exams.reduce((sum, exam) => sum + ((exam.questions || []).length), 0);
    const caCount = exams.filter(e => (e.assessmentType || 'EXAM') === 'CA').length;
    const examCount = totalExams - caCount;

    const examListHtml = exams.length > 0 ? exams.map(exam => {
        const statusLabel = typeof getExamStatusLabel === 'function' ? getExamStatusLabel(exam) : 'available';
        let statusBadge = '';
        if (statusLabel === 'upcoming') {
            statusBadge = `<span class="tc-chip tc-chip-up">Upcoming</span>`;
        } else if (statusLabel === 'available') {
            statusBadge = `<span class="tc-chip tc-chip-ok">Available</span>`;
        } else if (statusLabel === 'closed') {
            statusBadge = `<span class="tc-chip tc-chip-closed">Closed</span>`;
        }
        const isCA = (exam.assessmentType || 'EXAM') === 'CA';
        const qCount = (exam.questions || []).length;
        const idJs = tJs(exam.exam_id);

        return `
        <div class="exam-card group" data-exam-id="${tEsc(exam.exam_id)}">
            <!-- Checkbox for bulk selection -->
            <div class="absolute top-3 right-3 z-20" style="position:absolute;top:12px;right:12px;z-index:20">
                <label class="flex items-center cursor-pointer" style="background:rgba(255,255,255,.95);border-radius:8px;padding:3px;display:flex;box-shadow:0 2px 8px rgba(0,0,0,.18)">
                    <input type="checkbox" 
                           class="exam-checkbox tc-check" 
                           data-exam-id="${tEsc(exam.exam_id)}"
                           onchange="handleExamCheckboxChange(this)">
                </label>
            </div>
            
            <div class="tc-ex-top ${isCA ? 'tc-t-ca' : 'tc-t-ex'}">
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
                    <span class="tc-chip" style="background:rgba(255,255,255,.22);color:#fff">${isCA ? 'CA' : 'EXAM'}</span>
                    ${statusBadge}
                </div>
                <h3 class="truncate" style="margin:0;padding-right:34px;font-size:19px;font-weight:900;letter-spacing:-.02em" title="${tEsc(exam.subject)}">${tEsc(exam.subject)}</h3>
                <p class="truncate" style="margin:3px 0 0;font-size:12px;font-weight:600;color:rgba(255,255,255,.82)" title="${tEsc(exam.exam_id)}">${tEsc(exam.exam_id)}</p>
            </div>
            <div style="padding:16px 18px 14px">
                <div class="tc-meta">
                    <span><i data-lucide="users" class="w-4 h-4"></i> ${tEsc(exam.class)}</span>
                    <span><i data-lucide="list" class="w-4 h-4"></i> ${qCount} Questions</span>
                    <span><i data-lucide="clock" class="w-4 h-4"></i> ${tEsc(exam.duration)} min</span>
                    ${exam.questionLimit ? `<span style="background:#EDE9FE;color:#5B21B6">🎯 ${tEsc(exam.questionLimit)} per student</span>` : ''}
                </div>
                ${exam.scheduledDate ? `
                    <div class="flex items-center gap-2" style="color:#64748B;margin-bottom:6px">
                        <i data-lucide="calendar" class="w-4 h-4 flex-shrink-0"></i>
                        <span style="font-size:12px;font-weight:600">Scheduled: ${tDate(exam.scheduledDate)}</span>
                    </div>
                ` : ''}
                ${exam.created_by ? `
                    <div class="flex items-center gap-2" style="color:#64748B;margin-bottom:6px">
                        <i data-lucide="user" class="w-4 h-4 flex-shrink-0"></i>
                        <span class="truncate" style="font-size:12px;font-weight:600" title="${tEsc(exam.created_by)}">${tEsc(exam.created_by)}</span>
                    </div>
                ` : ''}
                
                <div class="tc-acts" style="margin-top:12px">
                    <button onclick="editExam('${idJs}')" class="tc-act tc-act-e" title="Edit Exam">
                        <i data-lucide="pencil" class="w-5 h-5"></i>
                        <span>Edit</span>
                    </button>
                    <button onclick="shareExamWithOptions('${idJs}')" class="tc-act tc-act-s" title="Share Exam">
                        <i data-lucide="share-2" class="w-5 h-5"></i>
                        <span>Share</span>
                    </button>
                    <button onclick="deleteExam('${idJs}')" class="tc-act tc-act-d" title="Delete Exam">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                        <span>Delete</span>
                    </button>
                </div>
            </div>
        </div>
    `}).join('') : `
        <div class="tc-empty">
            <div class="tc-empty-ic"><i data-lucide="inbox" class="w-10 h-10"></i></div>
            <p style="font-size:18px;font-weight:800;color:#475569;margin:0">No exams available.</p>
            <p style="color:#94A3B8;margin:6px 0 18px;font-weight:500">Create one to get started!</p>
            <button onclick="setPage('create-exam')" class="tc-btn"><i data-lucide="plus-circle" class="w-4 h-4"></i> Create Exam</button>
        </div>`;

    return `
        <div class="tc-app flex h-screen overflow-hidden tc-bg">
            ${renderTeacherSidebar(state, 'dashboard')}

            <!-- Main Content -->
            <div class="flex-1 flex flex-col overflow-hidden w-full">
                <header class="tc-head">
                    <div class="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
                        <div class="flex items-center gap-3">
                            <button onclick="toggleTeacherSidebar()" 
                                    class="md:hidden hamburger-btn" 
                                    id="hamburgerBtn"
                                    aria-label="Toggle menu">
                                <span></span>
                                <span></span>
                                <span></span>
                            </button>
                            <div>
                                <h2 style="margin:0;font-size:22px;font-weight:900;letter-spacing:-.02em">Hello, ${tEsc(firstName)} 👋</h2>
                                <p class="hidden sm:block" style="margin:2px 0 0;font-size:13px;color:#64748B;font-weight:500">Overview of your exams and activities</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="setPage('create-exam')" class="tc-btn hidden sm:inline-flex" style="padding:10px 18px">
                                <i data-lucide="plus" class="w-4 h-4"></i> New Exam
                            </button>
                            <button class="tc-iconbtn" aria-label="Notifications">
                                <i data-lucide="bell" class="w-5 h-5 md:w-6 md:h-6"></i>
                            </button>
                            <button class="tc-iconbtn hidden sm:block" aria-label="Help">
                                <i data-lucide="help-circle" class="w-5 h-5 md:w-6 md:h-6"></i>
                            </button>
                        </div>
                    </div>
                </header>

                <main class="flex-1 overflow-y-auto p-4 md:p-6">
                    <div class="tc-rise grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6">
                        <div class="tc-stat tc-s1">
                            <div class="flex items-center justify-between mb-4"><div class="tc-stat-ic"><i data-lucide="file-text" class="w-6 h-6"></i></div><span class="tc-stat-n">${totalExams}</span></div>
                            <p style="margin:0;font-size:13px;font-weight:700;opacity:.9">Total Exams</p>
                        </div>
                        <div class="tc-stat tc-s2">
                            <div class="flex items-center justify-between mb-4"><div class="tc-stat-ic"><i data-lucide="help-circle" class="w-6 h-6"></i></div><span class="tc-stat-n">${totalQuestions}</span></div>
                            <p style="margin:0;font-size:13px;font-weight:700;opacity:.9">Total Questions</p>
                        </div>
                        <div class="tc-stat tc-s3">
                            <div class="flex items-center justify-between mb-4"><div class="tc-stat-ic"><i data-lucide="clipboard-check" class="w-6 h-6"></i></div><span class="tc-stat-n">${caCount}</span></div>
                            <p style="margin:0;font-size:13px;font-weight:700;opacity:.9">Continuous Assessments</p>
                        </div>
                        <div class="tc-stat tc-s4">
                            <div class="flex items-center justify-between mb-4"><div class="tc-stat-ic"><i data-lucide="graduation-cap" class="w-6 h-6"></i></div><span class="tc-stat-n">${examCount}</span></div>
                            <p style="margin:0;font-size:13px;font-weight:700;opacity:.9">Examinations</p>
                        </div>
                    </div>

                    ${exams.length > 0 ? `
                        <div class="tc-banner mb-5">
                            <div class="flex items-center gap-3">
                                <div class="tc-brand-ic hidden sm:flex" style="background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff"><i data-lucide="package" class="w-5 h-5"></i></div>
                                <div>
                                    <p style="margin:0;font-weight:800">Bulk Export</p>
                                    <p style="margin:2px 0 0;font-size:12px;color:#64748B;font-weight:500">Export all ${exams.length} exam(s) at once</p>
                                </div>
                            </div>
                            <button onclick="exportAllExams()" class="tc-btn">
                                <i data-lucide="download" class="w-4 h-4 md:w-5 md:h-5"></i>
                                <span>Export All</span>
                            </button>
                        </div>
                    ` : ''}

                    <div class="tc-panel">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-5">
                            <h2 class="tc-h2">My Exams</h2>
                            <span class="tc-count">${exams.length} Total</span>
                        </div>

                        ${exams.length > 0 ? `
                            <!-- Bulk Actions Toolbar for Exams -->
                            <div class="tc-bulk">
                                <label class="flex items-center gap-2 cursor-pointer select-none">
                                    <input type="checkbox" 
                                           id="select-all-exams" 
                                           class="tc-check"
                                           onchange="handleSelectAllExams(this)">
                                    <span style="font-size:13px;font-weight:800;color:#334155">Select All</span>
                                    <span id="selected-count-badge" class="hidden">
                                        0 selected
                                    </span>
                                </label>
                                
                                <button id="bulk-delete-btn" 
                                        onclick="deleteSelectedExams()" 
                                        disabled>
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    <span>Delete Selected</span>
                                </button>
                            </div>
                        ` : ''}
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                            ${examListHtml}
                        </div>
                    </div>
                </main>
            </div>

            <!-- Hidden file input for imports — must be in DOM before user clicks -->
            ${TC_IMPORT_INPUT}
        </div>

        <script>
            setTimeout(() => {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 100);
        </script>
    `;
}

// Page-number buttons (same windowing logic as before)
function tcPageButtons(currentPage, totalPages) {
    const btn = (page) => `<button type="button" onclick="changeQuestionPage(${page})" class="tc-pg ${page === currentPage ? 'tc-pg-on' : ''}">${page}</button>`;
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1).map(btn).join('');
    }
    let pages = [];
    if (currentPage <= 3) {
        pages = [1, 2, 3, 4, '...', totalPages];
    } else if (currentPage >= totalPages - 2) {
        pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
        pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    }
    return pages.map(p => p === '...' ? `<span style="min-width:30px;display:inline-flex;align-items:center;justify-content:center;color:#94A3B8">…</span>` : btn(p)).join('');
}

const TC_SUBJECTS = ['Agricultural Science', 'Arabic', 'Beauty & Cosmetology', 'Biology', 'Catering Craft Practice', 'Chemistry', 'Christian Religious Studies',
    'Citizenship & Heritage Studies Education', 'Commerce', 'Digital Technologies', 'Economics', 'English Language',
    'Financial Accounting', 'Fishery', 'Foods and Nutrition', 'French', 'Further Mathematics',
    'Fashion Design & Garment Making', 'General Mathematics', 'Geography', 'Government', 'Hausa', 'History',
    'Health Education/Health Science', 'Home Management', 'Horticulture & Crop Production', 'Igbo', 'Insurance',
    'Islamic Religious Studies', 'Literature in English', 'Leather Works', 'Livestock Farming', 'Marketing',
    'Painting and Decoration', 'Physical Education', 'Physics', 'Solar and Photo Voltaic installation', 'Store Management', 'Technical Drawing',
    'Visual Arts', 'Yoruba'];

function renderCreateExamPage(state) {
    tcInject();
    const availableExams = state.availableExams || [];
    // Get saved exam if editing
    const savedExam = state.editingExamId ? availableExams.find(ex => ex.exam_id === state.editingExamId) : null;
    
    // Always default to EXAM
    let assessmentType = 'EXAM';
    
    if (savedExam?.assessmentType) {
        assessmentType = savedExam.assessmentType;
    } else if (state.assessmentType) {
        assessmentType = state.assessmentType;
    }
    
    state.assessmentType = assessmentType;
    
    const config = window.SCHOOL_CONFIG?.assessmentTypes || {
        CA: { label: 'Continuous Assessment', shortLabel: 'CA', maxQuestions: 20, defaultDuration: 30, color: '#059669', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
        EXAM: { label: 'Examination', shortLabel: 'Exam', maxQuestions: 100, defaultDuration: 120, color: '#B80236', bgColor: 'bg-rose-100', textColor: 'text-rose-700' }
    };
    
    const caActive = assessmentType === 'CA' ? 'active' : '';
    const examActive = assessmentType === 'EXAM' ? 'active' : '';
    const caConfig = config.CA;
    const examConfig = config.EXAM;
    const maxQuestions = assessmentType === 'CA' ? caConfig.maxQuestions : examConfig.maxQuestions;
    const isCA = assessmentType === 'CA';
    
    let initialValues;
    if (state.currentExamData) {
        initialValues = state.currentExamData; 
    } else if (savedExam) {
        initialValues = savedExam;
    } else {
        initialValues = {
            exam_id: '',
            subject: '',
            class: '',
            duration: examConfig.defaultDuration,
            assessmentType: 'EXAM',
            questions: []
        };
    }
    
    const exam = initialValues;
    const allQuestions = exam?.questions || [];
    const currentCount = allQuestions.length;
    const fillPct = Math.min(100, maxQuestions ? (currentCount / maxQuestions) * 100 : 0);
    const barColor = isCA ? '#10B981' : '#F43F5E';
    const textColor = isCA ? '#059669' : '#E11D48';

    // Pagination setup
    const questionsPerPage = 20;
    const totalQuestions = allQuestions.length;
    const totalPages = Math.ceil(totalQuestions / questionsPerPage);
    // FIX: clamp so deleting the last question on a page never leaves a blank list
    const currentPage = Math.min(Math.max(1, state.currentQuestionPage || 1), Math.max(1, totalPages));

    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    const questionsToDisplay = allQuestions.slice(startIndex, endIndex);

    // Generate questions list with pagination
    const questionsList = totalQuestions === 0 ? 
        `<div class="tc-empty" style="padding:40px 20px"><div class="tc-empty-ic" style="width:64px;height:64px;border-radius:20px"><i data-lucide="file-question" class="w-8 h-8"></i></div><p style="margin:0;font-weight:700;color:#64748B">No questions added yet (0/${maxQuestions})</p></div>` :
        `
        <!-- Question Progress -->
        <div class="tc-pgbar mb-4">
            <span style="font-size:13px;font-weight:700;color:#475569">${currentCount} of ${maxQuestions} questions added</span>
            <div class="flex items-center gap-3">
                <div class="tc-bar" style="width:130px"><i style="width:${fillPct}%;background:${barColor}"></i></div>
                <span style="font-size:12px;font-weight:900;color:${textColor}">${Math.round(fillPct)}%</span>
            </div>
        </div>

        <!-- Pagination Controls (Top) -->
        <div class="tc-pgbar mb-5">
            <div style="font-size:13px;color:#64748B;font-weight:600">
                Showing <strong>${startIndex + 1}-${Math.min(endIndex, totalQuestions)}</strong> of <strong>${totalQuestions}</strong> questions
            </div>
            <div class="flex gap-2 flex-wrap">
                <button type="button" 
                        onclick="changeQuestionPage(${currentPage - 1})" 
                        ${currentPage === 1 ? 'disabled' : ''}
                        class="tc-pg">
                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                    <span class="hidden sm:inline">Previous</span>
                </button>
                
                <div class="flex gap-1">
                    ${tcPageButtons(currentPage, totalPages)}
                </div>
                
                <button type="button"
                        onclick="changeQuestionPage(${currentPage + 1})"
                        ${currentPage === totalPages ? 'disabled' : ''}
                        class="tc-pg">
                    <span class="hidden sm:inline">Next</span>
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                </button>
            </div>
        </div>

        <!-- Questions Grid WITH CHECKBOXES -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${questionsToDisplay.map((q, idx) => {
                const actualIndex = startIndex + idx;
                const isImageValid = isValidImageSrc(q.image);
                const qType = String(q.type || '').replace('_', ' ');
                return `
                    <div class="question-card" data-question-id="${tEsc(q.id)}">
                        <!-- Checkbox for bulk selection -->
                        <div style="position:absolute;top:12px;right:12px;z-index:10">
                            <label class="flex items-center cursor-pointer" style="background:#fff;border-radius:8px;padding:3px;display:flex;box-shadow:0 2px 8px rgba(0,0,0,.12)">
                                <input type="checkbox" 
                                       class="question-checkbox tc-check" 
                                       data-question-id="${tEsc(q.id)}"
                                       onchange="handleQuestionCheckboxChange(this)">
                            </label>
                        </div>
                        
                        <div class="flex justify-between items-start gap-2">
                            <div class="flex-1 min-w-0" style="padding-right:34px">
                                <span class="tc-chip tc-chip-vio" style="margin-bottom:8px">Q${actualIndex + 1}</span>
                                <p style="margin:0 0 8px;font-weight:700;font-size:14px;line-height:1.55;color:#1E293B">${q.question}</p>
                                
                                ${isImageValid ? `
                                    <div class="my-2">
                                        <img src="${q.image}" 
                                            alt="Question image" 
                                            style="max-width:100%;max-height:128px;border-radius:12px;border:1.5px solid #E2E8F0;object-fit:contain" />
                                    </div>
                                ` : ''}
                                
                                <p style="margin:0 0 4px;font-size:12px;color:#64748B;font-weight:600">Type: <span style="font-weight:800;color:#4F46E5;text-transform:capitalize">${tEsc(qType)}</span></p>
                                ${q.options ? `<div style="font-size:12px;color:#334155;margin-top:8px;line-height:1.6"><strong>Options:</strong><br>${q.options.map((opt, i) => String.fromCharCode(65 + i) + '. ' + opt).join('<br>')}</div>` : ''}
                                <p style="margin:8px 0 0;font-size:12px;color:#059669;font-weight:700"><strong>Correct:</strong> ${q.correct_answer || q.marking_scheme || 'N/A'}</p>
                            </div>
                            <div class="flex flex-col gap-2 flex-shrink-0" style="margin-top:34px">
                                <button type="button" 
                                        onclick="event.preventDefault(); event.stopPropagation(); editQuestion(${q.id}); return false;" 
                                        class="tc-qbtn" style="background:linear-gradient(135deg,#4F46E5,#6366F1)"
                                        title="Edit Question">
                                    <i data-lucide="pencil" class="w-3 h-3"></i>
                                </button>
                                <button type="button" 
                                        onclick="event.preventDefault(); event.stopPropagation(); deleteQuestion(${q.id}); return false;" 
                                        class="tc-qbtn" style="background:linear-gradient(135deg,#E11D48,#F43F5E)"
                                        title="Delete Question">
                                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>

        <!-- Pagination Controls (Bottom) -->
        <div class="tc-pgbar mt-6">
            <div style="font-size:13px;color:#64748B;font-weight:600">
                Page <strong>${currentPage}</strong> of <strong>${totalPages}</strong>
            </div>
            <div class="flex gap-2">
                <button type="button" 
                        onclick="changeQuestionPage(${currentPage - 1})" 
                        ${currentPage === 1 ? 'disabled' : ''}
                        class="tc-pg">
                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                    <span class="hidden sm:inline">Previous</span>
                </button>
                
                <span class="flex items-center px-3 sm:hidden" style="font-size:13px;color:#64748B;font-weight:700">
                    ${currentPage} / ${totalPages}
                </span>
                
                <button type="button"
                        onclick="changeQuestionPage(${currentPage + 1})"
                        ${currentPage === totalPages ? 'disabled' : ''}
                        class="tc-pg">
                    <span class="hidden sm:inline">Next</span>
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
        `;

    // FIX: stop Enter inside an option box from submitting (= saving) the whole exam form.
    const noEnter = `onkeydown="if(event.key==='Enter'){event.preventDefault();}"`;

    return `
        <div class="tc-app tc-bg" style="min-height:100vh">
            <!-- Header with assessment type color -->
            <div class="tc-hero ${isCA ? 'tc-h-ca' : 'tc-h-ex'}">
                <div class="tc-wrap">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 class="flex items-center gap-3 flex-wrap" style="margin:0;font-size:28px;font-weight:900;letter-spacing:-.03em">
                                <i data-lucide="${isCA ? 'clipboard-check' : 'graduation-cap'}" class="w-7 h-7"></i>
                                ${state.editingExamId ? 'Edit' : 'Create'} ${isCA ? 'CA' : 'Exam'}
                                <span class="tc-chip" style="background:rgba(255,255,255,.2);color:#fff;font-size:12px;padding:5px 12px">
                                    Max ${maxQuestions} Qs
                                </span>
                            </h1>
                            <p style="margin:6px 0 0;color:rgba(255,255,255,.82);font-size:14px;font-weight:500">${isCA ? 'Continuous Assessment' : 'Examination'} - ${currentCount}/${maxQuestions} questions</p>
                        </div>
                        <button onclick="setPage('teacher')" class="tc-ghost">
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="tc-wrap tc-pull">
                <div class="tc-panel tc-rise" style="padding:28px">
                    <form id="create-exam-form" onsubmit="saveExam(event)" class="space-y-6">
                        
                        <!-- Exam Basic Info -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label class="tc-label">Exam/Test ID</label>
                                <input id="exam-id" 
                                       type="text" 
                                       class="tc-input" 
                                       value="${tEsc(initialValues.exam_id)}" 
                                       ${state.editingExamId ? 'readonly' : ''} 
                                       placeholder="e.g., PHY_SS2_CA1_2025" 
                                       required />
                            </div>
                            <div>
                                <label class="tc-label">Duration (minutes)</label>
                                <input id="duration" 
                                       type="number" 
                                       class="tc-input" 
                                       value="${tEsc(initialValues.duration)}" 
                                       min="1" 
                                       placeholder="e.g., 60" 
                                       required />
                            </div>
                        </div>

                        <!-- ASSESSMENT TYPE TOGGLE (classes kept: toggleAssessmentType may restyle these) -->
                        <div class="tc-sec">
                            <label class="tc-label">Assessment Type</label>
                            <div class="flex flex-wrap gap-3">
                                <button type="button"
                                        id="ca-toggle-btn"
                                        onclick="toggleAssessmentType('CA')"
                                        class="flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold text-sm transition-all border-2 ${caActive ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}">
                                    <i data-lucide="clipboard-check" class="w-4 h-4"></i>
                                    CA
                                    <span class="text-xs font-normal text-gray-400">(${caConfig.maxQuestions} Qs)</span>
                                </button>
                                <button type="button"
                                        id="exam-toggle-btn"
                                        onclick="toggleAssessmentType('EXAM')"
                                        class="flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold text-sm transition-all border-2 ${examActive ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}">
                                    <i data-lucide="graduation-cap" class="w-4 h-4"></i>
                                    Exam
                                    <span class="text-xs font-normal text-gray-400">(${examConfig.maxQuestions} Qs)</span>
                                </button>
                            </div>
                            <div class="mt-3 flex items-center gap-2">
                                <span style="font-size:12px;color:#64748B;font-weight:600">Questions added:</span>
                                <span style="font-size:12px;font-weight:900;color:${textColor}">${currentCount}/${maxQuestions}</span>
                                <div class="tc-bar" style="flex:1;max-width:140px;margin-left:8px"><i style="width:${fillPct}%;background:${barColor}"></i></div>
                            </div>
                        </div>

                        <!-- Subject and Class -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label class="tc-label">Subject</label>
                                <select id="subject" class="tc-input" required>
                                    <option value="">-- Select Subject --</option>
                                    ${TC_SUBJECTS.map(subject => 
                                        `<option value="${tEsc(subject)}" ${initialValues.subject === subject ? 'selected' : ''}>${tEsc(subject)}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="tc-label">Class</label>
                                <select id="class" class="tc-input" required>
                                    <option value="">Select Class</option>
                                    <option value="SS 1" ${initialValues.class === 'SS 1' ? 'selected' : ''}>SS 1</option>
                                    <option value="SS 2" ${initialValues.class === 'SS 2' ? 'selected' : ''}>SS 2</option>
                                    <option value="SS 3" ${initialValues.class === 'SS 3' ? 'selected' : ''}>SS 3</option>
                                </select>
                            </div>
                        </div>

                        <!-- Question Input Section -->
                        <div class="tc-sec" style="padding-top:28px">
                            <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
                                <h3 class="tc-sec-title">Add Question</h3>
                                <div class="flex items-center gap-3">
                                    <button type="button"
                                            id="symbol-toggle-btn"
                                            onclick="toggleGlobalSymbols()"
                                            class="bg-amber-100 hover:bg-amber-200 border-2 border-amber-400 text-amber-800 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-2 font-bold text-sm"
                                            title="Insert symbol into last-clicked field">
                                        <span class="text-base">∑</span>
                                        <span>Symbols</span>
                                    </button>
                                    <span class="tc-chip tc-chip-gray" style="font-size:12px">${currentCount}/${maxQuestions}</span>
                                </div>
                            </div>

                            <!-- Global symbol palette (hidden by default, sticky when visible) — ONE copy only -->
                            <div id="global-symbol-palette" 
                                class="hidden mb-4 bg-white border-2 border-amber-300 rounded-2xl p-3 shadow-xl"
                                style="position: sticky; top: 8px; z-index: 40; max-height: 60vh; overflow-y: auto;">
                                <div class="flex items-center justify-between mb-2 sticky top-0 bg-white pb-1">
                                    <p id="symbol-target-label" class="text-xs font-semibold text-gray-400">
                                        Click into a field first, then pick a symbol
                                    </p>
                                    <button type="button" onclick="closeGlobalSymbols()" class="text-gray-400 hover:text-gray-600 text-xs px-2 py-0.5 rounded hover:bg-gray-100">✕ Close</button>
                                </div>
                                <div id="global-symbol-groups"></div>
                            </div>

                            <!-- Question Text -->
                            <div class="mb-4">
                                <label class="tc-label">Question Text</label>
                                <textarea id="question-text" rows="3" class="tc-input" placeholder="Enter your question here..."></textarea>
                            </div>

                            <!-- Question Type + Image (side by side) -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <!-- Question Type -->
                                <div>
                                    <label class="tc-label">Question Type</label>
                                    <select id="question-type" onchange="toggleQuestionOptions()" class="tc-input">
                                        <option value="multiple_choice">Multiple Choice</option>
                                        <option value="true_false">True/False</option>
                                    </select>
                                </div>

                                <!-- Question Image Upload (compact) -->
                                <div>
                                    <label class="tc-label">
                                        Question Image <span style="font-size:11px;font-weight:600;color:#94A3B8;text-transform:none;letter-spacing:0">(Optional)</span>
                                    </label>
                                    <input type="file" id="question-image-input" accept="image/*" onchange="handleQuestionImageUpload(event)" class="hidden" />
                                    <div class="flex gap-2">
                                        <button type="button" onclick="triggerImageUpload()"
                                                class="flex-1 bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-300 text-indigo-700 px-3 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 font-bold text-sm">
                                            <i data-lucide="image-plus" class="w-4 h-4"></i>
                                            Upload
                                        </button>
                                        <div class="flex-1 flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2 py-2 rounded-xl border border-gray-300 justify-center">
                                            <i data-lucide="clipboard" class="w-3.5 h-3.5"></i>
                                            <span><kbd class="px-1 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono">Ctrl+V</kbd></span>
                                        </div>
                                    </div>
                                    <div id="image-preview-container" class="mt-2"></div>
                                </div>
                            </div>

                            <!-- Multiple Choice Options (2-column grid on desktop) -->
                            <div id="options-container" class="mb-4">
                                <label class="tc-label">Options &amp; Correct Answer</label>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    ${['A', 'B', 'C', 'D'].map(letter => `
                                    <div class="option-row">
                                        <span class="letter-badge">${letter}</span>
                                        <input type="text"
                                                id="option-${letter.toLowerCase()}"
                                                placeholder="Option ${letter}"
                                                ${noEnter}
                                                class="tc-input flex-1 min-w-0" style="padding:9px 12px;font-size:14px;font-weight:500" />
                                        <label class="flex items-center gap-1 cursor-pointer flex-shrink-0">
                                            <input type="radio"
                                                    name="correct-answer"
                                                    value="${letter}"
                                                    class="tc-check" style="width:17px;height:17px" />
                                            <span style="font-size:10px;font-weight:800;color:#475569;white-space:nowrap;text-transform:uppercase">Correct</span>
                                        </label>
                                    </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- True/False Options -->
                            <div id="true-false-container" class="hidden mb-6">
                                <label class="tc-label">Correct Answer</label>
                                <div class="flex gap-4">
                                    ${['True', 'False'].map(option => `
                                    <label class="tc-tf">
                                        <input type="radio" 
                                               name="correct-answer-tf" 
                                               value="${option}" 
                                               class="tc-check" style="width:20px;height:20px" />
                                        <span style="margin-left:12px;font-size:17px;font-weight:800;color:#334155">${option}</span>
                                    </label>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Add Question Button -->
                            <div class="flex justify-center">
                                <button type="button" onclick="addQuestion()" class="tc-btn" style="padding:14px 34px;font-size:15px">
                                    <i data-lucide="plus-circle" class="w-5 h-5"></i>
                                    Add Question to Exam
                                </button>
                            </div>
                        </div>

                        <!-- Questions List with Bulk Actions -->
                        <div class="tc-sec" style="padding-top:28px">
                            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                                <h3 class="tc-sec-title">Current Questions</h3>
                                <span class="tc-chip tc-chip-gray" style="font-size:12px">${currentCount}/${maxQuestions}</span>
                            </div>

                            ${totalQuestions > 0 ? `
                                <!-- Bulk Actions Toolbar for Questions -->
                                <div class="tc-bulk">
                                    <label class="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox" 
                                               id="select-all-questions" 
                                               class="tc-check"
                                               onchange="handleSelectAllQuestions(this)">
                                        <span style="font-size:13px;font-weight:800;color:#334155">Select All on this page</span>
                                        <span id="selected-questions-badge" class="hidden">
                                            0 selected
                                        </span>
                                    </label>
                                    
                                    <button type="button"
                                            id="bulk-delete-questions-btn" 
                                            onclick="deleteSelectedQuestions()" 
                                            disabled>
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        <span>Delete Selected</span>
                                    </button>
                                </div>
                            ` : ''}

                            <div id="questions-list" class="space-y-4">
                                ${questionsList}
                            </div>                            
                        </div>

                        <!-- Save Exam Button -->
                        <div class="flex justify-end gap-3 pt-6 flex-wrap" style="border-top:1px solid #EEF1F7">
                            <button type="button" onclick="setPage('teacher')" class="tc-btn tc-btn-soft" style="padding:14px 30px">
                                Cancel
                            </button>
                            <button type="submit" class="tc-btn ${isCA ? 'tc-btn-green' : ''}" style="padding:14px 30px">
                                <i data-lucide="save" class="w-5 h-5"></i>
                                ${state.editingExamId ? 'Update Exam' : 'Save Exam'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// Helper function to update menu active state
function updateDashboardMenu(currentPage) {
    const menuItems = document.querySelectorAll('.dashboard-menu-item');
    menuItems.forEach(item => {
        item.classList.remove('menu-item-active');
        if (item.dataset.page === currentPage) {
            item.classList.add('menu-item-active');
        }
    });
}


function renderTeacherResultsPage(state) {
    tcInject();
    const results = state.allResults || [];

    const getGrade = (percentage) => {
        if (percentage >= 70) return { grade: 'A1', tone: 'tc-g-ok' };
        if (percentage >= 65) return { grade: 'B2', tone: 'tc-g-ok' };
        if (percentage >= 60) return { grade: 'B3', tone: 'tc-g-mid' };
        if (percentage >= 55) return { grade: 'C4', tone: 'tc-g-mid' };
        if (percentage >= 50) return { grade: 'C5', tone: 'tc-g-mid' };
        if (percentage >= 45) return { grade: 'C6', tone: 'tc-g-mid' };
        if (percentage >= 40) return { grade: 'D7', tone: 'tc-g-bad' };
        if (percentage >= 35) return { grade: 'E8', tone: 'tc-g-bad' };
        return { grade: 'F9', tone: 'tc-g-f' };
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        if (isNaN(date)) return '';
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // FIX: prefer the saved total (excludes essays / respects the 40|70 gate); fall back to old behaviour.
    const calc = (result) => {
        const savedTotal = Number(result.total);
        const total = savedTotal > 0 ? savedTotal : (result.exam_details?.questions?.length || 0);
        const score = Number(result.score) || 0;
        const percentage = total > 0 ? Math.round((score / total) * 100) : (Number(result.percentage) || 0);
        return { total: total || 1, score, percentage };
    };

    const computed = results.map(calc);
    const avg = computed.length ? Math.round(computed.reduce((s, c) => s + c.percentage, 0) / computed.length) : 0;
    const passRate = computed.length ? Math.round((computed.filter(c => c.percentage >= 50).length / computed.length) * 100) : 0;
    const top = computed.length ? Math.max(...computed.map(c => c.percentage)) : 0;

    const resultsList = results.length === 0
        ? `<tr><td colspan="8" style="padding:56px 20px;text-align:center;color:#94A3B8;font-size:17px;font-weight:600">No results yet. Students haven't taken any exams.</td></tr>`
        : results.map((result, index) => {
            const { total: totalQuestions, score, percentage } = computed[index];
            const { grade, tone } = getGrade(percentage);
            const barColor = percentage >= 50 ? '#10B981' : '#F43F5E';
            const search = [result.student_name, result.student_class, result.student_arms, result.exam_subject, result.exam_id].join(' ').toLowerCase();

            return `
                <tr data-search="${tEsc(search)}">
                    <td style="font-weight:700;color:#94A3B8">${index + 1}</td>
                    <td style="font-weight:800;color:#0F172A">${tEsc(result.student_name || 'Anonymous')}</td>
                    <td style="color:#475569;font-weight:600">${tEsc(result.student_class || '')}${tEsc(result.student_arms || '')}</td>
                    <td style="color:#334155;font-weight:600">${tEsc(result.exam_subject || result.exam_id)}</td>
                    <td style="text-align:center;font-weight:900">${score}<span style="color:#94A3B8;font-weight:700">/${totalQuestions}</span></td>
                    <td style="text-align:center;min-width:110px">
                        <div style="font-size:17px;font-weight:900">${percentage}%</div>
                        <div class="tc-bar" style="height:5px;margin-top:4px"><i style="width:${Math.min(100, percentage)}%;background:${barColor}"></i></div>
                    </td>
                    <td style="text-align:center"><span class="tc-gr ${tone}">${grade}</span></td>
                    <td style="font-size:12px;color:#64748B;font-weight:600;white-space:nowrap">${formatDate(result.submitted_at)}</td>
                </tr>
            `;
        }).join('');

    return `
        <div class="tc-app flex h-screen overflow-hidden tc-bg">
            ${renderTeacherSidebar(state, 'view-results')}

            <div class="flex-1 flex flex-col overflow-hidden w-full">
                <header class="tc-head">
                    <div class="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 gap-3">
                        <div class="flex items-center gap-3">
                            <button onclick="toggleTeacherSidebar()"
                                    class="md:hidden hamburger-btn"
                                    id="hamburgerBtn"
                                    aria-label="Toggle menu">
                                <span></span>
                                <span></span>
                                <span></span>
                            </button>
                            <div>
                                <h2 style="margin:0;font-size:22px;font-weight:900;letter-spacing:-.02em">Results</h2>
                                <p class="hidden sm:block" style="margin:2px 0 0;font-size:13px;color:#64748B;font-weight:500">All student results across all exams</p>
                            </div>
                        </div>
                        <span class="tc-count">${results.length} Record(s)</span>
                    </div>
                </header>

                <main class="flex-1 overflow-y-auto p-4 md:p-6">
                    <div class="tc-rise grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6">
                        <div class="tc-stat tc-s1"><div class="flex items-center justify-between mb-3"><div class="tc-stat-ic"><i data-lucide="users" class="w-6 h-6"></i></div><span class="tc-stat-n">${results.length}</span></div><p style="margin:0;font-size:13px;font-weight:700;opacity:.9">Submissions</p></div>
                        <div class="tc-stat tc-s2"><div class="flex items-center justify-between mb-3"><div class="tc-stat-ic"><i data-lucide="percent" class="w-6 h-6"></i></div><span class="tc-stat-n">${avg}%</span></div><p style="margin:0;font-size:13px;font-weight:700;opacity:.9">Average Score</p></div>
                        <div class="tc-stat tc-s3"><div class="flex items-center justify-between mb-3"><div class="tc-stat-ic"><i data-lucide="badge-check" class="w-6 h-6"></i></div><span class="tc-stat-n">${passRate}%</span></div><p style="margin:0;font-size:13px;font-weight:700;opacity:.9">Pass Rate (50%+)</p></div>
                        <div class="tc-stat tc-s4"><div class="flex items-center justify-between mb-3"><div class="tc-stat-ic"><i data-lucide="trophy" class="w-6 h-6"></i></div><span class="tc-stat-n">${top}%</span></div><p style="margin:0;font-size:13px;font-weight:700;opacity:.9">Highest Score</p></div>
                    </div>

                    <div class="tc-panel" style="padding:0;overflow:hidden">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3" style="padding:18px 20px;border-bottom:1px solid #EEF1F7">
                            <div class="tc-search">
                                <i data-lucide="search" class="w-4 h-4"></i>
                                <input type="search" class="tc-input" placeholder="Search name, class, subject…" oninput="tcFilterResults(this.value)" />
                            </div>
                            <span style="font-size:13px;font-weight:700;color:#64748B">Showing <b id="tc-results-shown" style="color:#4F46E5">${results.length}</b> of ${results.length}</span>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="tc-table">
                                <thead>
                                    <tr>
                                        <th style="text-align:left">#</th>
                                        <th style="text-align:left">Student</th>
                                        <th style="text-align:left">Class</th>
                                        <th style="text-align:left">Subject</th>
                                        <th style="text-align:center">Score</th>
                                        <th style="text-align:center">%</th>
                                        <th style="text-align:center">Grade</th>
                                        <th style="text-align:left">Date</th>
                                    </tr>
                                </thead>
                                <tbody id="tc-results-body">
                                    ${resultsList}
                                    <tr id="tc-results-none" style="display:none"><td colspan="8" style="padding:40px;text-align:center;color:#94A3B8;font-weight:600">No results match your search.</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            <!-- FIX: import input was missing on this page, so sidebar "Import Exam" had nothing to click -->
            ${TC_IMPORT_INPUT}
        </div>

        <script>
            setTimeout(() => {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
                if (typeof updateDashboardMenu === 'function') {
                    updateDashboardMenu('view-results');
                }
            }, 100);
        </script>
    `;
}

// Client-side results filter (pure DOM, no state touched)
function tcFilterResults(q) {
    const term = String(q || '').trim().toLowerCase();
    const rows = document.querySelectorAll('#tc-results-body tr[data-search]');
    let shown = 0;
    rows.forEach(r => {
        const match = !term || (r.getAttribute('data-search') || '').indexOf(term) !== -1;
        r.style.display = match ? '' : 'none';
        if (match) shown++;
    });
    const none = document.getElementById('tc-results-none');
    if (none) none.style.display = (rows.length > 0 && shown === 0) ? '' : 'none';
    const cnt = document.getElementById('tc-results-shown');
    if (cnt) cnt.textContent = shown;
}


// ========================================
// EXPORTS
// ========================================

window.renderTeacherRegistrationPage = renderTeacherRegistrationPage;
window.renderTeacherLoginPage = renderTeacherLoginPage;
window.renderTeacherDashboard = renderTeacherDashboard;
window.renderCreateExamPage = renderCreateExamPage;
window.updateDashboardMenu = updateDashboardMenu;
window.renderTeacherResultsPage = renderTeacherResultsPage;
window.tcFilterResults = tcFilterResults;