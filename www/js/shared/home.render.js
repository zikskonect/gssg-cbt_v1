// ─── Shared Auth Background Helper ───────────────────────
// Renders a full-screen faded school image behind login/entry pages.
// Pulls its values from SCHOOL_CONFIG so changing one file updates
// every login screen (teacher, exam office, student).
function renderAuthBackground() {
    const bgImage   = window.SCHOOL_CONFIG?.homeBgImage   || '';
    const bgOpacity = window.SCHOOL_CONFIG?.homeBgOpacity ?? 0.15;

    if (!bgImage) return '';

    return `
        <div style="
            position: fixed;
            inset: 0;
            background-image: url('${bgImage}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            opacity: ${bgOpacity};
            pointer-events: none;
            z-index: 0;
        "></div>
    `;
}

window.renderAuthBackground = renderAuthBackground;


// ─── Home Page ───────────────────────────────────────────
// Optional SCHOOL_CONFIG field (new):
//   homeBgPosition  → CSS object-position for the photo, e.g. 'center 30%',
//                     'left center', '70% 40%'. Default: 'center 35%'
//                     (keeps buildings/faces in frame; skies get cropped first).
function renderHomePage() {
    const schoolName     = window.SCHOOL_CONFIG?.schoolName      || 'School';
    const shortName      = window.SCHOOL_CONFIG?.schoolShortName || 'SCH';
    const logoPath       = window.SCHOOL_CONFIG?.logoPath        || 'js/icons/128x128.png';
    const themeColor     = window.SCHOOL_CONFIG?.themeColor      || '#B80236';
    const secondaryColor = window.SCHOOL_CONFIG?.secondaryColor  || '#8a0228';
    const tagline        = window.SCHOOL_CONFIG?.tagline         || 'Education for Positive Change';
    const subtitle       = window.SCHOOL_CONFIG?.subtitle        || 'Offline Examination Platform';
    const bgImage        = window.SCHOOL_CONFIG?.homeBgImage     || '';
    const bgPosition     = window.SCHOOL_CONFIG?.homeBgPosition  || 'center 35%';
    const year           = new Date().getFullYear();

    return `
        <style>
            @keyframes homeKenBurns {
                0%   { transform: scale(1.04); }
                100% { transform: scale(1.12); }
            }
            @keyframes homeFadeUp {
                0%   { opacity: 0; transform: translateY(18px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            @keyframes homeFadeIn {
                0%   { opacity: 0; }
                100% { opacity: 1; }
            }
            .home-kenburns { animation: homeKenBurns 28s ease-in-out infinite alternate; will-change: transform; }
            .home-fade-up  { opacity: 0; animation: homeFadeUp .7s cubic-bezier(.2,.7,.2,1) forwards; }
            .home-fade-in  { opacity: 0; animation: homeFadeIn 1s ease forwards; }
            .home-d1 { animation-delay: .10s; }
            .home-d2 { animation-delay: .20s; }
            .home-d3 { animation-delay: .30s; }
            .home-d4 { animation-delay: .40s; }
            .home-d5 { animation-delay: .50s; }
            .home-role-btn { -webkit-tap-highlight-color: transparent; }
            @media (prefers-reduced-motion: reduce) {
                .home-kenburns, .home-fade-up, .home-fade-in { animation: none !important; opacity: 1 !important; transform: none !important; }
            }
        </style>

        <div class="relative h-screen w-screen overflow-hidden"
             style="background: linear-gradient(135deg, ${themeColor} 0%, ${secondaryColor} 100%);">

            <!-- ============================================ -->
            <!-- BACKGROUND — full-bleed photo, positioned    -->
            <!-- ============================================ -->
            ${bgImage ? `
                <img src="${bgImage}"
                     alt=""
                     aria-hidden="true"
                     class="home-kenburns absolute inset-0 w-full h-full object-cover"
                     style="object-position: ${bgPosition};"
                     onerror="this.style.display='none';" />
            ` : `
                <!-- Fallback pattern when no image is configured -->
                <div class="absolute inset-0 opacity-20"
                     style="background-image: radial-gradient(circle at 20% 20%, rgba(255,255,255,.35) 0, transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,.25) 0, transparent 45%);"></div>
            `}

            <!-- Overlay (desktop): dark on the left for text, opens up to the right -->
            <div class="hidden md:block absolute inset-0"
                 style="background: linear-gradient(100deg, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.25) 70%, rgba(0,0,0,0.35) 100%);"></div>
            <!-- Overlay (mobile): light at the top so the photo shows, dark toward the sheet -->
            <div class="md:hidden absolute inset-0"
                 style="background: linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.10) 30%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.75) 100%);"></div>
            <!-- Brand tint -->
            <div class="absolute inset-0 pointer-events-none"
                 style="background: linear-gradient(135deg, ${themeColor}55 0%, transparent 55%); mix-blend-mode: multiply;"></div>

            <!-- ============================================ -->
            <!-- CONTENT                                      -->
            <!-- ============================================ -->
            <div class="relative z-10 h-full w-full flex flex-col md:flex-row">

                <!-- LEFT — Brand / Hero text -->
                <div class="flex-1 min-h-0 flex flex-col justify-between p-5 sm:p-8 md:p-12 lg:p-16 text-white">

                    <!-- Top: logo + short-name chip -->
                    <div class="home-fade-in flex items-center gap-3">
                        <div class="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center overflow-hidden shadow-2xl flex-shrink-0">
                            <img src="${logoPath}"
                                 alt="${shortName} Logo"
                                 class="w-full h-full object-contain p-1.5"
                                 onerror="this.style.display='none'; this.parentElement.innerHTML='<i data-lucide=&quot;graduation-cap&quot; class=&quot;w-8 h-8 text-white&quot;></i>'; if(window.lucide) lucide.createIcons();" />
                        </div>
                        <div class="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25">
                            <span class="text-xs sm:text-sm font-bold tracking-widest uppercase">${shortName}</span>
                        </div>
                    </div>

                    <!-- Bottom: school name, subtitle, tagline -->
                    <div class="max-w-2xl">
                        <div class="home-fade-up home-d1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 mb-3 md:mb-5">
                            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span class="text-[11px] sm:text-xs font-semibold tracking-wide">${subtitle}</span>
                        </div>

                        <h1 class="home-fade-up home-d2 text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight drop-shadow-2xl">
                            ${schoolName}
                        </h1>

                        <div class="home-fade-up home-d3 mt-3 md:mt-6 flex items-center gap-3">
                            <span class="h-[3px] w-10 sm:w-14 rounded-full bg-white/80"></span>
                            <p class="text-sm sm:text-base lg:text-xl font-medium italic text-white/90 drop-shadow-md">
                                "${tagline}"
                            </p>
                        </div>
                    </div>
                </div>

                <!-- RIGHT — Action card (glass) -->
                <div class="w-full md:w-[460px] lg:w-[520px] md:flex-shrink-0 md:flex md:items-center md:justify-center md:p-8 lg:p-10">
                    <div class="home-fade-up home-d2 w-full rounded-t-3xl md:rounded-3xl shadow-2xl border border-white/40"
                         style="background: rgba(255,255,255,0.92); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);">

                        <div class="px-5 sm:px-7 py-5 sm:py-6">

                            <!-- Grab handle (mobile sheet feel) -->
                            <div class="md:hidden mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300"></div>

                            <!-- Heading -->
                            <div class="mb-4">
                                <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Welcome</h2>
                                <p class="text-sm sm:text-base text-gray-600 mt-1">Pick your role to continue.</p>
                            </div>

                            <!-- Role buttons -->
                            <div class="w-full space-y-2.5 mb-4">

                                <!-- Student (primary) -->
                                <button onclick="setPage('student-info')"
                                        class="home-role-btn home-fade-up home-d3 w-full group flex items-center gap-4 p-3 sm:p-3.5 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-[0.99] text-left relative overflow-hidden"
                                        style="background: linear-gradient(135deg, ${themeColor} 0%, ${secondaryColor} 100%);">
                                    <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                         style="background: linear-gradient(135deg, ${secondaryColor} 0%, ${themeColor} 100%);"></div>
                                    <div class="relative w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                         style="background: rgba(255,255,255,0.2);">
                                        <i data-lucide="clipboard-check" class="w-5 h-5 sm:w-6 sm:h-6 text-white"></i>
                                    </div>
                                    <div class="relative flex-1 min-w-0">
                                        <p class="font-bold text-white text-sm sm:text-base leading-tight">Start your exam</p>
                                        <p class="text-xs sm:text-sm text-white/85 mt-0.5">For registered students</p>
                                    </div>
                                    <i data-lucide="arrow-right" class="relative w-5 h-5 text-white/80 group-hover:text-white group-hover:translate-x-1 transition-transform flex-shrink-0"></i>
                                </button>

                                <!-- Teacher -->
                                <button onclick="setPage('teacher-login')"
                                        class="home-role-btn home-fade-up home-d4 w-full group flex items-center gap-4 p-3 sm:p-3.5 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-[0.99] border border-gray-200 text-left"
                                        onmouseover="this.style.borderColor='${themeColor}66'" onmouseout="this.style.borderColor=''">
                                    <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                         style="background: ${themeColor}14;">
                                        <i data-lucide="school" class="w-5 h-5 sm:w-6 sm:h-6" style="color: ${themeColor};"></i>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <p class="font-bold text-gray-900 text-sm sm:text-base leading-tight">Teacher</p>
                                        <p class="text-xs sm:text-sm text-gray-500 mt-0.5">Manage exams & results</p>
                                    </div>
                                    <i data-lucide="arrow-right" class="w-5 h-5 text-gray-400 group-hover:text-gray-800 group-hover:translate-x-1 transition-transform flex-shrink-0"></i>
                                </button>

                                <!-- Exam Office -->
                                <button onclick="setPage('exam-office-login')"
                                        class="home-role-btn home-fade-up home-d5 w-full group flex items-center gap-4 p-3 sm:p-3.5 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-[0.99] border border-gray-200 text-left"
                                        onmouseover="this.style.borderColor='#7e22ce66'" onmouseout="this.style.borderColor=''">
                                    <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                         style="background: #7e22ce14;">
                                        <i data-lucide="building" class="w-5 h-5 sm:w-6 sm:h-6" style="color: #7e22ce;"></i>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <p class="font-bold text-gray-900 text-sm sm:text-base leading-tight">Exam Office</p>
                                        <p class="text-xs sm:text-sm text-gray-500 mt-0.5">Schedule & publish exams</p>
                                    </div>
                                    <i data-lucide="arrow-right" class="w-5 h-5 text-gray-400 group-hover:text-gray-800 group-hover:translate-x-1 transition-transform flex-shrink-0"></i>
                                </button>
                            </div>

                            <!-- Feature badges -->
                            <div class="flex flex-wrap justify-center gap-2 mb-4">
                                <div class="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                                    <i data-lucide="wifi-off" class="w-3.5 h-3.5" style="color: ${themeColor};"></i>
                                    <span class="text-xs font-semibold text-gray-600">Offline</span>
                                </div>
                                <div class="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                                    <i data-lucide="shield-check" class="w-3.5 h-3.5" style="color: ${themeColor};"></i>
                                    <span class="text-xs font-semibold text-gray-600">Secure</span>
                                </div>
                                <div class="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                                    <i data-lucide="clock" class="w-3.5 h-3.5" style="color: ${themeColor};"></i>
                                    <span class="text-xs font-semibold text-gray-600">Timed</span>
                                </div>
                            </div>

                            <!-- Close Button (subtle) -->
                            <button id="closeBtn"
                                    class="group w-full text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 hover:bg-white/70 px-4 py-2.5 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2">
                                <i data-lucide="power" class="w-4 h-4"></i>
                                <span class="text-sm">Close Application</span>
                            </button>

                            <!-- Footer -->
                            <div class="mt-3 text-center">
                                <p class="text-xs text-gray-500">© ${year} ${shortName} • Version 1.0</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Darkens (negative percent) or lightens (positive percent) a hex color.
// Used to derive a hover shade of SCHOOL_CONFIG.themeColor without needing
// a separate config field for it.
function shadeHexColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    let r = (num >> 16) + amt;
    let g = (num >> 8 & 0x00FF) + amt;
    let b = (num & 0x0000FF) + amt;
    r = Math.max(Math.min(255, r), 0);
    g = Math.max(Math.min(255, g), 0);
    b = Math.max(Math.min(255, b), 0);
    return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

// Export to global scope
window.renderHomePage = renderHomePage;
window.shadeHexColor = shadeHexColor;