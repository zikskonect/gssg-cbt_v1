// exam-officer.render.js — ADMIN CONSOLE REDESIGN v3 (2026)
// ============================================================
// Real admin-panel look: grouped sidebar, breadcrumb top bar, page headers,
// KPI cards, data tables, status pills. Logic/hooks/handlers preserved:
//  - Same exports + helper names: isCA(), getValidQuestionLimit(), eoLimitBadge(),
//    eoStatusPill(), eoInjectDesignCSS(), showClassExams(), open/close/save
//    ExamScheduleModal + ClassScheduleModal, saveExamSchedule(), saveClassSchedule()
//  - Same ids: examOfficeSidebar(+Overlay), examOfficeHamburgerBtn, examOfficeModal,
//    modalTitle, modalContent, examScheduleModal, classScheduleModal, bulkScheduleModal,
//    schedule-exam-id, schedule-date-picker, class-schedule-date-picker,
//    bulk-schedule-date-picker, bulk-schedule-toolbar, bulk-schedule-count,
//    upload-zone, exam-file-input, upload-content, upload-status, file-list,
//    files-selected-info, upload-progress-text, process-upload-btn, all auth ids
//  - Same classes JS relies on: schedule-checkbox, schedule-exam-item, upload-zone
//    (.drag-over/.has-file), file-list-item, exam-office-menu-item, menu-item-active,
//    sidebar-overlay/-transition/-hidden, hamburger-btn, `hidden` toggles
//  - Radio names: single-/class-/bulk-question-limit (40 / 70 gate)
//
// BUGS FIXED:
//  1. XSS: subjects, classes, student names, file names were injected raw -> escaped
//  2. onclick strings broke on quotes/backslashes (class names, exam ids, subjects)
//  3. Crashes when availableExams / allResults / exam.subject / questions undefined
//  4. saveExamSchedule mutated the exam BEFORE validating the 40/70 pick, and never
//     rolled back on a failed save -> now validate first, restore on failure
//  5. saveClassSchedule left memory out of sync after a partial failure -> resync
//  6. Re-scheduling a class silently reset its limit to 40 -> modal now pre-selects
//     the existing limit and date
//  7. Results % ignored result.total (essays / 40-70 gate) -> uses saved total
//  8. "student_class + student_arms" printed "undefined" when arms missing
//  9. Class popup listed CAs even though CAs are never scheduled -> EXAMs only
// 10. Upload page: package-import banner sat outside <main>; moved inside
// 11. Schedule sidebar: logout lacked the divider block used on other pages
// ============================================================

const EO_VERSION = '3';
const EO_DESIGN_CSS = `
:root{--eo-ink:#0F172A;--eo-mute:#64748B;--eo-line:#E4E8F1;--eo-bg:#F3F5FA;--eo-brand:#4F46E5;--eo-brand2:#7C3AED}
.eo-app,.eo-auth,.eo-modal-card{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:var(--eo-ink);-webkit-font-smoothing:antialiased}
.eo-app{background:var(--eo-bg)}
::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:#EEF1F8}::-webkit-scrollbar-thumb{background:#A5B4FC;border-radius:6px}::-webkit-scrollbar-thumb:hover{background:#6366F1}
@keyframes eo-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.eo-rise{animation:eo-rise .4s cubic-bezier(.2,.8,.2,1) both}
/* ---- sidebar ---- */
.eo-side{background:linear-gradient(180deg,#0B1020 0%,#111634 60%,#1B1650 100%);color:#fff}
.eo-brand{padding:18px 18px 16px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:12px}
.eo-logo{width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,#818CF8,#C084FC);display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 10px 22px -8px rgba(129,140,248,.7);flex-shrink:0}
.eo-navlabel{padding:16px 22px 6px;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#6B7BB8}
.eo-side .exam-office-menu-item{position:relative;color:#C7D2FE;font-weight:600;font-size:14px;transition:all .15s;cursor:pointer;text-decoration:none;margin:2px 12px;border-radius:12px}
.eo-side .exam-office-menu-item:hover{background:rgba(255,255,255,.07);color:#fff}
.eo-side .menu-item-active{background:rgba(99,102,241,.22)!important;color:#fff!important}
.eo-side .menu-item-active:before{content:"";position:absolute;left:-12px;top:9px;bottom:9px;width:4px;border-radius:0 4px 4px 0;background:linear-gradient(180deg,#A5B4FC,#C084FC)}
.eo-userbox{margin:12px;padding:12px;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:10px}
.eo-avatar{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,#FDE68A,#F59E0B);color:#422006;display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0}
/* ---- top bar + page head ---- */
.eo-top{background:rgba(255,255,255,.9);backdrop-filter:blur(10px);border-bottom:1px solid var(--eo-line);height:62px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;flex-shrink:0}
.eo-crumb{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--eo-mute)}
.eo-crumb b{color:var(--eo-ink);font-weight:800}
.eo-datechip{display:inline-flex;align-items:center;gap:7px;padding:7px 12px;border-radius:10px;background:#F1F5F9;color:#475569;font-size:12px;font-weight:700}
.eo-iconbtn{padding:9px;border-radius:11px;color:#475569;background:transparent;border:none;cursor:pointer;transition:all .15s}
.eo-iconbtn:hover{background:#EEF1F8;color:var(--eo-brand)}
.eo-main{padding:22px}
.eo-pagehead{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:20px}
.eo-title{margin:0;font-size:26px;font-weight:900;letter-spacing:-.025em}
.eo-sub{margin:4px 0 0;font-size:14px;color:var(--eo-mute);font-weight:500}
/* ---- buttons ---- */
.eo-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;border-radius:12px;padding:11px 18px;font-weight:800;font-size:13px;cursor:pointer;transition:all .15s;color:#fff;background:linear-gradient(135deg,#4F46E5,#7C3AED);box-shadow:0 10px 20px -10px rgba(79,70,229,.7)}
.eo-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}
.eo-btn-primary{background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;border-radius:12px;font-weight:700;box-shadow:0 8px 18px rgba(79,70,229,.28)}
.eo-btn-primary:hover{filter:brightness(1.07)}
.eo-btn-green{background:linear-gradient(135deg,#059669,#10B981);box-shadow:0 10px 20px -10px rgba(5,150,105,.7)}
.eo-btn-amber{background:linear-gradient(135deg,#D97706,#F59E0B);box-shadow:0 10px 20px -10px rgba(217,119,6,.7)}
.eo-btn-soft{background:#fff;color:#334155;border:1.5px solid #E2E8F0;box-shadow:none}
.eo-btn-soft:hover{background:#F8FAFC;filter:none}
.eo-btn-ico{padding:7px;border-radius:9px;border:none;background:transparent;cursor:pointer;transition:all .15s}
.eo-ico-ed{color:#4F46E5}.eo-ico-ed:hover{background:#EEF2FF}.eo-ico-del{color:#E11D48}.eo-ico-del:hover{background:#FFF1F2}.eo-ico-sh{color:#059669}.eo-ico-sh:hover{background:#ECFDF5}
/* ---- cards ---- */
.eo-card{background:#fff;border:1px solid var(--eo-line);border-radius:18px;box-shadow:0 1px 2px rgba(15,23,42,.04),0 10px 28px -20px rgba(15,23,42,.25)}
.eo-card:hover{box-shadow:0 1px 2px rgba(15,23,42,.04),0 14px 32px -18px rgba(79,70,229,.25)}
.eo-card-h{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:16px 20px;border-bottom:1px solid #EEF1F7}
.eo-card-t{margin:0;font-size:16px;font-weight:900;letter-spacing:-.01em;display:flex;align-items:center;gap:9px}
.eo-card-b{padding:20px}
.eo-kpi{position:relative;overflow:hidden;padding:18px;border-radius:18px;background:#fff;border:1px solid var(--eo-line);box-shadow:0 10px 28px -22px rgba(15,23,42,.35)}
.eo-kpi:before{content:"";position:absolute;left:0;top:0;right:0;height:4px;background:var(--k,#6366F1)}
.eo-kpi-ic{width:42px;height:42px;border-radius:13px;display:flex;align-items:center;justify-content:center;color:#fff;background:var(--k,#6366F1)}
.eo-kpi-n{font-size:30px;font-weight:900;letter-spacing:-.03em;line-height:1}
.eo-kpi-l{font-size:12px;font-weight:800;color:var(--eo-mute);text-transform:uppercase;letter-spacing:.07em;margin-top:10px}
.eo-kpi-s{font-size:12px;color:#94A3B8;font-weight:600;margin-top:3px}
.eo-stat-num{font-size:28px;line-height:1;font-weight:800;letter-spacing:-.02em}
/* ---- pills ---- */
.eo-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.02em;white-space:nowrap}
.eo-pill-green{background:#DCFCE7;color:#166534}.eo-pill-amber{background:#FEF3C7;color:#92400E}
.eo-pill-red{background:#FEE2E2;color:#991B1B}.eo-pill-gray{background:#F1F5F9;color:#475569}
.eo-pill-violet{background:#EDE9FE;color:#5B21B6}
/* ---- inputs ---- */
.eo-label{font-size:12px;font-weight:800;color:#334155;margin-bottom:7px;display:block;letter-spacing:.04em;text-transform:uppercase}
.eo-input{width:100%;padding:12px 14px;border:1.5px solid #E2E8F0;border-radius:12px;background:#F8FAFC;outline:none;font-weight:600;font-size:14px;color:var(--eo-ink);transition:all .15s;box-sizing:border-box}
.eo-input:focus{border-color:#6366F1;background:#fff;box-shadow:0 0 0 4px rgba(99,102,241,.12)}
.eo-radio-card{display:flex;align-items:center;gap:10px;border:1.5px solid #E2E8F0;border-radius:14px;padding:12px 14px;cursor:pointer;background:#fff;transition:.15s}
.eo-radio-card:has(input:checked){border-color:#6366F1;background:#EEF2FF;box-shadow:0 0 0 4px rgba(99,102,241,.10)}
.eo-search{position:relative;max-width:300px;width:100%}
.eo-search i,.eo-search svg{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#94A3B8;pointer-events:none}
.eo-search input{padding-left:40px}
/* ---- tables ---- */
.eo-table{width:100%;border-collapse:separate;border-spacing:0}
.eo-table thead th{background:#F8FAFC;color:#64748B;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;padding:12px 16px;border-bottom:1px solid var(--eo-line);white-space:nowrap;text-align:left}
.eo-table tbody td{padding:13px 16px;border-bottom:1px solid #F1F5F9;font-size:14px;vertical-align:middle}
.eo-table tbody tr{transition:background .12s}
.eo-table tbody tr:hover{background:#F8FAFF}
.eo-table tbody tr:last-child td{border-bottom:none}
.schedule-exam-item.eo-selected,.schedule-exam-item.selected{background:#EEF2FF}
.eo-check{width:18px;height:18px;accent-color:#4F46E5;cursor:pointer}
.eo-gr{display:inline-flex;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:900}
.eo-g-ok{background:#D1FAE5;color:#047857}.eo-g-mid{background:#FEF3C7;color:#92400E}.eo-g-bad{background:#FEE2E2;color:#B91C1C}.eo-g-f{background:#FECACA;color:#7F1D1D}
.eo-bar{height:7px;background:#E2E8F0;border-radius:99px;overflow:hidden}.eo-bar>i{display:block;height:100%;border-radius:99px}
.eo-classcard{cursor:pointer;transition:all .2s;padding:18px}
.eo-classcard:hover{transform:translateY(-3px);border-color:#A5B4FC}
.eo-empty{text-align:center;padding:48px 20px;color:#94A3B8}
.eo-empty-ic{width:72px;height:72px;margin:0 auto 12px;border-radius:22px;background:#EEF1F8;display:flex;align-items:center;justify-content:center;color:#94A3B8}
.eo-toolbar{background:#fff;border:1px solid #C7D2FE;color:#1E293B;padding:10px 16px;border-radius:16px;box-shadow:0 24px 50px -16px rgba(79,70,229,.45)}
/* ---- modals ---- */
.eo-modal{backdrop-filter:blur(4px)}
.eo-modal-card{background:#fff;border-radius:22px;box-shadow:0 40px 90px -24px rgba(15,23,42,.55);width:100%;overflow:hidden}
.eo-modal-h{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid #EEF1F7;background:linear-gradient(180deg,#FAFAFF,#fff)}
.eo-modal-h h3{margin:0;font-size:18px;font-weight:900;letter-spacing:-.01em}
.eo-x{border:none;background:#F1F5F9;color:#64748B;border-radius:10px;padding:7px;cursor:pointer}.eo-x:hover{background:#E2E8F0}
/* ---- upload ---- */
.upload-zone{border:2.5px dashed #A5B4FC;border-radius:20px;padding:56px 28px;text-align:center;background:linear-gradient(135deg,#F5F7FF 0%,#F3EEFF 100%);transition:all .25s ease;cursor:pointer;position:relative}
.upload-zone:hover,.upload-zone.drag-over{border-color:#4F46E5;background:linear-gradient(135deg,#EEF2FF 0%,#EDE4FF 100%);transform:scale(1.005)}
.upload-zone.has-file{border-color:#22c55e;background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)}
.file-list-item{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:8px;transition:all .2s ease}
.file-list-item:hover{border-color:#A5B4FC;box-shadow:0 2px 10px rgba(99,102,241,.15)}
/* ---- auth ---- */
.eo-auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;position:relative;background:radial-gradient(900px 420px at 8% -8%,rgba(99,102,241,.24),transparent 60%),radial-gradient(800px 380px at 100% 0%,rgba(236,72,153,.14),transparent 55%),#F5F6FB}
.eo-authcard{background:rgba(255,255,255,.96);backdrop-filter:blur(10px);border:1px solid var(--eo-line);border-radius:26px;box-shadow:0 24px 60px -20px rgba(15,23,42,.22)}
.eo-auth-ic{width:68px;height:68px;border-radius:22px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 18px 34px -10px rgba(79,70,229,.6)}
.eo-link{width:100%;background:none;border:none;color:var(--eo-mute);font-size:13px;font-weight:700;padding:10px;cursor:pointer}.eo-link:hover{color:var(--eo-brand);text-decoration:underline}
`;
function eoInjectDesignCSS(){
  let s = document.getElementById('eo-design-css');
  if (s && s.getAttribute('data-v') === EO_VERSION) return;
  if (!s) { s = document.createElement('style'); s.id = 'eo-design-css'; document.head.appendChild(s); }
  s.setAttribute('data-v', EO_VERSION);
  s.textContent = EO_DESIGN_CSS;
}

// ---- helpers ----
function eEsc(v){ return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function eJs(v){ return String(v ?? '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\r?\n/g,' ').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
function eoLocalToday(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function eDate(s){
  if(!s) return '';
  const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
  const d=m ? new Date(+m[1],+m[2]-1,+m[3]) : new Date(s);
  return isNaN(d) ? eEsc(s) : d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
}
function eoDateTime(iso){ const d=new Date(iso); return isNaN(d)?'':d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
function eoGrade(p){
  if (p >= 70) return { grade:'A1', tone:'eo-g-ok' };
  if (p >= 65) return { grade:'B2', tone:'eo-g-ok' };
  if (p >= 60) return { grade:'B3', tone:'eo-g-mid' };
  if (p >= 55) return { grade:'C4', tone:'eo-g-mid' };
  if (p >= 50) return { grade:'C5', tone:'eo-g-mid' };
  if (p >= 45) return { grade:'C6', tone:'eo-g-mid' };
  if (p >= 40) return { grade:'D7', tone:'eo-g-bad' };
  if (p >= 35) return { grade:'E8', tone:'eo-g-bad' };
  return { grade:'F9', tone:'eo-g-f' };
}
// Prefer saved total (excludes essays, respects 40/70 gate); fall back to old behaviour.
function eoCalc(result){
  const savedTotal = Number(result.total);
  const total = savedTotal > 0 ? savedTotal : (result.exam_details?.questions?.length || 0);
  const score = Number(result.score) || 0;
  const percentage = total > 0 ? Math.round((score / total) * 100) : (Number(result.percentage) || 0);
  return { total: total || 1, score, percentage };
}

function eoLimitBadge(exam){
  if(!exam || !exam.questionLimit) return '<span class="eo-pill eo-pill-gray">No limit set</span>';
  return `<span class="eo-pill eo-pill-violet">🎯 ${eEsc(exam.questionLimit)} / student</span>`;
}
function eoStatusPill(exam){
  const label = (typeof getExamStatusLabel==='function') ? getExamStatusLabel(exam) : '';
  if(label==='available') return '<span class="eo-pill eo-pill-green">● Available</span>';
  if(label==='upcoming') return '<span class="eo-pill eo-pill-amber">● Upcoming</span>';
  if(label==='closed') return '<span class="eo-pill eo-pill-red">● Closed</span>';
  return '<span class="eo-pill eo-pill-gray">● Not scheduled</span>';
}
// Shared helpers for ALL schedule modals (bulk lives in exam-officer.actions.js
// and calls these at runtime, after both files have loaded).
function isCA(exam){ return (exam && (exam.assessmentType || 'EXAM')) === 'CA'; }
function getValidQuestionLimit(value){
  const n = Number(value);
  return (n===40 || n===70) ? n : null;
}

// 40 / 70 radio picker (same radio names as before)
function eoLimitPicker(name, hint){
  return `
    <div class="mb-4">
        <label class="eo-label">Questions per student <span style="color:#7C3AED;text-transform:none;letter-spacing:0">— 40 / 70 gate</span></label>
        <div class="grid grid-cols-2 gap-3">
            <label class="eo-radio-card"><input type="radio" name="${name}" value="40" checked class="w-4 h-4"><span><span class="font-bold block">40 questions</span><span class="text-xs text-gray-500">Short exam</span></span></label>
            <label class="eo-radio-card"><input type="radio" name="${name}" value="70" class="w-4 h-4"><span><span class="font-bold block">70 questions</span><span class="text-xs text-gray-500">Full exam</span></span></label>
        </div>
        ${hint ? `<p class="text-xs text-gray-500 mt-2">${hint}</p>` : ''}
    </div>`;
}

// ============================================================================
// SHARED LAYOUT (sidebar + top bar + page header)
// ============================================================================
function eoSidebar(state, active) {
    const userName = (state && state.user) ? (state.user.school_name || state.user.name || 'School') : 'School';
    const adminName = (state && state.user && state.user.name) ? state.user.name : 'Administrator';
    const initial = String(userName || 'S').charAt(0).toUpperCase();
    const item = (page, icon, label) => `
        <li>
            <a href="#" onclick="event.preventDefault(); setPageAndCloseSidebarEO('${page}')"
               class="exam-office-menu-item${active === page ? ' menu-item-active' : ''} flex items-center gap-3 px-4 py-3"
               data-page="${page}">
                <i data-lucide="${icon}" class="w-5 h-5"></i>
                <span>${label}</span>
            </a>
        </li>`;
    return `
        <div id="examOfficeSidebarOverlay" class="sidebar-overlay" onclick="toggleExamOfficeSidebar()"></div>

        <aside id="examOfficeSidebar" class="eo-side sidebar-transition w-64 flex-shrink-0 shadow-2xl fixed md:relative h-full z-50 overflow-y-auto sidebar-hidden md:sidebar-visible">
            <div class="flex flex-col h-full">
                <button onclick="toggleExamOfficeSidebar()"
                        class="md:hidden absolute top-3 right-3 text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors z-10">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>

                <div class="eo-brand">
                    <div class="eo-logo"><i data-lucide="building" class="w-6 h-6"></i></div>
                    <div class="min-w-0">
                        <h1 class="truncate" style="margin:0;font-size:16px;font-weight:900;letter-spacing:-.01em" title="${eEsc(userName)}">${eEsc(userName)}</h1>
                        <p style="margin:2px 0 0;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#A5B4FC">Exam Office Portal</p>
                    </div>
                </div>

                <nav class="flex-1 py-2 overflow-y-auto">
                    <div class="eo-navlabel">Overview</div>
                    <ul style="list-style:none;margin:0;padding:0">${item('exam-office-dashboard','layout-dashboard','Dashboard')}</ul>
                    <div class="eo-navlabel">Manage</div>
                    <ul style="list-style:none;margin:0;padding:0">
                        ${item('exam-office-schedule','calendar','Schedule')}
                        ${item('exam-office-upload','upload','Upload Exams')}
                    </ul>
                    <div class="eo-navlabel">Reports</div>
                    <ul style="list-style:none;margin:0;padding:0">${item('exam-office-results','bar-chart-2','View Results')}</ul>
                </nav>

                <div style="border-top:1px solid rgba(255,255,255,.08);padding-bottom:6px">
                    <div class="eo-userbox">
                        <div class="eo-avatar">${eEsc(initial)}</div>
                        <div class="min-w-0 flex-1">
                            <p class="truncate" style="margin:0;font-size:13px;font-weight:800">${eEsc(adminName)}</p>
                            <p style="margin:1px 0 0;font-size:11px;color:#A5B4FC">Administrator</p>
                        </div>
                    </div>
                    <button onclick="logout()" class="w-full exam-office-menu-item flex items-center gap-3 px-4 py-3 text-left" style="background:transparent;border:none;width:calc(100% - 24px)">
                        <i data-lucide="log-out" class="w-5 h-5"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </aside>`;
}

function eoLayout(opts) {
    const { state, active, crumb, title, subtitle, actions = '', body, floating = '', after = '' } = opts;
    const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    const userName = (state && state.user) ? (state.user.school_name || state.user.name || 'School') : 'School';
    return `
        <div class="eo-app flex h-screen overflow-hidden relative">
            ${eoSidebar(state, active)}

            <div class="flex-1 flex flex-col overflow-hidden w-full relative">
                <header class="eo-top">
                    <div class="flex items-center gap-3">
                        <button onclick="toggleExamOfficeSidebar()"
                                class="md:hidden hamburger-btn"
                                id="examOfficeHamburgerBtn"
                                aria-label="Toggle menu">
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                        <div class="eo-crumb">
                            <i data-lucide="home" class="w-4 h-4"></i>
                            <span class="hidden sm:inline">Exam Office</span>
                            <i data-lucide="chevron-right" class="w-4 h-4 hidden sm:inline"></i>
                            <b>${eEsc(crumb)}</b>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="eo-datechip hidden sm:inline-flex"><i data-lucide="calendar" class="w-4 h-4"></i> ${eEsc(dateLabel)}</span>
                        <button class="eo-iconbtn" aria-label="Notifications"><i data-lucide="bell" class="w-5 h-5"></i></button>
                        <div class="eo-avatar" style="width:34px;height:34px;border-radius:11px;font-size:14px" title="${eEsc(userName)}">${eEsc(String(userName).charAt(0).toUpperCase())}</div>
                    </div>
                </header>

                ${floating}

                <main class="flex-1 overflow-y-auto eo-main">
                    <div class="eo-pagehead">
                        <div>
                            <h2 class="eo-title">${eEsc(title)}</h2>
                            <p class="eo-sub">${eEsc(subtitle)}</p>
                        </div>
                        <div class="flex items-center gap-2 flex-wrap">${actions}</div>
                    </div>
                    ${body}
                </main>
            </div>
        </div>

        ${after}

        <script>
            setTimeout(() => {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 100);
        </script>
    `;
}

// ============================================================================
// AUTH PAGES
// ============================================================================
function renderExamOfficeRegisterPage() {
    eoInjectDesignCSS();
    return `
        <div class="eo-auth eo-auth-wrap">
            ${renderAuthBackground()}

            <div class="eo-authcard eo-rise relative z-10 w-full animate-fadeIn" style="position:relative;z-index:10;max-width:460px;padding:32px 28px">
                <div style="text-align:center;margin-bottom:22px">
                    <div class="eo-auth-ic" style="background:linear-gradient(135deg,#7C3AED,#C026D3)">
                        <i data-lucide="building" class="w-8 h-8 text-white"></i>
                    </div>
                    <h1 style="font-size:27px;font-weight:900;letter-spacing:-.03em;margin:0 0 6px">Exam Office Registration</h1>
                    <p style="color:#64748B;font-size:14px;font-weight:500;margin:0">Create your school account.</p>
                </div>
                <form id="exam-office-registration-form" onsubmit="handleExamOfficeRegistration(event)" style="display:flex;flex-direction:column;gap:15px">
                    <div>
                        <label for="exam-office-school-name" class="eo-label">School Name</label>
                        <input type="text" id="exam-office-school-name" class="eo-input" placeholder="e.g., GSSS International" required />
                    </div>
                    <div>
                        <label for="exam-office-admin-name" class="eo-label">Admin Full Name</label>
                        <input type="text" id="exam-office-admin-name" class="eo-input" autocomplete="name" required />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label for="exam-office-phone" class="eo-label">Phone (as ID)</label>
                            <input type="tel" id="exam-office-phone" class="eo-input" placeholder="08012345678" autocomplete="tel" required />
                        </div>
                        <div>
                            <label for="exam-office-email" class="eo-label">Email Address</label>
                            <input type="email" id="exam-office-email" class="eo-input" placeholder="admin@yourschool.edu" autocomplete="email" required />
                        </div>
                    </div>
                    <div>
                        <label for="exam-office-password" class="eo-label">Password</label>
                        <input type="password" id="exam-office-password" class="eo-input" autocomplete="new-password" required />
                    </div>

                    <button type="submit" class="eo-btn" style="width:100%;padding:15px;font-size:15px;margin-top:4px">
                        Register School
                        <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                    <button type="button" onclick="setPage('exam-office-login')" class="eo-link">
                        Already Registered? Login
                    </button>
                </form>
            </div>
        </div>
    `;
}

function renderExamOfficeLoginPage() {
    eoInjectDesignCSS();
    return `
        <div class="eo-auth eo-auth-wrap">
            ${renderAuthBackground()}

            <div class="eo-authcard eo-rise relative z-10 w-full animate-fadeIn" style="position:relative;z-index:10;max-width:440px;padding:32px 28px">
                <div style="text-align:center;margin-bottom:22px">
                    <div class="eo-auth-ic" style="background:linear-gradient(135deg,#4F46E5,#7C3AED 60%,#DB2777)">
                        <i data-lucide="building" class="w-8 h-8 text-white"></i>
                    </div>
                    <h1 style="font-size:27px;font-weight:900;letter-spacing:-.03em;margin:0 0 6px">Exam Office Login</h1>
                    <p style="color:#64748B;font-size:14px;font-weight:500;margin:0">Enter your credentials to access your school account.</p>
                </div>
                <form id="exam-office-login-form" onsubmit="handleExamOfficeLogin(event)" style="display:flex;flex-direction:column;gap:15px">
                    <div>
                        <label for="exam-office-login-phone" class="eo-label">Phone Number</label>
                        <input type="tel" id="exam-office-login-phone" class="eo-input" placeholder="e.g., 08012345678" autocomplete="tel" required />
                    </div>
                    <div>
                        <label for="exam-office-login-password" class="eo-label">Password</label>
                        <input type="password" id="exam-office-login-password" class="eo-input" autocomplete="current-password" required />
                    </div>
                    <button type="submit" class="eo-btn" style="width:100%;padding:15px;font-size:15px;margin-top:4px">
                        Login
                        <i data-lucide="log-in" class="w-4 h-4"></i>
                    </button>
                    <button type="button" onclick="setPage('exam-office-register')" class="eo-link" style="color:#4F46E5">
                        Need an account? Register here.
                    </button>
                    <button type="button" onclick="setPage('home')" class="eo-link">
                        Back to Home
                    </button>
                </form>
            </div>
        </div>
    `;
}

// ============================================================================
// DASHBOARD
// ============================================================================
function renderExamOfficeDashboard(state) {
    eoInjectDesignCSS();
    const exams = state.availableExams || [];
    const results = state.allResults || [];

    // Split CAs and EXAMS
    const caExams = exams.filter(e => (e.assessmentType || 'EXAM') === 'CA');
    const examExams = exams.filter(e => (e.assessmentType || 'EXAM') === 'EXAM');

    // Group ONLY exams by class (matches schedule-page behavior)
    const examsByClass = {};
    examExams.forEach(exam => {
        const cls = exam.class || 'Unknown';
        if (!examsByClass[cls]) examsByClass[cls] = [];
        examsByClass[cls].push(exam);
    });

    const scheduledExams = exams.filter(exam => exam.scheduledDate);
    const totalResults = results.length;
    const totalExams = exams.length;
    const todayStr = eoLocalToday();
    const todays = examExams.filter(e => String(e.scheduledDate || '').slice(0, 10) === todayStr);
    const upcoming = examExams
        .filter(e => e.scheduledDate && String(e.scheduledDate).slice(0, 10) > todayStr)
        .sort((a, b) => String(a.scheduledDate).localeCompare(String(b.scheduledDate)))
        .slice(0, 5);
    const unscheduledExamCount = examExams.filter(e => !e.scheduledDate).length;
    const avg = totalResults ? Math.round(results.map(eoCalc).reduce((s, c) => s + c.percentage, 0) / totalResults) : 0;

    const kpi = (color, icon, num, label, sub) => `
        <div class="eo-kpi" style="--k:${color}">
            <div class="flex items-center justify-between">
                <div class="eo-kpi-ic"><i data-lucide="${icon}" class="w-5 h-5"></i></div>
                <span class="eo-kpi-n">${num}</span>
            </div>
            <div class="eo-kpi-l">${label}</div>
            <div class="eo-kpi-s">${sub}</div>
        </div>`;

    // Class cards HTML
    const classCardsHtml = Object.keys(examsByClass).length > 0
        ? Object.entries(examsByClass).map(([cls, clsExams]) => {
            const scheduledCount = clsExams.filter(e => e.scheduledDate).length;
            const pct = clsExams.length ? Math.round((scheduledCount / clsExams.length) * 100) : 0;
            return `
                <div class="eo-card eo-classcard" role="button" tabindex="0" onclick="showClassExams('${eJs(cls)}')">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="eo-kpi-ic" style="--k:linear-gradient(135deg,#6366F1,#8B5CF6);background:linear-gradient(135deg,#6366F1,#8B5CF6)"><i data-lucide="school" class="w-5 h-5"></i></div>
                            <div class="min-w-0">
                                <h3 class="truncate" style="margin:0;font-size:17px;font-weight:900">${eEsc(cls)}</h3>
                                <p style="margin:1px 0 0;font-size:12px;color:#64748B;font-weight:600">${scheduledCount} scheduled</p>
                            </div>
                        </div>
                        <span style="font-size:26px;font-weight:900;letter-spacing:-.02em">${clsExams.length}</span>
                    </div>
                    <div class="eo-bar"><i style="width:${pct}%;background:${pct === 100 ? '#10B981' : '#6366F1'}"></i></div>
                    <p style="margin:6px 0 0;font-size:11px;color:#94A3B8;font-weight:700;text-align:right">${pct}% scheduled</p>
                </div>`;
        }).join('')
        : `<div class="eo-empty" style="grid-column:1/-1"><div class="eo-empty-ic"><i data-lucide="inbox" class="w-9 h-9"></i></div><p style="margin:0;font-size:17px;font-weight:700;color:#64748B">No exams available. Upload exams first!</p></div>`;

    const todayList = (todays.length ? todays : []).map(e => `
        <div class="flex items-center justify-between gap-3" style="padding:10px 0;border-bottom:1px solid #F1F5F9">
            <div class="min-w-0"><p class="truncate" style="margin:0;font-size:14px;font-weight:800">${eEsc(e.subject)}</p><p style="margin:1px 0 0;font-size:12px;color:#64748B">${eEsc(e.class || '')}</p></div>
            ${eoLimitBadge(e)}
        </div>`).join('');
    const upcomingList = upcoming.map(e => `
        <div class="flex items-center justify-between gap-3" style="padding:10px 0;border-bottom:1px solid #F1F5F9">
            <div class="min-w-0"><p class="truncate" style="margin:0;font-size:14px;font-weight:800">${eEsc(e.subject)}</p><p style="margin:1px 0 0;font-size:12px;color:#64748B">${eEsc(e.class || '')}</p></div>
            <span class="eo-pill eo-pill-amber">${eDate(e.scheduledDate)}</span>
        </div>`).join('');

    const recent = [...results].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)).slice(0, 6);
    const recentRows = recent.length ? recent.map(r => {
        const c = eoCalc(r); const g = eoGrade(c.percentage);
        return `<tr>
            <td style="font-weight:800">${eEsc(r.student_name || 'Anonymous')}</td>
            <td style="color:#475569;font-weight:600">${eEsc(r.student_class || '')}${eEsc(r.student_arms || '')}</td>
            <td style="color:#334155">${eEsc(r.exam_subject || r.exam_id || '')}</td>
            <td style="font-weight:900">${c.percentage}%</td>
            <td><span class="eo-gr ${g.tone}">${g.grade}</span></td>
            <td style="font-size:12px;color:#64748B;white-space:nowrap">${eoDateTime(r.submitted_at)}</td>
        </tr>`;
    }).join('') : `<tr><td colspan="6"><div class="eo-empty" style="padding:28px">No submissions yet.</div></td></tr>`;

    const body = `
        <div class="eo-rise grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5 mb-5">
            ${kpi('#6366F1', 'file-text', totalExams, 'Total Exams', `${examExams.length} exams • ${caExams.length} CAs`)}
            ${kpi('#10B981', 'calendar-check', scheduledExams.length, 'Scheduled Exams', `${unscheduledExamCount} awaiting a date`)}
            ${kpi('#F59E0B', 'zap', todays.length, 'Live Today', 'Exams students can start now')}
            ${kpi('#8B5CF6', 'bar-chart-2', totalResults, 'Total Results', totalResults ? `${avg}% average score` : 'No submissions yet')}
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
            <div class="eo-card xl:col-span-2">
                <div class="eo-card-h">
                    <h3 class="eo-card-t"><i data-lucide="school" class="w-5 h-5" style="color:#6366F1"></i> Classes</h3>
                    <span class="eo-pill eo-pill-violet">${Object.keys(examsByClass).length} Classes</span>
                </div>
                <div class="eo-card-b">
                    <p style="margin:0 0 14px;font-size:13px;color:#64748B">Click a class to view and schedule its exams. CAs are excluded (they don't need scheduling).</p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">${classCardsHtml}</div>
                </div>
            </div>

            <div class="flex flex-col gap-5">
                <div class="eo-card" style="background:linear-gradient(135deg,#FFFBEB,#FFF7ED);border-color:#FDE68A">
                    <div class="eo-card-b">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="eo-kpi-ic" style="--k:#F59E0B;background:#F59E0B"><i data-lucide="upload-cloud" class="w-5 h-5"></i></div>
                            <div><h3 style="margin:0;font-size:16px;font-weight:900">Upload Exam(s)</h3><p style="margin:2px 0 0;font-size:12px;color:#92400E">Import exams from CSV files</p></div>
                        </div>
                        <button onclick="setPageAndCloseSidebarEO('exam-office-upload')" class="eo-btn eo-btn-amber" style="width:100%">
                            <i data-lucide="upload" class="w-4 h-4"></i><span>Upload Now</span>
                        </button>
                    </div>
                </div>

                <div class="eo-card">
                    <div class="eo-card-h"><h3 class="eo-card-t"><i data-lucide="zap" class="w-5 h-5" style="color:#F59E0B"></i> Today</h3><span class="eo-pill eo-pill-green">${todays.length}</span></div>
                    <div class="eo-card-b" style="padding-top:8px;padding-bottom:8px">${todayList || '<div class="eo-empty" style="padding:20px;font-size:13px">No exams scheduled for today.</div>'}</div>
                </div>

                <div class="eo-card">
                    <div class="eo-card-h"><h3 class="eo-card-t"><i data-lucide="calendar-clock" class="w-5 h-5" style="color:#8B5CF6"></i> Upcoming</h3><span class="eo-pill eo-pill-amber">${upcoming.length}</span></div>
                    <div class="eo-card-b" style="padding-top:8px;padding-bottom:8px">${upcomingList || '<div class="eo-empty" style="padding:20px;font-size:13px">Nothing upcoming.</div>'}</div>
                </div>
            </div>
        </div>

        <div class="eo-card">
            <div class="eo-card-h">
                <h3 class="eo-card-t"><i data-lucide="clock" class="w-5 h-5" style="color:#6366F1"></i> Recent Submissions</h3>
                <button onclick="setPageAndCloseSidebarEO('exam-office-results')" class="eo-btn eo-btn-soft" style="padding:8px 14px">View all <i data-lucide="arrow-right" class="w-4 h-4"></i></button>
            </div>
            <div class="overflow-x-auto">
                <table class="eo-table">
                    <thead><tr><th>Student</th><th>Class</th><th>Subject</th><th>Score</th><th>Grade</th><th>Submitted</th></tr></thead>
                    <tbody>${recentRows}</tbody>
                </table>
            </div>
        </div>
    `;

    const after = `
        <div id="examOfficeModal" class="eo-modal hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div class="eo-modal-card max-w-3xl max-h-[85vh] flex flex-col">
                <div class="eo-modal-h">
                    <h3 id="modalTitle"></h3>
                    <button onclick="closeExamOfficeModal()" class="eo-x"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div id="modalContent" class="flex-1 overflow-y-auto" style="padding:20px"></div>
            </div>
        </div>`;

    return eoLayout({
        state, active: 'exam-office-dashboard', crumb: 'Dashboard',
        title: 'Exam Administration', subtitle: 'Click a class to schedule exams',
        actions: `<button onclick="setPageAndCloseSidebarEO('exam-office-schedule')" class="eo-btn"><i data-lucide="calendar" class="w-4 h-4"></i> Open Schedule</button>`,
        body, after
    });
}

// ============================================================================
// UPLOAD PAGE
// ============================================================================
function renderExamOfficeUploadPage(state) {
    eoInjectDesignCSS();
    const recentUploads = state.recentUploads || [];

    const body = `
        <!-- Package Import Banner -->
        <div class="eo-card mb-5" style="background:linear-gradient(135deg,#EEF2FF,#F5F3FF);border-color:#C7D2FE">
            <div class="eo-card-b" style="padding:16px 20px">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                        <div class="eo-kpi-ic" style="--k:#4F46E5;background:#4F46E5"><i data-lucide="package" class="w-5 h-5"></i></div>
                        <div class="min-w-0">
                            <p style="margin:0;font-weight:900">Import Complete Package</p>
                            <p style="margin:2px 0 0;font-size:12px;color:#64748B">Replace all exams with a single package file</p>
                        </div>
                    </div>
                    <button onclick="handleImportPackage()" class="eo-btn">
                        <i data-lucide="package-plus" class="w-4 h-4"></i>
                        <span>Import Package</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Instructions -->
        <div class="mb-5 flex items-start gap-3" style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:16px;padding:16px 18px">
            <i data-lucide="info" class="w-5 h-5 flex-shrink-0 mt-0.5" style="color:#2563EB"></i>
            <div>
                <h3 style="margin:0;font-weight:900;color:#1E40AF;font-size:15px">How It Works</h3>
                <p style="margin:4px 0 0;font-size:13px;color:#1D4ED8;line-height:1.55">Upload one or more CSV exam files, including files exported from this app. CSV columns are matched by header, and files for multiple classes can be uploaded together.</p>
            </div>
        </div>

        <!-- Upload Area -->
        <div class="eo-card mb-5">
            <div class="eo-card-h"><h3 class="eo-card-t"><i data-lucide="upload-cloud" class="w-5 h-5" style="color:#6366F1"></i> Upload Exam Files</h3></div>
            <div class="eo-card-b">
                <div id="upload-zone" class="upload-zone" ondrop="handleDrop(event)" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)">
                    <input type="file" id="exam-file-input" multiple accept=".csv,text/csv,application/csv,text/comma-separated-values,application/vnd.ms-excel" onchange="handleExamOfficeFileSelect(event)" style="display:none;">
                    <div id="upload-content" onclick="document.getElementById('exam-file-input').click()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();document.getElementById('exam-file-input').click();}" role="button" tabindex="0">
                        <div class="eo-empty-ic" style="background:#E0E7FF;color:#6366F1;width:84px;height:84px;border-radius:26px"><i data-lucide="upload-cloud" class="w-10 h-10"></i></div>
                        <p style="margin:0 0 6px;font-size:19px;font-weight:900">Drag &amp; Drop CSV files here</p>
                        <p style="margin:0 0 14px;font-size:14px;color:#64748B">or click to browse your files</p>
                        <span class="eo-pill eo-pill-violet" style="font-size:12px;padding:6px 14px">.csv format only</span>
                    </div>
                    <div id="upload-status" class="hidden mt-4">
                        <div class="flex items-center justify-between mb-2">
                            <span id="files-selected-info" style="font-size:14px;font-weight:700;color:#334155"></span>
                            <button onclick="clearFileList()" style="font-size:13px;font-weight:700;color:#E11D48;background:none;border:none;cursor:pointer">Clear All</button>
                        </div>
                        <div id="file-list" class="space-y-1"></div>
                        <div class="flex justify-between items-center mt-4 flex-wrap gap-2">
                            <span id="upload-progress-text" style="font-size:13px;color:#64748B"></span>
                            <button id="process-upload-btn" onclick="processExamUpload()" class="eo-btn eo-btn-green" style="padding:12px 22px">
                                <i data-lucide="upload" class="w-4 h-4"></i>
                                Upload &amp; Save All
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Uploads -->
        <div class="eo-card">
            <div class="eo-card-h">
                <h3 class="eo-card-t"><i data-lucide="clock" class="w-5 h-5" style="color:#6366F1"></i> Recent Uploads</h3>
                <span class="eo-pill eo-pill-violet">${recentUploads.length} upload(s)</span>
            </div>
            ${recentUploads.length > 0 ? `
                <div class="overflow-x-auto">
                    <table class="eo-table">
                        <thead><tr><th>File</th><th>Exams</th><th>Questions</th><th>Status</th><th>Time</th></tr></thead>
                        <tbody>
                            ${recentUploads.map(upload => `
                                <tr>
                                    <td><div class="flex items-center gap-3 min-w-0"><div class="eo-kpi-ic" style="--k:#E0E7FF;background:#E0E7FF;color:#4F46E5;width:36px;height:36px;border-radius:11px"><i data-lucide="file-text" class="w-4 h-4"></i></div><span class="truncate" style="font-weight:800;max-width:280px">${eEsc(upload.filename)}</span></div></td>
                                    <td style="font-weight:700">${eEsc(upload.examCount)}</td>
                                    <td style="font-weight:700">${eEsc(upload.questionCount)}</td>
                                    <td><span class="eo-pill ${upload.status === 'success' ? 'eo-pill-green' : 'eo-pill-amber'}">${upload.status === 'success' ? 'Processed' : 'Pending'}</span></td>
                                    <td style="font-size:12px;color:#94A3B8">${eEsc(upload.time)}</td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="eo-empty"><div class="eo-empty-ic"><i data-lucide="inbox" class="w-8 h-8"></i></div><p style="margin:0;font-weight:600">No uploads yet. Upload your first exam file above!</p></div>
            `}
        </div>
    `;

    return eoLayout({
        state, active: 'exam-office-upload', crumb: 'Upload Exams',
        title: 'Upload Exams', subtitle: 'Import exam files (CSV) to your school platform', body
    });
}

// ========================================
// EXAM OFFICE SCHEDULE PAGE
// ========================================

// Pure-DOM helper: tick every exam checkbox in one class panel and reuse the
// existing handleScheduleCheckboxChange() so the bulk toolbar stays in sync.
function eoSelectClass(masterCheckbox) {
    const block = masterCheckbox.closest('[data-class-block]');
    if (!block) return;
    block.querySelectorAll('.schedule-checkbox').forEach(cb => {
        if (cb.checked !== masterCheckbox.checked) {
            cb.checked = masterCheckbox.checked;
            if (typeof handleScheduleCheckboxChange === 'function') handleScheduleCheckboxChange(cb);
        }
    });
}

function renderExamOfficeSchedulePage(state) {
    eoInjectDesignCSS();
    const exams = state.availableExams || [];

    // Separate CA and Exam assessments
    const caExams = exams.filter(e => (e.assessmentType || 'EXAM') === 'CA');
    const examExams = exams.filter(e => (e.assessmentType || 'EXAM') === 'EXAM');

    // Group EXAM exams by class (CAs don't need scheduling)
    const examsByClass = {};
    examExams.forEach(exam => {
        const cls = exam.class || 'Unknown';
        if (!examsByClass[cls]) examsByClass[cls] = [];
        examsByClass[cls].push(exam);
    });

    const today = eoLocalToday();
    const scheduledCount = examExams.filter(e => e.scheduledDate).length;

    // Class panels with scheduling table and checkboxes
    const classCardsHtml = Object.keys(examsByClass).length > 0
        ? Object.entries(examsByClass).map(([cls, clsExams]) => {
            const clsScheduled = clsExams.filter(e => e.scheduledDate).length;
            return `
                <div class="eo-card mb-5 overflow-hidden" data-class-block="${eEsc(cls)}">
                    <div class="eo-card-h">
                        <div class="flex items-center gap-3">
                            <div class="eo-kpi-ic" style="--k:#6366F1;background:linear-gradient(135deg,#6366F1,#8B5CF6)"><i data-lucide="school" class="w-5 h-5"></i></div>
                            <div>
                                <h3 style="margin:0;font-size:18px;font-weight:900">${eEsc(cls)}</h3>
                                <p style="margin:1px 0 0;font-size:12px;color:#64748B;font-weight:600">${clsExams.length} exams • ${clsScheduled} scheduled</p>
                            </div>
                        </div>
                        <button onclick="openClassScheduleModal('${eJs(cls)}')" class="eo-btn">
                            <i data-lucide="calendar-plus" class="w-4 h-4"></i>
                            Schedule All for ${eEsc(cls)}
                        </button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="eo-table">
                            <thead>
                                <tr>
                                    <th style="width:44px"><input type="checkbox" class="eo-check" title="Select all in ${eEsc(cls)}" onchange="eoSelectClass(this)"></th>
                                    <th>Subject</th>
                                    <th>Questions</th>
                                    <th>Date</th>
                                    <th>Limit</th>
                                    <th>Status</th>
                                    <th style="text-align:right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${clsExams.map(exam => {
                                    const isScheduled = exam.scheduledDate;
                                    return `
                                    <tr class="schedule-exam-item">
                                        <td>
                                            <input type="checkbox"
                                                class="eo-check schedule-checkbox"
                                                data-exam-id="${eEsc(exam.exam_id)}"
                                                onchange="handleScheduleCheckboxChange(this)">
                                        </td>
                                        <td>
                                            <p class="truncate" style="margin:0;font-weight:800;max-width:260px">${eEsc(exam.subject)}</p>
                                            <p class="truncate" style="margin:1px 0 0;font-size:11px;color:#94A3B8;max-width:260px">${eEsc(exam.exam_id)}</p>
                                        </td>
                                        <td style="font-weight:700">${(exam.questions || []).length}</td>
                                        <td style="white-space:nowrap;font-weight:600;color:${isScheduled ? '#0F172A' : '#94A3B8'}">${isScheduled ? '📅 ' + eDate(exam.scheduledDate) : '⏳ Not scheduled'}</td>
                                        <td>${eoLimitBadge(exam)}</td>
                                        <td>${eoStatusPill(exam)}</td>
                                        <td style="text-align:right;white-space:nowrap">
                                            <button onclick="openExamScheduleModal('${eJs(exam.exam_id)}')" class="eo-btn-ico eo-ico-ed" title="Schedule this exam">
                                                <i data-lucide="calendar" class="w-4 h-4"></i>
                                            </button>
                                            <button onclick="deleteExamFromExamOffice('${eJs(exam.exam_id)}', '${eJs(exam.subject)}')" class="eo-btn-ico eo-ico-del" title="Delete this exam">
                                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                                            </button>
                                        </td>
                                    </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }).join('')
        : `<div class="eo-card"><div class="eo-empty"><div class="eo-empty-ic"><i data-lucide="inbox" class="w-9 h-9"></i></div><p style="margin:0;font-size:17px;font-weight:700;color:#64748B">No Examinations available to schedule. CAs are excluded.</p></div></div>`;

    // Bulk toolbar: classes kept exactly so the existing JS can show/hide it
    const floating = `
        <div id="bulk-schedule-toolbar" class="eo-toolbar hidden absolute top-20 left-1/2 transform -translate-x-1/2 z-40 items-center gap-4 animate-fadeIn">
            <div class="flex items-center gap-2 pr-3" style="border-right:1px solid #E2E8F0">
                <span id="bulk-schedule-count" style="font-size:13px;font-weight:900;color:#4338CA;white-space:nowrap">0 selected</span>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="openBulkScheduleModal()" class="eo-btn" style="padding:8px 14px">
                    <i data-lucide="calendar" class="w-4 h-4"></i> Schedule
                </button>
                <button onclick="deleteSelectedExamsFromExamOffice()" class="eo-btn" style="padding:8px 14px;background:linear-gradient(135deg,#E11D48,#F43F5E);box-shadow:none">
                    <i data-lucide="trash-2" class="w-4 h-4"></i> Delete
                </button>
            </div>
        </div>`;

    const body = `
        <div class="eo-rise grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5 mb-5">
            <div class="eo-kpi" style="--k:#6366F1"><div class="eo-kpi-l" style="margin:0">Examinations</div><div class="eo-kpi-n" style="margin-top:8px">${examExams.length}</div></div>
            <div class="eo-kpi" style="--k:#10B981"><div class="eo-kpi-l" style="margin:0">Scheduled</div><div class="eo-kpi-n" style="margin-top:8px">${scheduledCount}</div></div>
            <div class="eo-kpi" style="--k:#F59E0B"><div class="eo-kpi-l" style="margin:0">Awaiting a date</div><div class="eo-kpi-n" style="margin-top:8px">${examExams.length - scheduledCount}</div></div>
        </div>

        ${caExams.length > 0 ? `
            <div class="mb-5 flex items-start gap-3" style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:16px;padding:14px 16px">
                <i data-lucide="info" class="w-5 h-5 flex-shrink-0 mt-0.5" style="color:#2563EB"></i>
                <div>
                    <p style="margin:0;font-size:14px;font-weight:800;color:#1E40AF">${caExams.length} CA exam(s) don't need scheduling</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#1D4ED8">Continuous Assessments are always visible to students as soon as the package is imported.</p>
                </div>
            </div>
        ` : ''}

        ${classCardsHtml}
    `;

    const after = `
        <!-- Individual Exam Schedule Modal -->
        <div id="examScheduleModal" class="eo-modal hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div class="eo-modal-card max-w-md">
                <div class="eo-modal-h">
                    <h3 id="examScheduleModalTitle">Schedule Exam</h3>
                    <button onclick="closeExamScheduleModal()" class="eo-x"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div style="padding:22px">
                    <p id="examScheduleInfo" class="text-sm text-gray-600 mb-4">Set the date for this exam.</p>
                    <form id="exam-schedule-form" onsubmit="saveExamSchedule(event)">
                        <input type="hidden" id="schedule-exam-id">
                        <div class="mb-4">
                            <label class="eo-label">Schedule Date</label>
                            <input type="date" id="schedule-date-picker" class="eo-input" min="${today}" required />
                        </div>
                        ${eoLimitPicker('single-question-limit', '')}
                        <div class="flex justify-end gap-3">
                            <button type="button" onclick="closeExamScheduleModal()" class="eo-btn eo-btn-soft">Cancel</button>
                            <button type="submit" class="eo-btn"><i data-lucide="calendar-check" class="w-4 h-4"></i> Schedule</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Class Schedule Modal -->
        <div id="classScheduleModal" class="eo-modal hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div class="eo-modal-card max-w-md">
                <div class="eo-modal-h">
                    <h3 id="classScheduleModalTitle">Schedule All</h3>
                    <button onclick="closeClassScheduleModal()" class="eo-x"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div style="padding:22px">
                    <p id="classScheduleInfo" class="text-sm text-gray-600 mb-4">Set the date for all exams in this class.</p>
                    <form id="class-schedule-form" onsubmit="saveClassSchedule(event)">
                        <input type="hidden" id="schedule-class-name">
                        <div class="mb-4">
                            <label class="eo-label">Schedule Date</label>
                            <input type="date" id="class-schedule-date-picker" class="eo-input" min="${today}" required />
                        </div>
                        ${eoLimitPicker('class-question-limit', 'One limit for the whole class. CAs are excluded.')}
                        <div class="flex justify-end gap-3">
                            <button type="button" onclick="closeClassScheduleModal()" class="eo-btn eo-btn-soft">Cancel</button>
                            <button type="submit" class="eo-btn"><i data-lucide="calendar-check" class="w-4 h-4"></i> Schedule All</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Bulk Schedule Modal -->
        <div id="bulkScheduleModal" class="eo-modal hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div class="eo-modal-card max-w-md">
                <div class="eo-modal-h">
                    <h3 id="bulkScheduleModalTitle">Schedule Exams</h3>
                    <button onclick="closeBulkScheduleModal()" class="eo-x"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div style="padding:22px">
                    <p class="text-sm text-gray-600 mb-4">Select one date for all selected examinations.</p>
                    <form onsubmit="saveBulkSchedule(event)">
                        <div class="mb-4">
                            <label class="eo-label">Schedule Date</label>
                            <input type="date" id="bulk-schedule-date-picker" class="eo-input" min="${today}" required />
                        </div>
                        ${eoLimitPicker('bulk-question-limit', 'Each student gets this many questions, shuffled from the full bank. CA exams are not affected.')}
                        <div class="flex justify-end gap-3">
                            <button type="button" onclick="closeBulkScheduleModal()" class="eo-btn eo-btn-soft">Cancel</button>
                            <button type="submit" class="eo-btn"><i data-lucide="calendar-check" class="w-4 h-4"></i> Schedule Selected</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;

    return eoLayout({
        state, active: 'exam-office-schedule', crumb: 'Schedule',
        title: 'Schedule Exams', subtitle: 'Select multiple exams to schedule them together',
        actions: `<button onclick="exportAllExamsSingleFile()" class="eo-btn eo-btn-green"><i data-lucide="package" class="w-4 h-4"></i><span class="hidden sm:inline">Export Package</span><span class="sm:hidden">Export</span></button>`,
        body, floating, after
    });
}

// ============================================================================
// RESULTS PAGE
// ============================================================================
function renderExamOfficeResultsPage(state) {
    eoInjectDesignCSS();
    const { subject, class: studentClass, arms } = state.resultFilter || {};
    const allResults = state.allResults || [];

    const filteredResults = allResults.filter(result => {
        const subjectMatch = !subject || result.exam_subject === subject;
        const classMatch = !studentClass || result.student_class === studentClass;
        const armsMatch = !arms || result.student_arms === arms;
        return subjectMatch && classMatch && armsMatch;
    });

    const computed = filteredResults.map(eoCalc);
    const avg = computed.length ? Math.round(computed.reduce((s, c) => s + c.percentage, 0) / computed.length) : 0;
    const passRate = computed.length ? Math.round((computed.filter(c => c.percentage >= 50).length / computed.length) * 100) : 0;
    const top = computed.length ? Math.max(...computed.map(c => c.percentage)) : 0;

    const resultsList = filteredResults.length === 0 ?
        `<tr><td colspan="9"><div class="eo-empty"><div class="eo-empty-ic"><i data-lucide="search-x" class="w-8 h-8"></i></div><p style="margin:0;font-size:16px;font-weight:700;color:#64748B">No results found. Try adjusting the filters.</p></div></td></tr>` :
        filteredResults.map((result, index) => {
            const { total: totalQuestions, score, percentage } = computed[index];
            const { grade, tone } = eoGrade(percentage);
            const barColor = percentage >= 50 ? '#10B981' : '#F43F5E';
            const search = [result.student_name, result.student_class, result.student_arms, result.exam_subject].join(' ').toLowerCase();

            return `
                <tr data-search="${eEsc(search)}">
                    <td style="font-weight:700;color:#94A3B8">${index + 1}</td>
                    <td style="font-weight:800">${eEsc(result.student_name || 'Anonymous')}</td>
                    <td style="color:#475569;font-weight:600">${eEsc(result.student_class || '')}${eEsc(result.student_arms || '')}</td>
                    <td style="color:#334155;font-weight:600">${eEsc(result.exam_subject || result.exam_id || '')}</td>
                    <td style="text-align:center;font-weight:900">${score}<span style="color:#94A3B8;font-weight:700">/${totalQuestions}</span></td>
                    <td style="text-align:center;min-width:110px">
                        <div style="font-size:16px;font-weight:900">${percentage}%</div>
                        <div class="eo-bar" style="height:5px;margin-top:4px"><i style="width:${Math.min(100, percentage)}%;background:${barColor}"></i></div>
                    </td>
                    <td style="text-align:center"><span class="eo-gr ${tone}">${grade}</span></td>
                    <td style="font-size:12px;color:#64748B;font-weight:600;white-space:nowrap">${eoDateTime(result.submitted_at)}</td>
                    <td style="text-align:right">
                        <button onclick="viewDetailedResult('${eJs(result.result_id)}')" class="eo-btn eo-btn-soft" style="padding:7px 12px;font-size:12px">
                            <i data-lucide="eye" class="w-4 h-4"></i> Details
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    const chips = [
        subject ? `Subject: ${eEsc(subject)}` : '',
        studentClass ? `Class: ${eEsc(studentClass)}` : '',
        arms ? `Arms: ${eEsc(arms)}` : ''
    ].filter(Boolean).map(t => `<span class="eo-pill eo-pill-violet">${t}</span>`).join(' ');

    const body = `
        <div class="eo-rise grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5 mb-5">
            <div class="eo-kpi" style="--k:#6366F1"><div class="flex items-center justify-between"><div class="eo-kpi-ic"><i data-lucide="users" class="w-5 h-5"></i></div><span class="eo-kpi-n">${filteredResults.length}</span></div><div class="eo-kpi-l">Records</div></div>
            <div class="eo-kpi" style="--k:#8B5CF6"><div class="flex items-center justify-between"><div class="eo-kpi-ic"><i data-lucide="percent" class="w-5 h-5"></i></div><span class="eo-kpi-n">${avg}%</span></div><div class="eo-kpi-l">Average Score</div></div>
            <div class="eo-kpi" style="--k:#10B981"><div class="flex items-center justify-between"><div class="eo-kpi-ic"><i data-lucide="badge-check" class="w-5 h-5"></i></div><span class="eo-kpi-n">${passRate}%</span></div><div class="eo-kpi-l">Pass Rate (50%+)</div></div>
            <div class="eo-kpi" style="--k:#F59E0B"><div class="flex items-center justify-between"><div class="eo-kpi-ic"><i data-lucide="trophy" class="w-5 h-5"></i></div><span class="eo-kpi-n">${top}%</span></div><div class="eo-kpi-l">Highest Score</div></div>
        </div>

        <div class="eo-card overflow-hidden">
            <div class="eo-card-h">
                <div>
                    <h3 class="eo-card-t">Results Summary</h3>
                    <p style="margin:3px 0 0;font-size:13px;color:#64748B">Total: <strong id="eo-results-shown">${filteredResults.length}</strong> record(s) ${chips ? '&nbsp;' + chips : ''}</p>
                </div>
                <div class="eo-search">
                    <i data-lucide="search" class="w-4 h-4"></i>
                    <input type="search" class="eo-input" placeholder="Search name, class, subject…" oninput="eoFilterResults(this.value)" />
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="eo-table">
                    <thead>
                        <tr>
                            <th>#</th><th>Student</th><th>Class</th><th>Subject</th>
                            <th style="text-align:center">Score</th><th style="text-align:center">%</th><th style="text-align:center">Grade</th>
                            <th>Date</th><th style="text-align:right">Action</th>
                        </tr>
                    </thead>
                    <tbody id="eo-results-body">
                        ${resultsList}
                        <tr id="eo-results-none" style="display:none"><td colspan="9" style="padding:36px;text-align:center;color:#94A3B8;font-weight:600">No results match your search.</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    return eoLayout({
        state, active: 'exam-office-results', crumb: 'Results',
        title: 'Exam Results', subtitle: 'View and analyze all exam results',
        actions: `<button onclick="toggleFilterModal()" class="eo-btn"><i data-lucide="filter" class="w-4 h-4"></i><span>Filter</span></button>`,
        body,
        after: state.showFilterModal && typeof renderFilterModal === 'function' ? renderFilterModal(state) : ''
    });
}

// Client-side results search (pure DOM, no state touched)
function eoFilterResults(q) {
    const term = String(q || '').trim().toLowerCase();
    const rows = document.querySelectorAll('#eo-results-body tr[data-search]');
    let shown = 0;
    rows.forEach(r => {
        const match = !term || (r.getAttribute('data-search') || '').indexOf(term) !== -1;
        r.style.display = match ? '' : 'none';
        if (match) shown++;
    });
    const none = document.getElementById('eo-results-none');
    if (none) none.style.display = (rows.length > 0 && shown === 0) ? '' : 'none';
    const cnt = document.getElementById('eo-results-shown');
    if (cnt) cnt.textContent = shown;
}

// ========================================
// EXAM OFFICE MODAL HELPERS
// ========================================

function showClassExams(className) {
    const modal = document.getElementById('examOfficeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    if (!modal || !modalTitle || !modalContent) return;

    // FIX: EXAMs only — CAs are never scheduled (matches the dashboard class cards)
    const exams = (state.availableExams || []).filter(exam => exam.class === className && (exam.assessmentType || 'EXAM') === 'EXAM');

    modalTitle.textContent = `${className} - Select Exams to Schedule`;

    modalContent.innerHTML = exams.length === 0
        ? `<div class="eo-empty"><div class="eo-empty-ic"><i data-lucide="inbox" class="w-8 h-8"></i></div><p style="margin:0;font-weight:600">No examinations in this class.</p></div>`
        : exams.map(exam => {
        const isScheduled = exam.scheduledDate;
        const scheduledDate = isScheduled ? eDate(exam.scheduledDate) : '';

        return `
            <div style="border:1px solid ${isScheduled ? '#A7F3D0' : '#E2E8F0'};background:${isScheduled ? '#F0FDF4' : '#F8FAFC'};border-left:5px solid ${isScheduled ? '#10B981' : '#CBD5E1'};border-radius:16px;padding:16px;margin-bottom:12px">
                <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-2 flex-wrap">
                            <input type="checkbox" 
                                    ${isScheduled ? 'checked' : ''}
                                    onchange="toggleExamSchedule('${eJs(exam.exam_id)}', this.checked)"
                                    class="eo-check">
                            <h3 style="margin:0;font-weight:900">${eEsc(exam.subject)}</h3>
                            ${eoStatusPill(exam)}
                        </div>
                        <p style="margin:0 0 8px;font-size:12px;color:#94A3B8">${eEsc(exam.exam_id)}</p>
                        <div class="flex flex-wrap gap-4" style="font-size:13px;color:#475569;font-weight:600">
                            <span class="flex items-center gap-1"><i data-lucide="list" class="w-3 h-3"></i> ${(exam.questions || []).length} Questions</span>
                            <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ${eEsc(exam.duration)} mins</span>
                        </div>
                        ${isScheduled ? `<p style="margin:8px 0 0;font-size:12px;color:#059669;font-weight:800">Scheduled: ${scheduledDate}</p><div class="mt-1">${eoLimitBadge(exam)}</div>` : ''}
                    </div>
                    <div class="flex flex-col gap-1">
                        <button onclick="shareExamWithOptions('${eJs(exam.exam_id)}')" class="eo-btn-ico eo-ico-sh" title="Share">
                            <i data-lucide="share-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeExamOfficeModal() {
    const modal = document.getElementById('examOfficeModal');
    if (modal) modal.classList.add('hidden');
}

// ========================================
// SCHEDULE MODAL FUNCTIONS
// ========================================

let currentScheduleExamId = null;

function openExamScheduleModal(examId) {
    currentScheduleExamId = examId;
    const exam = state.availableExams.find(e => e.exam_id === examId);
    if (!exam) return;
    
    document.getElementById('schedule-exam-id').value = examId;
    document.getElementById('examScheduleModalTitle').textContent = `Schedule: ${exam.subject}`;
    document.getElementById('examScheduleInfo').textContent = `Set the date for ${exam.subject} (${exam.class})`;
    
    if (exam.scheduledDate) {
        document.getElementById('schedule-date-picker').value = exam.scheduledDate;
    } else {
        document.getElementById('schedule-date-picker').value = '';
    }
    // Pre-select saved 40/70 limit so re-scheduling never silently resets it
    const savedLimit = exam.questionLimit === 70 ? '70' : '40';
    document.querySelectorAll('input[name="single-question-limit"]').forEach(radio => { radio.checked = (radio.value === savedLimit); });

    document.getElementById('examScheduleModal').classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeExamScheduleModal() {
    document.getElementById('examScheduleModal').classList.add('hidden');
}

async function saveExamSchedule(event) {
    if (event) event.preventDefault();
    const examId = document.getElementById('schedule-exam-id').value;
    const date = document.getElementById('schedule-date-picker').value;
    
    if (!date) {
        showAlert('Please select a date', 'error');
        return;
    }

    const exam = state.availableExams.find(e => e.exam_id === examId);
    if (!exam) {
        showAlert('Exam not found', 'error');
        return;
    }

    // 40/70 GATE — only EXAMs, never CAs. FIX: validate BEFORE touching the exam.
    let questionLimit = exam.questionLimit;
    if (!isCA(exam)) {
        const picked = document.querySelector('input[name="single-question-limit"]:checked');
        questionLimit = getValidQuestionLimit(picked ? picked.value : null);
        if (questionLimit === null) { showAlert('Please pick 40 or 70 questions per student', 'error'); return; }
    }

    const prev = { scheduledDate: exam.scheduledDate, questionLimit: exam.questionLimit };
    try {
        exam.scheduledDate = date;
        if (!isCA(exam)) exam.questionLimit = questionLimit;
        await saveExamToDB(exam);
        await loadExams();

        showAlert(`✅ "${exam.subject}" scheduled for ${eDate(date)}${exam.questionLimit ? ` — ${exam.questionLimit} questions/student` : ''}`, 'success');
        closeExamScheduleModal();
        render();
    } catch (err) {
        // FIX: roll back the in-memory change so the screen never shows an unsaved schedule
        exam.scheduledDate = prev.scheduledDate;
        exam.questionLimit = prev.questionLimit;
        console.error('Error scheduling exam:', err);
        showAlert('Failed to schedule exam', 'error');
    }
}

function openClassScheduleModal(className) {
    document.getElementById('schedule-class-name').value = className;
    document.getElementById('classScheduleModalTitle').textContent = `Schedule All: ${className}`;
    document.getElementById('classScheduleInfo').textContent = `Set the date for all Examinations in ${className} (CAs are excluded)`;

    // FIX: pre-select the class's existing date / limit instead of resetting to 40
    const classExams = (state.availableExams || []).filter(e => e.class === className && (e.assessmentType || 'EXAM') === 'EXAM');
    const dates = Array.from(new Set(classExams.map(e => e.scheduledDate).filter(Boolean)));
    document.getElementById('class-schedule-date-picker').value = dates.length === 1 ? dates[0] : '';
    const limits = Array.from(new Set(classExams.map(e => e.questionLimit).filter(Boolean)));
    const savedLimit = (limits.length === 1 && limits[0] === 70) ? '70' : '40';
    document.querySelectorAll('input[name="class-question-limit"]').forEach(radio => { radio.checked = (radio.value === savedLimit); });

    document.getElementById('classScheduleModal').classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeClassScheduleModal() {
    document.getElementById('classScheduleModal').classList.add('hidden');
}

async function saveClassSchedule(event) {
    if (event) event.preventDefault();
    const className = document.getElementById('schedule-class-name').value;
    const date = document.getElementById('class-schedule-date-picker').value;

    if (!date) {
        showAlert('Please select a date', 'error');
        return;
    }
    // 40/70 GATE — one limit for the whole class
    const pickedClass = document.querySelector('input[name="class-question-limit"]:checked');
    const classQuestionLimit = getValidQuestionLimit(pickedClass ? pickedClass.value : null);
    if (classQuestionLimit === null) { showAlert('Please pick 40 or 70 questions per student', 'error'); return; }

    try {
        // Only schedule EXAM type (skip CAs)
        const classExams = state.availableExams.filter(
            e => e.class === className && (e.assessmentType || 'EXAM') === 'EXAM'
        );

        if (classExams.length === 0) {
            showAlert('No Examinations to schedule in this class (CAs are excluded)', 'info');
            closeClassScheduleModal();
            return;
        }

        let scheduled = 0;

        for (const exam of classExams) {
            exam.scheduledDate = date;
            exam.questionLimit = classQuestionLimit;
            await saveExamToDB(exam);
            scheduled++;
        }

        await loadExams();
        showAlert(`✅ ${scheduled} examination(s) scheduled for ${eDate(date)}`, 'success');
        closeClassScheduleModal();
        render();
    } catch (err) {
        console.error('Error scheduling class exams:', err);
        showAlert('Failed to schedule exams', 'error');
        // FIX: a mid-loop failure leaves some exams changed in memory only -> resync from the DB
        try { await loadExams(); render(); } catch (e) { /* ignore */ }
    }
}

// ========================================
// EXPORTS
// ========================================

window.renderExamOfficeRegisterPage = renderExamOfficeRegisterPage;
window.renderExamOfficeLoginPage = renderExamOfficeLoginPage;
window.renderExamOfficeDashboard = renderExamOfficeDashboard;
window.renderExamOfficeUploadPage = renderExamOfficeUploadPage;
window.renderExamOfficeSchedulePage = renderExamOfficeSchedulePage;
window.renderExamOfficeResultsPage = renderExamOfficeResultsPage;
window.showClassExams = showClassExams;
window.closeExamOfficeModal = closeExamOfficeModal;
window.openExamScheduleModal = openExamScheduleModal;
window.closeExamScheduleModal = closeExamScheduleModal;
window.saveExamSchedule = saveExamSchedule;
window.openClassScheduleModal = openClassScheduleModal;
window.closeClassScheduleModal = closeClassScheduleModal;
window.saveClassSchedule = saveClassSchedule;
window.eoSelectClass = eoSelectClass;
window.eoFilterResults = eoFilterResults;
// Shared helpers used by exam-officer.actions.js (bulk schedule) at runtime:
window.isCA = isCA;
window.getValidQuestionLimit = getValidQuestionLimit;
window.eoLimitBadge = eoLimitBadge;
window.eoStatusPill = eoStatusPill;