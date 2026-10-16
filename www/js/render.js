// render.js

// Utility functions that render.js needs
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function isMobile() {
    return window.innerWidth <= 768;
}

// Validate that an image source is actually usable (not the literal string "null"/"undefined" or empty)
function isValidImageSrc(src) {
    if (!src || typeof src !== 'string') return false;
    const s = src.trim();
    if (!s) return false;
    if (s === 'null' || s === 'undefined') return false;
    // Accept data URLs, absolute http(s) URLs or root-relative paths
    return s.startsWith('data:image/') || /^https?:\/\//i.test(s) || s.startsWith('/');
}
// These rendering functions are ed and take the current 'state' and 'action' functions as arguments
// to remain dependency-free and testable.

function renderHomePage() {
    const schoolName     = window.SCHOOL_CONFIG?.schoolName      || 'School';
    const shortName      = window.SCHOOL_CONFIG?.schoolShortName || 'SCH';
    const logoPath       = window.SCHOOL_CONFIG?.logoPath        || 'js/icons/128x128.png';
    const themeColor     = window.SCHOOL_CONFIG?.themeColor      || '#B80236';
    const secondaryColor = window.SCHOOL_CONFIG?.secondaryColor  || '#8a0228';
    const tagline        = window.SCHOOL_CONFIG?.tagline         || 'Education for Positive Change';
    const subtitle       = window.SCHOOL_CONFIG?.subtitle        || 'Offline Examination Platform';

    return `
        <div class="h-screen flex items-center justify-center p-2 sm:p-4 overflow-hidden"
             style="background: linear-gradient(135deg, ${themeColor} 0%, ${secondaryColor} 100%);">
            <!-- Decorative background elements -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div class="absolute top-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
                <div class="absolute bottom-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
            </div>

            <div class="relative z-10 bg-white/98 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl h-[96vh] sm:h-[92vh] overflow-hidden flex flex-col">
                <div class="flex flex-col md:flex-row flex-1 overflow-hidden">

                    <!-- ============================== -->
                    <!-- LEFT PANEL (hidden on mobile)   -->
                    <!-- ============================== -->
                    <div class="hidden md:flex md:w-1/2 p-8 lg:p-12 flex-col justify-center items-center text-white relative overflow-hidden"
                         style="background: linear-gradient(135deg, ${themeColor} 0%, ${secondaryColor} 100%);">
                        <!-- Subtle pattern overlay -->
                        <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 24px 24px;"></div>

                        <div class="relative z-10 w-full flex flex-col items-center justify-center space-y-6">
                            <!-- School Logo (large) -->
                            <div class="w-40 h-40 lg:w-48 lg:h-48 bg-white/15 backdrop-blur-sm rounded-3xl shadow-2xl border-4 border-white/30 flex items-center justify-center overflow-hidden transform hover:scale-105 transition-all duration-300">
                                <img src="${logoPath}"
                                     alt="${shortName} Logo"
                                     class="w-full h-full object-contain p-3"
                                     onerror="this.style.display='none'; this.parentElement.innerHTML='<i data-lucide=&quot;graduation-cap&quot; class=&quot;w-20 h-20 lg:w-24 lg:h-24 text-white&quot;></i>'; if(window.lucide) lucide.createIcons();" />
                            </div>

                            <!-- School Name -->
                            <div class="text-center space-y-3 max-w-md">
                                <h2 class="text-3xl lg:text-4xl font-bold leading-tight">${schoolName}</h2>
                                <p class="text-white/90 text-lg lg:text-xl">${subtitle}</p>
                            </div>

                            <!-- Tagline -->
                            <div class="pt-6 border-t border-white/20 w-full text-center">
                                <p class="text-lg lg:text-xl font-bold italic">
                                    "${tagline}"
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- ============================== -->
                    <!-- RIGHT PANEL (always visible)    -->
                    <!-- ============================== -->
                    <div class="w-full md:w-1/2 p-4 sm:p-6 lg:p-8 flex flex-col justify-center items-center h-full bg-gradient-to-br from-gray-50 to-white overflow-y-auto">
                        <div class="w-full max-w-md flex flex-col justify-center" style="min-height: 0;">

                            <!-- Logo and School Name -->
                            <div class="text-center mb-6 sm:mb-8 flex-shrink-0">
                                <!-- Logo (visible on both, but bigger on mobile) -->
                                <div class="flex justify-center items-center mb-4">
                                    <div class="relative">
                                        <div class="absolute inset-0 rounded-2xl blur-xl opacity-30" style="background: ${themeColor};"></div>
                                        <img src="${logoPath}"
                                             alt="${shortName} Logo"
                                             class="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-xl border-4 border-white object-contain bg-white p-1.5"
                                             onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=&quot;relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center shadow-xl&quot; style=&quot;background: linear-gradient(135deg, ${themeColor} 0%, ${secondaryColor} 100%);&quot;><i data-lucide=&quot;graduation-cap&quot; class=&quot;w-10 h-10 sm:w-12 sm:h-12 text-white&quot;></i></div>'; if(window.lucide) lucide.createIcons();" />
                                    </div>
                                </div>

                                <!-- School Name -->
                                <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 leading-tight mb-2">
                                    ${schoolName}
                                </h1>
                                <div class="inline-block px-3 py-1.5 rounded-full mt-2" style="background: ${themeColor}1A;">
                                    <p class="text-xs sm:text-sm font-semibold" style="color: ${themeColor};">${subtitle}</p>
                                </div>

                                <!-- Mobile tagline -->
                                <p class="md:hidden text-sm sm:text-base font-semibold italic mt-4" style="color: ${themeColor};">"${tagline}"</p>
                            </div>

                            <!-- Action Buttons -->
                            <div class="w-full grid grid-cols-2 gap-2 sm:gap-3 flex-shrink-0 mb-4">
                                <!-- Student Button -->
                                <button onclick="setPage('student-info')"
                                        class="group text-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-2 border-2 relative overflow-hidden"
                                        style="background: linear-gradient(90deg, ${themeColor} 0%, ${secondaryColor} 100%); border-color: ${themeColor};">
                                    <div class="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
                                    <i data-lucide="user-check" class="relative w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform"></i>
                                    <div class="relative text-center">
                                        <span class="block text-sm sm:text-base font-bold">Start Exam</span>
                                        <span class="block text-xs text-white/80">Students</span>
                                    </div>
                                </button>

                                <!-- Teacher Button -->
                                <button onclick="setPage('teacher-login')"
                                        class="group text-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-2 border-2 relative overflow-hidden"
                                        style="background: linear-gradient(90deg, ${themeColor} 0%, ${secondaryColor} 100%); border-color: ${themeColor};">
                                    <div class="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
                                    <i data-lucide="school" class="relative w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform"></i>
                                    <div class="relative text-center">
                                        <span class="block text-sm sm:text-base font-bold">Teacher</span>
                                        <span class="block text-xs text-white/80">Portal</span>
                                    </div>
                                </button>
                            </div>

                            <!-- Exam Office Button -->
                            <button onclick="setPage('exam-office-login')"
                                    class="w-full group text-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 border-2 relative overflow-hidden"
                                    style="background: linear-gradient(90deg, #7e22ce 0%, #581c87 100%); border-color: #7e22ce;">
                                <div class="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
                                <i data-lucide="building" class="relative w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform"></i>
                                <span class="relative text-sm sm:text-base font-bold">Exam Office</span>
                            </button>

                            <!-- Feature badges -->
                            <div class="flex flex-wrap justify-center gap-2 flex-shrink-0 mt-4">
                                <div class="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                                    <i data-lucide="wifi-off" class="w-4 h-4" style="color: ${themeColor};"></i>
                                    <span class="text-xs font-semibold text-gray-700">Offline</span>
                                </div>
                                <div class="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                                    <i data-lucide="shield-check" class="w-4 h-4" style="color: ${themeColor};"></i>
                                    <span class="text-xs font-semibold text-gray-700">Secure</span>
                                </div>
                                <div class="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                                    <i data-lucide="clock" class="w-4 h-4" style="color: ${themeColor};"></i>
                                    <span class="text-xs font-semibold text-gray-700">Timed</span>
                                </div>
                            </div>

                            <!-- Close Button -->
                            <button id="closeBtn"
                                    class="group w-full mt-4 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-md border-2 relative overflow-hidden"
                                    style="background: linear-gradient(90deg, ${themeColor} 0%, ${secondaryColor} 100%); border-color: ${themeColor};">
                                <div class="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
                                <i data-lucide="power" class="relative w-5 h-5"></i>
                                <span class="relative">Close Application</span>
                            </button>

                            <!-- Footer info -->
                            <div class="mt-4 pt-4 text-center flex-shrink-0">
                                <p class="text-xs text-gray-500">© 2025 ${shortName} • Version 1.0</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}


 function renderTeacherRegistrationPage() {
    return `
        <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-xl p-6 md:p-8 w-full max-w-md animate-fadeIn">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 rounded-full bg-green-600 mx-auto mb-4 flex items-center justify-center">
                        <i data-lucide="user-plus" class="w-8 h-8 text-white"></i>
                    </div>
                    <h1 class="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Teacher Registration</h1>
                    <p class="text-gray-600 text-sm md:text-base">Create your teacher account.</p>
                </div>
                <form id="teacher-registration-form" onsubmit="handleTeacherRegistration(event)" class="space-y-4">
                    <div>
                        <label for="register-name" class="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                        <input type="text" id="register-name" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm md:text-base" required />
                    </div>
                    <div>
                        <label for="register-phone" class="block text-sm font-semibold text-gray-700 mb-2">Phone Number (as ID)</label>
                        <input type="tel" id="register-phone" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm md:text-base" placeholder="e.g., 08012345678" required />
                    </div>
                    <div>
                        <label for="register-password" class="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                        <input type="password" id="register-password" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm md:text-base" required />
                    </div>

                    <button type="submit" 
                        class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base font-semibold">
                        Register
                    </button>
                    <button type="button" onclick="setPage('teacher-login')" class="w-full text-gray-500 text-sm py-2 hover:underline">
                        Already Registered? Login
                    </button>
                </form>
            </div>
        </div>
    `;
}


 function renderTeacherLoginPage() {
    return `
        <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-xl p-6 md:p-8 w-full max-w-md animate-fadeIn">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 rounded-full bg-blue-600 mx-auto mb-4 flex items-center justify-center">
                        <i data-lucide="graduation-cap" class="w-8 h-8 text-white"></i>
                    </div>
                    <h1 class="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Teacher Login</h1>
                    <p class="text-gray-600 text-sm md:text-base">Enter your phone number and password.</p>
                </div>
                <form id="teacher-login-form" onsubmit="handleTeacherLogin(event)" class="space-y-4">
                    <div>
                        <label for="teacher-phone" class="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                        <input type="tel" id="teacher-phone" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm md:text-base" placeholder="e.g., 08012345678" required />
                    </div>
                    <div>
                        <label for="teacher-password" class="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                        <input type="password" id="teacher-password" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm md:text-base" required />
                    </div>
                    <button type="submit" 
                        class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base font-semibold">
Login
                     </button>
                     <button type="button" onclick="setPage('teacher-register')" class="w-full text-blue-600 text-sm py-2 hover:underline">
                         Need an account? Register here.
                     </button>
                     <button type="button" onclick="setPage('home')" class="w-full text-gray-500 text-sm py-2 hover:underline">
                         Back to Home
                     </button>
                 </form>
             </div>
         </div>
     `;
 }
 
 function renderExamOfficeRegisterPage() {
     return `
         <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
             <div class="bg-white rounded-xl shadow-xl p-6 md:p-8 w-full max-w-md animate-fadeIn">
                 <div class="text-center mb-6">
                     <div class="w-16 h-16 rounded-full bg-purple-600 mx-auto mb-4 flex items-center justify-center">
                         <i data-lucide="building" class="w-8 h-8 text-white"></i>
                     </div>
                     <h1 class="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Exam Office Registration</h1>
                     <p class="text-gray-600 text-sm md:text-base">Create your school account.</p>
                 </div>
                 <form id="exam-office-registration-form" onsubmit="handleExamOfficeRegistration(event)" class="space-y-4">
                     <div>
                         <label for="exam-office-school-name" class="block text-sm font-semibold text-gray-700 mb-2">School Name</label>
                         <input type="text" id="exam-office-school-name" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm md:text-base" placeholder="e.g., GSSS International" required />
                     </div>
                     <div>
                         <label for="exam-office-admin-name" class="block text-sm font-semibold text-gray-700 mb-2">Admin Full Name</label>
                         <input type="text" id="exam-office-admin-name" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm md:text-base" required />
                     </div>
                     <div>
                         <label for="exam-office-phone" class="block text-sm font-semibold text-gray-700 mb-2">Phone Number (as ID)</label>
                         <input type="tel" id="exam-office-phone" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm md:text-base" placeholder="e.g., 08012345678" required />
                     </div>
                     <div>
                         <label for="exam-office-email" class="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                         <input type="email" id="exam-office-email" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm md:text-base" placeholder="e.g., admin@yourschool.edu" required />
                     </div>
                     <div>
                         <label for="exam-office-password" class="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                         <input type="password" id="exam-office-password" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm md:text-base" required />
                     </div>
 
                     <button type="submit" 
                         class="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors text-sm md:text-base font-semibold">
                         Register School
                     </button>
                     <button type="button" onclick="setPage('exam-office-login')" class="w-full text-gray-500 text-sm py-2 hover:underline">
                         Already Registered? Login
                     </button>
                 </form>
             </div>
         </div>
     `;
 }
 
  function renderExamOfficeLoginPage() {
     return `
         <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
             <div class="bg-white rounded-xl shadow-xl p-6 md:p-8 w-full max-w-md animate-fadeIn">
                 <div class="text-center mb-6">
                     <div class="w-16 h-16 rounded-full bg-indigo-600 mx-auto mb-4 flex items-center justify-center">
                         <i data-lucide="building" class="w-8 h-8 text-white"></i>
                     </div>
                     <h1 class="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Exam Office Login</h1>
                     <p class="text-gray-600 text-sm md:text-base">Enter your credentials to access your school account.</p>
                 </div>
                 <form id="exam-office-login-form" onsubmit="handleExamOfficeLogin(event)" class="space-y-4">
                     <div>
                         <label for="exam-office-login-phone" class="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                         <input type="tel" id="exam-office-login-phone" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm md:text-base" placeholder="e.g., 08012345678" required />
                     </div>
                     <div>
                         <label for="exam-office-login-password" class="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                         <input type="password" id="exam-office-login-password" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm md:text-base" required />
                     </div>
                     <button type="submit" 
                         class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors text-sm md:text-base font-semibold">
                         Login
                     </button>
                     <button type="button" onclick="setPage('exam-office-register')" class="w-full text-indigo-600 text-sm py-2 hover:underline">
                         Need an account? Register here.
                     </button>
                     <button type="button" onclick="setPage('home')" class="w-full text-gray-500 text-sm py-2 hover:underline">
                         Back to Home
                     </button>
                 </form>
             </div>
</div>
      `;
 }
 
// Exam Office Dashboard
 function renderExamOfficeDashboard(state) {
     const userName = state.user ? state.user.school_name || state.user.name : 'School';
     
     // Group exams by class
     const examsByClass = {};
     state.availableExams.forEach(exam => {
         const cls = exam.class || 'Unknown';
         if (!examsByClass[cls]) examsByClass[cls] = [];
         examsByClass[cls].push(exam);
     });
     
     const scheduledExams = state.availableExams.filter(exam => exam.scheduledDate);
     const totalResults = state.allResults.length;
     const totalExams = state.availableExams.length;
     
     // Class cards HTML
     const classCardsHtml = Object.keys(examsByClass).length > 0 
         ? Object.entries(examsByClass).map(([cls, exams]) => {
             const scheduledCount = exams.filter(e => e.scheduledDate).length;
             return `
                 <div class="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all cursor-pointer border-t-4 border-purple-600" onclick="showClassExams('${cls.replace(/'/g, "\\'")}')">
                     <div class="p-6">
                         <div class="flex items-center justify-between mb-4">
                             <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
                                 <i data-lucide="school" class="w-6 h-6 text-white"></i>
                             </div>
                             <span class="text-2xl font-bold text-gray-800">${exams.length}</span>
                         </div>
                         <h3 class="font-bold text-lg text-gray-800">${cls}</h3>
                         <p class="text-sm text-gray-600">${scheduledCount} scheduled</p>
                     </div>
                 </div>
             `;
         }).join('')
         : '<div class="col-span-3 text-center py-12"><i data-lucide="inbox" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i><p class="text-gray-500 text-lg">No exams available. Create one to get started!</p></div>';
 
     return `
         <style>
             ::-webkit-scrollbar { width: 8px; }
             ::-webkit-scrollbar-track { background: #f1f1f1; }
             ::-webkit-scrollbar-thumb { background: #7e22ce; border-radius: 4px; }
             .sidebar-transition { transition: transform 0.3s ease-in-out; }
             @media (max-width: 768px) { .sidebar-hidden { transform: translateX(-100%); } }
             .menu-item-active { background: linear-gradient(to right, rgba(255,255,255,0.2), rgba(255,255,255,0.1)); border-left: 4px solid #fff; }
         </style>
 
         <div class="flex h-screen overflow-hidden bg-gray-50">
             <aside id="examOfficeSidebar" class="sidebar-transition bg-gradient-to-b from-purple-700 to-purple-900 text-white w-64 flex-shrink-0 fixed md:relative h-full z-50 overflow-y-auto">
                 <div class="flex flex-col h-full">
                     <div class="p-6 border-b border-white/20">
                         <div class="flex items-center gap-3">
                             <div class="bg-white/20 p-2 rounded-lg">
                                 <i data-lucide="building" class="w-8 h-8"></i>
                             </div>
                             <div>
                                 <h1 class="text-xl font-bold">${userName}</h1>
                                 <p class="text-xs text-purple-200">Exam Office Portal</p>
                             </div>
                         </div>
                     </div>
                     <nav class="flex-1 py-4">
                         <ul class="space-y-1 px-3">
                             <li><a href="#" onclick="setPage('exam-office-dashboard')" class="exam-office-menu-item menu-item-active flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-page="exam-office-dashboard"><i data-lucide="layout-dashboard" class="w-5 h-5"></i><span class="font-medium">Dashboard</span></a></li>
<li><a href="#" onclick="setPage('exam-office-results')" class="exam-office-menu-item flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-page="exam-office-results"><i data-lucide="bar-chart-2" class="w-5 h-5"></i><span class="font-medium">View Results</span></a></li>
                              <li><a href="#" onclick="setPage('exam-office-upload')" class="exam-office-menu-item flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-page="exam-office-upload"><i data-lucide="upload" class="w-5 h-5"></i><span class="font-medium">Upload Exams</span></a></li>
                              <li><button onclick="logout()" class="w-full exam-office-menu-item flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-left"><i data-lucide="log-out" class="w-5 h-5"></i><span class="font-medium">Logout</span></button></li>
                         </ul>
                     </nav>
                 </div>
             </aside>
 
             <div id="sidebarOverlay" class="hidden md:hidden fixed inset-0 bg-black/50 z-40" onclick="toggleExamOfficeSidebar()"></div>
 
             <div class="flex-1 flex flex-col overflow-hidden">
                 <header class="bg-white shadow-sm border-b border-gray-200">
                     <div class="flex items-center justify-between px-6 py-4">
                         <div class="flex items-center gap-4">
                             <button onclick="toggleExamOfficeSidebar()" class="md:hidden text-gray-600"><i data-lucide="menu" class="w-6 h-6"></i></button>
                             <div><h2 class="text-2xl font-bold text-gray-800">Exam Administration</h2><p class="text-sm text-gray-500">Click a class to schedule exams</p></div>
                         </div>
                     </div>
                 </header>
 
                 <main class="flex-1 overflow-y-auto p-6">
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                              <div class="flex items-center justify-between mb-4"><div class="bg-white/20 p-3 rounded-lg"><i data-lucide="file-text" class="w-8 h-8"></i></div><span class="text-3xl font-bold">${totalExams}</span></div>
                              <p class="text-blue-100 text-sm font-medium">Total Exams</p>
                          </div>
                          <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                              <div class="flex items-center justify-between mb-4"><div class="bg-white/20 p-3 rounded-lg"><i data-lucide="calendar" class="w-8 h-8"></i></div><span class="text-3xl font-bold">${scheduledExams.length}</span></div>
                              <p class="text-green-100 text-sm font-medium">Scheduled Exams</p>
                          </div>
                          <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                              <div class="flex items-center justify-between mb-4"><div class="bg-white/20 p-3 rounded-lg"><i data-lucide="bar-chart-2" class="w-8 h-8"></i></div><span class="text-3xl font-bold">${totalResults}</span></div>
                              <p class="text-purple-100 text-sm font-medium">Total Results</p>
                          </div>
                      </div>

                      <!-- Upload Exams Card -->
                      <div class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg p-6 border-2 border-amber-200 mb-6">
                          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                              <div class="flex items-center gap-4">
                                  <div class="bg-amber-500 p-3 rounded-lg">
                                      <i data-lucide="upload-cloud" class="w-8 h-8 text-white"></i>
                                  </div>
                                  <div>
                                      <h3 class="text-xl font-bold text-gray-800">Upload Exam(s)</h3>
                                      <p class="text-sm text-gray-600">Import exams from CSV files to your platform</p>
                                  </div>
                              </div>
                              <button onclick="setPage('exam-office-upload')" class="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-semibold shadow-md hover:shadow-lg">
                                  <i data-lucide="upload" class="w-5 h-5"></i>
                                  <span>Upload Now</span>
                              </button>
                          </div>
                      </div>
 
                     <div class="bg-white rounded-xl shadow-lg p-6">
                         <div class="flex justify-between items-center mb-6">
                             <h2 class="text-2xl font-bold text-gray-800">Classes</h2>
                             <span class="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold">${Object.keys(examsByClass).length} Classes</span>
                         </div>
                         <p class="text-sm text-gray-600 mb-4">Click on a class card to view and schedule exams for that class.</p>
                         <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${classCardsHtml}</div>
                     </div>
                 </main>
             </div>
         </div>
 
         <!-- Modal for class exams -->
         <div id="examOfficeModal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
             <div class="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
                 <div class="flex justify-between items-center p-6 border-b">
                     <h3 id="modalTitle" class="text-xl font-bold text-gray-800"></h3>
                     <button onclick="closeExamOfficeModal()" class="text-gray-400 hover:text-gray-600"><i data-lucide="x" class="w-6 h-6"></i></button>
                 </div>
                 <div id="modalContent" class="flex-1 overflow-y-auto p-6"></div>
             </div>
         </div>
 
         <script>
             function toggleExamOfficeSidebar() {
                 document.getElementById('examOfficeSidebar').classList.toggle('sidebar-hidden');
                 document.getElementById('sidebarOverlay').classList.toggle('hidden');
             }
             setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 100);
         </script>
     `;
 }
 
 // Enhanced Teacher Dashboard with Sidebar Navigation
function renderTeacherDashboard(state) {
    const userName = state.user ? state.user.name : 'User';
    const userPhone = state.user ? (state.user.phone_number || 'N/A') : 'N/A';
    const userRole = 'Teacher';
    const userInitial = userName.charAt(0).toUpperCase();
    
    // Calculate statistics
    //const studentsTested = state.lastResult.length;
    const totalExams = state.availableExams.length
    const totalQuestions = state.availableExams.reduce((sum, exam) => sum + exam.questions.length, 0);
    const avgDuration = totalExams > 0 ? Math.round(state.availableExams.reduce((sum, exam) => sum + exam.duration, 0) / totalExams) : 0;

    const examListHtml = state.availableExams.length > 0 ? state.availableExams.map(exam => `
        <div class="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-t-4 border-[#B80236] group">
            <!-- Card Header -->
            <div class="bg-gradient-to-r from-[#B80236] to-[#900028] p-4">
                <h3 class="font-bold text-white text-lg truncate" title="${exam.subject}">${exam.subject}</h3>
                <p class="text-pink-100 text-sm truncate" title="${exam.exam_id}">${exam.exam_id}</p>
            </div>
            
            <!-- Card Body -->
            <div class="p-4">
                <div class="space-y-3 mb-4">
                    <div class="flex items-center gap-2 text-gray-600">
                        <i data-lucide="users" class="w-4 h-4 flex-shrink-0"></i>
                        <span class="text-sm font-medium">${exam.class}</span>
                    </div>
                    <div class="flex items-center gap-2 text-gray-600">
                        <i data-lucide="list" class="w-4 h-4 flex-shrink-0"></i>
                        <span class="text-sm">${exam.questions.length} Questions</span>
                    </div>
                    <div class="flex items-center gap-2 text-gray-600">
                        <i data-lucide="clock" class="w-4 h-4 flex-shrink-0"></i>
                        <span class="text-sm">${exam.duration} minutes</span>
                    </div>
                    ${exam.created_by ? `
                        <div class="flex items-center gap-2 text-gray-500">
                            <i data-lucide="user" class="w-4 h-4 flex-shrink-0"></i>
                            <span class="text-xs truncate" title="${exam.created_by}">${exam.created_by}</span>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Action Buttons -->
                <div class="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
                    <button onclick="editExam('${exam.exam_id}')" 
                            class="flex flex-col items-center gap-1 p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors group-hover:scale-105 transform duration-200" 
                            title="Edit Exam">
                        <i data-lucide="pencil" class="w-5 h-5"></i>
                        <span class="text-xs font-medium">Edit</span>
                    </button>
                    <button onclick="shareExamWithOptions('${exam.exam_id}')" 
                            class="flex flex-col items-center gap-1 p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors group-hover:scale-105 transform duration-200" 
                            title="Share Exam">
                        <i data-lucide="share-2" class="w-5 h-5"></i>
                        <span class="text-xs font-medium">Share</span>
                    </button>
                    <button onclick="deleteExam('${exam.exam_id}')" 
                            class="flex flex-col items-center gap-1 p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors group-hover:scale-105 transform duration-200" 
                            title="Delete Exam">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                        <span class="text-xs font-medium">Delete</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('') : '<div class="col-span-3 text-center py-12"><i data-lucide="inbox" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i><p class="text-gray-500 text-lg">No exams available. Create one to get started!</p></div>';

    return `
        <style>
            /* Custom Scrollbar */
            ::-webkit-scrollbar {
                width: 8px;
            }
            ::-webkit-scrollbar-track {
                background: #f1f1f1;
            }
            ::-webkit-scrollbar-thumb {
                background: #B80236;
                border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
                background: #900028;
            }

            /* Sidebar Animation */
            .sidebar-transition {
                transition: transform 0.3s ease-in-out;
            }

            @media (max-width: 768px) {
                .sidebar-hidden {
                    transform: translateX(-100%);
                }
            }

            /* Active Menu Item */
            .menu-item-active {
                background: linear-gradient(to right, rgba(255,255,255,0.2), rgba(255,255,255,0.1));
                border-left: 4px solid #fff;
            }

            /* Card Hover Effects */
            .card-hover:hover {
                transform: translateY(-4px);
            }
        </style>

        <!-- Main Container -->
        <div class="flex h-screen overflow-hidden bg-gray-50">
            <!-- Sidebar -->
            <aside id="teacherSidebar" class="sidebar-transition bg-gradient-to-b from-[#B80236] to-[#900028] text-white w-64 flex-shrink-0 shadow-2xl fixed md:relative h-full z-50 overflow-y-auto">
                <div class="flex flex-col h-full">
                    <!-- Logo/Brand -->
                    <div class="p-6 border-b border-white/20">
                        <div class="flex items-center gap-3">
                            <div class="bg-white/20 p-2 rounded-lg">
                                <i data-lucide="graduation-cap" class="w-8 h-8"></i>
                            </div>
                            <div>
                                <h1 class="text-xl font-bold">GSSS T/M CBT</h1>
                                <p class="text-xs text-pink-200">Teacher Portal</p>
                            </div>
                        </div>
                    </div>

                    <!-- User Profile -->
                    <div class="p-6 border-b border-white/20 bg-white/10">
                        <div class="flex items-center gap-3">
                            <div class="bg-white text-[#B80236] w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">
                                <span>${userInitial}</span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="font-semibold truncate">${userName}</p>
                                <p class="text-xs text-pink-200 truncate">${userPhone}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Navigation Menu -->
                    <nav class="flex-1 py-4 overflow-y-auto">
                        <ul class="space-y-1 px-3">
                            <li>
                                <a href="#" onclick="setPage('dashboard')" class="dashboard-menu-item menu-item-active flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-page="dashboard">
                                    <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
                                    <span class="font-medium">Dashboard</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" onclick="setPage('create-exam')" class="dashboard-menu-item flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-page="create-exam">
                                    <i data-lucide="plus-circle" class="w-5 h-5"></i>
                                    <span class="font-medium">Create Exam</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" onclick="handleSmartImport()" class="dashboard-menu-item flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
                                    <i data-lucide="upload" class="w-5 h-5"></i>
                                    <span class="font-medium">Import Exam</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" onclick="setPage('view-results')" class="dashboard-menu-item flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-page="view-results">
                                    <i data-lucide="bar-chart-2" class="w-5 h-5"></i>
                                    <span class="font-medium">View Results</span>
                                </a>
                            </li>
                            <div class="border-t border-white/20">
                            <li>
                                <button onclick="logout()" class="w-full dashboard-menu-item flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-left">
                                    <i data-lucide="log-out" class="w-5 h-5"></i>
                                    <span class="font-medium">Logout</span>
                                </button>
                            </li>
                            </div>
                        </ul>
                    </nav>
                </div>
            </aside>

            <!-- Mobile Sidebar Overlay -->
            <div id="sidebarOverlay" class="hidden md:hidden fixed inset-0 bg-black/50 z-40" onclick="toggleTeacherSidebar()"></div>

            <!-- Main Content Area -->
            <div class="flex-1 flex flex-col overflow-hidden">
                <!-- Top Header -->
                <header class="bg-white shadow-sm border-b border-gray-200">
                    <div class="flex items-center justify-between px-6 py-4">
                        <div class="flex items-center gap-4">
                            <!-- Mobile Menu Toggle -->
                            <button onclick="toggleTeacherSidebar()" class="md:hidden text-gray-600 hover:text-gray-900">
                                <i data-lucide="menu" class="w-6 h-6"></i>
                            </button>
                            <div>
                                <h2 class="text-2xl font-bold text-gray-800">Dashboard</h2>
                                <p class="text-sm text-gray-500">Overview of your exams and activities</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <!-- Notifications -->
                            <button class="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <i data-lucide="bell" class="w-6 h-6"></i>
                                <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                            <!-- Help -->
                            <button class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <i data-lucide="help-circle" class="w-6 h-6"></i>
                            </button>
                        </div>
                    </div>
                </header>

                <!-- Main Content -->
                <main class="flex-1 overflow-y-auto p-6">
                    <!-- Stats Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <!-- Total Exams -->
                        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white card-hover transition-all">
                            <div class="flex items-center justify-between mb-4">
                                <div class="bg-white/20 p-3 rounded-lg">
                                    <i data-lucide="file-text" class="w-8 h-8"></i>
                                </div>
                                <span class="text-3xl font-bold">${totalExams}</span>
                            </div>
                            <p class="text-blue-100 text-sm font-medium">Total Exams</p>
                        </div>

                        <!-- Total Questions -->
                        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white card-hover transition-all">
                            <div class="flex items-center justify-between mb-4">
                                <div class="bg-white/20 p-3 rounded-lg">
                                    <i data-lucide="help-circle" class="w-8 h-8"></i>
                                </div>
                                <span class="text-3xl font-bold">${totalQuestions}</span>
                            </div>
                            <p class="text-green-100 text-sm font-medium">Total Questions</p>
                        </div>

                       
                    </div>

                   

                    <!-- Bulk Export Section -->
                    ${state.availableExams.length > 0 ? `
                        <div class="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 mb-6 border border-purple-200">
                            <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div class="flex items-center gap-3">
                                    <div class="bg-purple-600 p-2 rounded-lg">
                                        <i data-lucide="package" class="w-6 h-6 text-white"></i>
                                    </div>
                                    <div>
                                        <p class="font-semibold text-gray-800">Bulk Export</p>
                                        <p class="text-sm text-gray-600">Export all ${state.availableExams.length} exam(s) at once</p>
                                    </div>
                                </div>
                                <button onclick="exportAllExams()" 
                                        class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-semibold shadow-md hover:shadow-lg">
                                    <i data-lucide="download" class="w-5 h-5"></i>
                                    <span>Export All Exams</span>
                                </button>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Exams List -->
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-2xl font-bold text-gray-800">My Exams</h2>
                            <span class="px-4 py-2 bg-[#B80236] text-white rounded-lg font-semibold">
                                ${state.availableExams.length} Total
                            </span>
                        </div>
                        
                        <!-- Grid Layout -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            ${examListHtml}
                        </div>
                    </div>
                </main>
            </div>
        </div>

        <script>
            // Toggle Sidebar for Mobile
            function toggleTeacherSidebar() {
                const sidebar = document.getElementById('teacherSidebar');
                const overlay = document.getElementById('sidebarOverlay');
                
                sidebar.classList.toggle('sidebar-hidden');
                overlay.classList.toggle('hidden');
            }

            // Update active menu item when page changes
            function updateActiveMenuItem(page) {
                document.querySelectorAll('.dashboard-menu-item').forEach(item => {
                    item.classList.remove('menu-item-active');
                    if (item.dataset.page === page) {
                        item.classList.add('menu-item-active');
                    }
                });
            }

            // Reinitialize Lucide icons after render
            setTimeout(() => {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 100);
        </script>
    `;
}

// Helper function to update menu active state (call this when changing pages)
function updateDashboardMenu(currentPage) {
    const menuItems = document.querySelectorAll('.dashboard-menu-item');
    menuItems.forEach(item => {
        item.classList.remove('menu-item-active');
        if (item.dataset.page === currentPage) {
            item.classList.add('menu-item-active');
        }
    });
}






function renderCreateExamPage(state) {
    const savedExam = state.editingExamId ? state.availableExams.find(ex => ex.exam_id === state.editingExamId) : null;
    
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
            duration: 0,
            questions: []
        };
    }
    
    const exam = initialValues;

    // Pagination setup
    const questionsPerPage = 20;
    const currentPage = state.currentQuestionPage || 1;
    const totalQuestions = (exam?.questions || []).length;
    const totalPages = Math.ceil(totalQuestions / questionsPerPage);

    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    const questionsToDisplay = (exam?.questions || []).slice(startIndex, endIndex);

    // Generate questions list with pagination
    const questionsList = totalQuestions === 0 ? 
        '<p class="text-gray-500 text-center py-8">No questions added yet</p>' :
        `
        <!-- Pagination Controls (Top) -->
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600">
                Showing <strong>${startIndex + 1}-${Math.min(endIndex, totalQuestions)}</strong> of <strong>${totalQuestions}</strong> questions
            </div>
            <div class="flex gap-2">
                <button type="button" 
                        onclick="changeQuestionPage(${currentPage - 1})" 
                        ${currentPage === 1 ? 'disabled' : ''}
                        class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors">
                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                    <span class="hidden sm:inline">Previous</span>
                </button>
                
                <div class="flex gap-1">
                    ${totalPages <= 7 ? 
                        // Show all pages if 7 or fewer
                        Array.from({length: totalPages}, (_, i) => i + 1).map(page => `
                            <button type="button"
                                    onclick="changeQuestionPage(${page})"
                                    class="w-10 h-10 rounded-lg font-semibold transition-colors ${
                                        page === currentPage 
                                            ? 'bg-[#B80236] text-white' 
                                            : 'bg-white border border-gray-300 hover:bg-gray-50'
                                    }">
                                ${page}
                            </button>
                        `).join('')
                        :
                        // Show smart pagination for 8+ pages
                        (() => {
                            let pages = [];
                            if (currentPage <= 3) {
                                pages = [1, 2, 3, 4, '...', totalPages];
                            } else if (currentPage >= totalPages - 2) {
                                pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                            } else {
                                pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
                            }
                            return pages.map(page => 
                                page === '...' ? 
                                    `<span class="w-10 h-10 flex items-center justify-center text-gray-400">...</span>` :
                                    `<button type="button"
                                            onclick="changeQuestionPage(${page})"
                                            class="w-10 h-10 rounded-lg font-semibold transition-colors ${
                                                page === currentPage 
                                                    ? 'bg-[#B80236] text-white' 
                                                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                                            }">
                                        ${page}
                                    </button>`
                            ).join('');
                        })()
                    }
                </div>
                
                <button type="button"
                        onclick="changeQuestionPage(${currentPage + 1})"
                        ${currentPage === totalPages ? 'disabled' : ''}
                        class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors">
                    <span class="hidden sm:inline">Next</span>
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                </button>
            </div>
        </div>

        <!-- Questions Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${questionsToDisplay.map((q, idx) => {
                const actualIndex = startIndex + idx;
                return `
                    <div class="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 hover:border-[#B80236] transition-colors">
                        <div class="flex justify-between items-start gap-2">
                            <div class="flex-1 min-w-0">
                                <p class="font-semibold text-gray-800 text-sm mb-2">${actualIndex + 1}. ${q.question}</p>
                                
                                ${isValidImageSrc(q.image) ? `
                                    <div class="my-2">
                                        <img src="${q.image}" 
                                            alt="Question image" 
                                            class="max-w-full max-h-32 rounded border border-gray-300 object-contain" />
                                    </div>
                                ` : ''}
                                
                                <p class="text-xs text-gray-600 mb-1">Type: <span class="font-medium text-[#B80236]">${q.type.replace('_', ' ')}</span></p>
                                ${q.options ? `<div class="text-xs text-gray-700 mt-2"><strong>Options:</strong><br>${q.options.map((opt, i) => String.fromCharCode(65 + i) + '. ' + opt).join('<br>')}</div>` : ''}
                                <p class="text-xs text-green-600 mt-2"><strong>Correct:</strong> ${q.correct_answer || q.marking_scheme || 'N/A'}</p>
                            </div>
                            <div class="flex flex-col gap-1 flex-shrink-0">
                                <button type="button" 
                                        onclick="event.preventDefault(); event.stopPropagation(); editQuestion(${q.id}); return false;" 
                                        class="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 text-xs transition-colors"
                                        title="Edit Question">
                                    <i data-lucide="pencil" class="w-3 h-3"></i>
                                </button>
                                <button type="button" 
                                        onclick="event.preventDefault(); event.stopPropagation(); deleteQuestion(${q.id}); return false;" 
                                        class="bg-red-600 text-white p-2 rounded hover:bg-red-700 text-xs transition-colors"
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
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600">
                Page <strong>${currentPage}</strong> of <strong>${totalPages}</strong>
            </div>
            <div class="flex gap-2">
                <button type="button" 
                        onclick="changeQuestionPage(${currentPage - 1})" 
                        ${currentPage === 1 ? 'disabled' : ''}
                        class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors">
                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                    <span class="hidden sm:inline">Previous</span>
                </button>
                
                <span class="flex items-center px-3 text-sm text-gray-600 sm:hidden">
                    ${currentPage} / ${totalPages}
                </span>
                
                <button type="button"
                        onclick="changeQuestionPage(${currentPage + 1})"
                        ${currentPage === totalPages ? 'disabled' : ''}
                        class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors">
                    <span class="hidden sm:inline">Next</span>
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
        `;

    return `
        <div class="min-h-screen bg-gray-50">
            <!-- Header -->
            <div class="bg-[#B80236] text-white p-4 md:p-6 shadow-lg">
                <div class="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 class="text-2xl md:text-3xl font-bold">${state.editingExamId ? 'Edit Exam' : 'Create New Exam'}</h1>
                    <button onclick="setPage('teacher')" class="bg-[#900028] hover:bg-[#700020] px-4 md:px-6 py-2 rounded-lg transition-colors text-sm md:text-base">
                        ← Back to Dashboard
                    </button>
                </div>
            </div>

            <!-- Main Content -->
            <div class="max-w-4xl mx-auto p-4 md:p-6">
                <div class="bg-white rounded-xl shadow-lg p-6 md:p-8">
                    <form id="create-exam-form" onsubmit="saveExam(event)" class="space-y-6">
                        
                        <!-- Exam Basic Info -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Exam/Test ID</label>
                                <input id="exam-id" 
                                       type="text" 
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B80236] focus:border-transparent transition-all" 
                                       value="${initialValues.exam_id}" 
                                       ${state.editingExamId ? 'readonly' : ''} 
                                       placeholder="e.g., PHY_SS2_CA1_2025" 
                                       required />
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Duration (minutes)</label>
                                <input id="duration" 
                                       type="number" 
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B80236] focus:border-transparent transition-all" 
                                       value="${initialValues.duration}" 
                                       min="1" 
                                       placeholder="e.g., 60" 
                                       required />
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                                <select id="subject" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B80236] focus:border-transparent transition-all" required>
                                    <option value="">-- Select Subject --</option>
                                    ${['Agricultural Science', 'Arabic', 'Beauty & Cosmetology', 'Biology', 'Chemistry', 'Christian Religious Studies', 
                                       'Citizenship & Heritage Studies Education', 'Commerce', 'Digital Technologies', 'Economics', 'English Language', 
                                       'Financial Accounting', 'Fishery', 'Foods and Nutrition', 'French', 'Further Mathematics', 
                                       'Fashion Design & Garment Making', 'General Mathematics', 'Geography', 'Government', 'Hausa', 'History', 
                                       'Health Education/Health Science', 'Home Management', 'Horticulture & Crop Production', 'Igbo', 'Insurance', 
                                       'Islamic Religious Studies', 'Literature in English', 'Leather Works', 'Livestock Farming', 'Marketing', 
                                       'Painting and Decoration', 'Physical Education', 'Physics', 'Store Management', 'Technical Drawing', 
                                       'Visual Arts', 'Yoruba'].map(subject => 
                                        `<option value="${subject}" ${initialValues.subject === subject ? 'selected' : ''}>${subject}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Class</label>
                                <select id="class" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B80236] focus:border-transparent transition-all" required>
                                    <option value="">Select Class</option>
                                    <option value="SS 1" ${initialValues.class === 'SS 1' ? 'selected' : ''}>SS 1</option>
                                    <option value="SS 2" ${initialValues.class === 'SS 2' ? 'selected' : ''}>SS 2</option>
                                    <option value="SS 3" ${initialValues.class === 'SS 3' ? 'selected' : ''}>SS 3</option>
                                </select>
                            </div>
                        </div>

                        <!-- Question Input Section -->
                        <div class="border-t border-gray-200 pt-8">
                            <div class="flex items-center justify-between mb-6">
                                <h3 class="text-2xl font-bold text-gray-800">Add Question</h3>
                                <span class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Questions: ${exam.questions.length}</span>
                            </div>
                            
                            <!-- Symbol Bank - Hidden by default -->
                            <div class="mb-6">
                                <div class="flex items-center justify-between mb-3">
                                    <label class="block text-sm font-semibold text-gray-700"></label>
                                    <button type="button" onclick="toggleSymbolBank()" class="flex items-center gap-2 text-[#B80236] hover:text-[#900028] transition-colors text-sm font-medium">
                                        <i data-lucide="chevron-down" class="w-4 h-4 transition-transform" id="symbol-chevron"></i>
                                        <span id="symbol-bank-toggle-text">∑ Show Symbols</span>
                                    </button>
                                </div>
                                
                                <div id="symbol-bank" class="hidden bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-6 transition-all duration-300 shadow-inner">
                                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <!-- Greek Letters (Lowercase) -->
                                        <div class="space-y-3">
                                            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                                <span class="w-1 h-4 bg-[#B80236] rounded"></span>
                                                Greek Letters (Lower)
                                            </h4>
                                            <div class="flex flex-wrap gap-1.5">
                                                ${['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω'].map(symbol => 
                                                    `<button type="button" onclick="insertSymbol('${symbol}')" class="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-[#B80236] hover:text-white hover:border-[#B80236] hover:scale-110 transition-all text-base font-semibold shadow-sm active:scale-95">${symbol}</button>`
                                                ).join('')}
                                            </div>
                                        </div>

                                        <!-- Greek Letters (Uppercase) -->
                                        <div class="space-y-3">
                                            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                                <span class="w-1 h-4 bg-[#B80236] rounded"></span>
                                                Greek Letters (Upper)
                                            </h4>
                                            <div class="flex flex-wrap gap-1.5">
                                                ${['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', 'Κ', 'Λ', 'Μ', 'Ν', 'Ξ', 'Π', 'Ρ', 'Σ', 'Τ', 'Υ', 'Φ', 'Χ', 'Ψ', 'Ω'].map(symbol => 
                                                    `<button type="button" onclick="insertSymbol('${symbol}')" class="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-[#B80236] hover:text-white hover:border-[#B80236] hover:scale-110 transition-all text-base font-semibold shadow-sm active:scale-95">${symbol}</button>`
                                                ).join('')}
                                            </div>
                                        </div>
                                        
                                        <!-- Math Operators -->
                                        <div class="space-y-3">
                                            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                                <span class="w-1 h-4 bg-[#B80236] rounded"></span>
                                                Math Operators
                                            </h4>
                                            <div class="flex flex-wrap gap-1.5">
                                                ${['±', '∓', '×', '÷', '∙', '·', '⋅', '∗', '∘', '∝', '∞', '√', '∛', '∜', '∑', '∏', '∫', '∬', '∭', '∮', '∂', '∇', 'Δ', '∆'].map(symbol => 
                                                    `<button type="button" onclick="insertSymbol('${symbol}')" class="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-[#B80236] hover:text-white hover:border-[#B80236] hover:scale-110 transition-all text-base font-semibold shadow-sm active:scale-95">${symbol}</button>`
                                                ).join('')}
                                            </div>
                                        </div>
                                        
                                        <!-- Comparison & Relations -->
                                        <div class="space-y-3">
                                            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                                <span class="w-1 h-4 bg-[#B80236] rounded"></span>
                                                Comparison & Relations
                                            </h4>
                                            <div class="flex flex-wrap gap-1.5">
                                                ${['=', '≠', '≈', '≅', '≡', '∼', '∽', '<', '>', '≤', '≥', '≪', '≫', '∝', '∈', '∉', '∋', '∌', '⊂', '⊃', '⊆', '⊇', '∪', '∩'].map(symbol => 
                                                    `<button type="button" onclick="insertSymbol('${symbol}')" class="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-[#B80236] hover:text-white hover:border-[#B80236] hover:scale-110 transition-all text-base font-semibold shadow-sm active:scale-95">${symbol}</button>`
                                                ).join('')}
                                            </div>
                                        </div>
                                        
                                        <!-- Logic & Set Theory -->
                                        <div class="space-y-3">
                                            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                                <span class="w-1 h-4 bg-[#B80236] rounded"></span>
                                                Logic & Sets
                                            </h4>
                                            <div class="flex flex-wrap gap-1.5">
                                                ${['∧', '∨', '¬', '⇒', '⇔', '∀', '∃', '∄', '∅', '∩', '∪', '⊂', '⊃', '∈', '∉', 'ℕ', 'ℤ', 'ℚ', 'ℝ', 'ℂ', '℘'].map(symbol => 
                                                    `<button type="button" onclick="insertSymbol('${symbol}')" class="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-[#B80236] hover:text-white hover:border-[#B80236] hover:scale-110 transition-all text-base font-semibold shadow-sm active:scale-95">${symbol}</button>`
                                                ).join('')}
                                            </div>
                                        </div>

                                        <!-- Geometry -->
                                        <div class="space-y-3">
                                            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                                <span class="w-1 h-4 bg-[#B80236] rounded"></span>
                                                Geometry
                                            </h4>
                                            <div class="flex flex-wrap gap-1.5">
                                                ${['°', '′', '″', '∠', '∡', '⊥', '∥', '⊿', '△', '▱', '□', '◇', '○', '⊙', '⌒', '⊕', '⊗'].map(symbol => 
                                                    `<button type="button" onclick="insertSymbol('${symbol}')" class="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-[#B80236] hover:text-white hover:border-[#B80236] hover:scale-110 transition-all text-base font-semibold shadow-sm active:scale-95">${symbol}</button>`
                                                ).join('')}
                                            </div>
                                        </div>
                                        
                                        <!-- Arrows -->
                                        <div class="space-y-3">
                                            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                                <span class="w-1 h-4 bg-[#B80236] rounded"></span>
                                                Arrows & Directions
                                            </h4>
                                            <div class="flex flex-wrap gap-1.5">
                                                ${['→', '←', '↑', '↓', '↔', '⇒', '⇐', '⇔', '⇄', '⇌', '↗', '↘', '↖', '↙', '⟶', '⟵'].map(symbol => 
                                                    `<button type="button" onclick="insertSymbol('${symbol}')" class="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-[#B80236] hover:text-white hover:border-[#B80236] hover:scale-110 transition-all text-base font-semibold shadow-sm active:scale-95">${symbol}</button>`
                                                ).join('')}
                                            </div>
                                        </div>

                                        <!-- Trig Functions -->
                                        <div class="space-y-3">
                                            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                                <span class="w-1 h-4 bg-[#B80236] rounded"></span>
                                                Functions
                                            </h4>
                                            <div class="flex flex-wrap gap-1.5">
                                                ${['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'sinh', 'cosh', 'tanh', 'arcsin', 'arccos', 'arctan', 'log', 'ln', 'exp', 'lim', 'max', 'min'].map(symbol => 
                                                    `<button type="button" onclick="insertSymbol('${symbol}')" class="px-2.5 py-1.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-[#B80236] hover:text-white hover:border-[#B80236] hover:scale-110 transition-all text-xs font-semibold shadow-sm active:scale-95">${symbol}</button>`
                                                ).join('')}
                                            </div>
                                        </div>

                                        <!-- Subscripts (Numbers) -->
                                        <div class="space-y-3">
                                            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                                <span class="w-1 h-4 bg-blue-600 rounded"></span>
                                                Subscripts
                                            </h4>
                                            <div class="flex flex-wrap gap-1.5">
                                                ${['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉', '₊', '₋', '₌', '₍', '₎', 'ₐ', 'ₑ', 'ₕ', 'ᵢ', 'ⱼ', 'ₖ', 'ₗ', 'ₘ', 'ₙ', 'ₒ', 'ₚ', 'ᵣ', 'ₛ', 'ₜ', 'ᵤ', 'ᵥ', 'ₓ'].map(symbol => 
                                                    `<button type="button" onclick="insertSymbol('${symbol}')" class="px-3 py-2 bg-blue-50 border-2 border-blue-300 rounded-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:scale-110 transition-all text-base font-semibold shadow-sm active:scale-95">${symbol}</button>`
                                                ).join('')}
                                            </div>
                                        </div>

                                        <!-- Superscripts (Numbers) -->
                                        <div class="space-y-3">
                                            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                                <span class="w-1 h-4 bg-green-600 rounded"></span>
                                                Superscripts
                                            </h4>
                                            <div class="flex flex-wrap gap-1.5">
                                                ${['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '⁺', '⁻', '⁼', '⁽', '⁾', 'ⁿ', 'ᵃ', 'ᵇ', 'ᶜ', 'ᵈ', 'ᵉ', 'ᶠ', 'ᵍ', 'ʰ', 'ⁱ', 'ʲ', 'ᵏ', 'ˡ', 'ᵐ', 'ⁿ', 'ᵒ', 'ᵖ', 'ʳ', 'ˢ', 'ᵗ', 'ᵘ', 'ᵛ', 'ʷ', 'ˣ', 'ʸ', 'ᶻ'].map(symbol => 
                                                    `<button type="button" onclick="insertSymbol('${symbol}')" class="px-3 py-2 bg-green-50 border-2 border-green-300 rounded-lg hover:bg-green-600 hover:text-white hover:border-green-600 hover:scale-110 transition-all text-base font-semibold shadow-sm active:scale-95">${symbol}</button>`
                                                ).join('')}
                                            </div>
                                        </div>

                                        <!-- Chemistry -->
                                        <div class="space-y-3">
                                            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                                <span class="w-1 h-4 bg-purple-600 rounded"></span>
                                                Chemistry
                                            </h4>
                                            <div class="flex flex-wrap gap-1.5">
                                                ${['H₂O', 'CO₂', 'O₂', 'N₂', 'H₂SO₄', 'NaCl', 'CH₄', 'NH₃', 'HCl', 'NaOH', 'CaCO₃', 'C₆H₁₂O₆', '⇌', '→', '↑', '↓', '△', '⊕', '⊖'].map(symbol => 
                                                    `<button type="button" onclick="insertSymbol('${symbol}')" class="px-2.5 py-1.5 bg-purple-50 border-2 border-purple-300 rounded-lg hover:bg-purple-600 hover:text-white hover:border-purple-600 hover:scale-110 transition-all text-xs font-semibold shadow-sm active:scale-95">${symbol}</button>`
                                                ).join('')}
                                            </div>
                                        </div>

                                        <!-- Physics -->
                                        <div class="space-y-3">
                                            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                                <span class="w-1 h-4 bg-orange-600 rounded"></span>
                                                Physics & Units
                                            </h4>
                                            <div class="flex flex-wrap gap-1.5">
                                                ${['Ω', 'μ', 'π', 'λ', 'ν', 'ρ', 'σ', 'τ', 'φ', 'ω', 'Å', '℃', '℉', '°', '′', '″', 'ℓ', '℧'].map(symbol => 
                                                    `<button type="button" onclick="insertSymbol('${symbol}')" class="px-3 py-2 bg-orange-50 border-2 border-orange-300 rounded-lg hover:bg-orange-600 hover:text-white hover:border-orange-600 hover:scale-110 transition-all text-base font-semibold shadow-sm active:scale-95">${symbol}</button>`
                                                ).join('')}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Custom Input Section -->
                                    <div class="mt-6 pt-6 border-t-2 border-gray-300">
                                        <h4 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                                            Custom Subscript/Superscript
                                        </h4>
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <!-- Subscript Builder -->
                                            <div class="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                                                <label class="block text-sm font-semibold text-blue-900 mb-2">Subscript Builder</label>
                                                <div class="flex gap-2">
                                                    <input type="text" id="subscript-input" placeholder="e.g., X123" class="flex-1 px-3 py-2 border-2 border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                                    <button type="button" onclick="insertCustomSubscript()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap">
                                                        Insert ₓ
                                                    </button>
                                                </div>
                                                <p class="text-xs text-blue-700 mt-2">Example: "X123" becomes "X₁₂₃"</p>
                                            </div>

                                            <!-- Superscript Builder -->
                                            <div class="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                                                <label class="block text-sm font-semibold text-green-900 mb-2">Superscript Builder</label>
                                                <div class="flex gap-2">
                                                    <input type="text" id="superscript-input" placeholder="e.g., x2+1" class="flex-1 px-3 py-2 border-2 border-green-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                                                    <button type="button" onclick="insertCustomSuperscript()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap">
                                                        Insert ˣ
                                                    </button>
                                                </div>
                                                <p class="text-xs text-green-700 mt-2">Example: "x2+1" becomes "x²⁺¹"</p>
                                            </div>
                                        </div>
                                    </div>

                                    <p class="text-xs text-gray-500 mt-4 text-center flex items-center justify-center gap-2">
                                        <i data-lucide="info" class="w-4 h-4"></i>
                                        Click any symbol to insert it into the question text at cursor position
                                    </p>
                                </div>
                            </div>

                            <!-- Question Text -->
                            <div class="mb-6">
                                <label class="block text-sm font-semibold text-gray-700 mb-3">Question Text</label>
                                <textarea id="question-text" rows="4" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B80236] focus:border-transparent transition-all resize-none" placeholder="Enter your question here... You can use the symbols above for mathematical expressions."></textarea>
                            </div>
                                                       
                            
                            <!-- Question Image Upload Section -->
                            <div class="mb-6">
                                <label class="block text-sm font-semibold text-gray-700 mb-3">
                                    Question Image/Diagram (Optional)
                                    <span class="text-xs font-normal text-gray-500 ml-2">For Biology diagrams, charts, etc.</span>
                                </label>
                                
                                <!-- Hidden file input -->
                                <input type="file" 
                                    id="question-image-input" 
                                    accept="image/*" 
                                    onchange="handleQuestionImageUpload(event)"
                                    class="hidden" />
                                
                                <!-- Upload button -->
                                <div class="flex flex-wrap gap-3">
                                    <button type="button" 
                                            onclick="triggerImageUpload()" 
                                            class="bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 text-blue-700 px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-semibold">
                                        <i data-lucide="image-plus" class="w-5 h-5"></i>
                                        Upload Image
                                    </button>
                                    
                                    <div class="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-300">
                                        <i data-lucide="clipboard" class="w-4 h-4"></i>
                                        <span>or press <kbd class="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">Ctrl+V</kbd> to paste</span>
                                    </div>
                                </div>
                                
                                <!-- Image preview container -->
                                <div id="image-preview-container" class="mt-4"></div>
                                
                                <p class="text-xs text-gray-500 mt-2">
                                    <i data-lucide="info" class="w-3 h-3 inline"></i>
                                    Supported: PNG, JPG, GIF • Max size: 5MB • You can paste from clipboard
                                </p>
                            </div>



<!-- Question Type -->
<div class="mb-6">
    <label class="block text-sm font-semibold text-gray-700 mb-3">Question Type</label>
    <select id="question-type" onchange="toggleQuestionOptions()" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B80236] focus:border-transparent transition-all">
        <option value="multiple_choice">Multiple Choice</option>
        <option value="true_false">True/False</option>
    </select>
</div>

<!-- Multiple Choice Options -->
<div id="options-container" class="space-y-4 mb-6">
    <label class="block text-sm font-semibold text-gray-700 mb-3">Options & Correct Answer</label>
    <div class="grid grid-cols-1 gap-4">
        ${['A', 'B', 'C', 'D'].map(letter => `
        <div class="option-row flex items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div class="option-input-wrapper flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <span class="letter-badge w-7 h-7 sm:w-8 sm:h-8 bg-[#B80236] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">${letter}</span>
            <input type="text"
                    id="option-${letter.toLowerCase()}"
                    placeholder="Option ${letter}"
                    class="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B80236] focus:border-transparent transition-all text-sm" />
            </div>

            <label class="correct-wrapper flex items-center gap-1 sm:gap-2 cursor-pointer flex-shrink-0">
            <input type="radio"
                    name="correct-answer"
                    value="${letter}"
                    class="w-4 h-4 sm:w-5 sm:h-5 text-[#B80236] focus:ring-[#B80236] flex-shrink-0" />
            <span class="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Correct</span>
            </label>
        </div>
        `).join('')}
    </div>
</div>

<!-- True/False Options -->
<div id="true-false-container" class="hidden mb-6">
    <label class="block text-sm font-semibold text-gray-700 mb-3">Correct Answer</label>
    <div class="flex gap-4">
        ${['True', 'False'].map(option => `
        <label class="flex-1 flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
            <input type="radio" 
                   name="correct-answer-tf" 
                   value="${option}" 
                   class="w-5 h-5 text-[#B80236] focus:ring-[#B80236]" />
            <span class="ml-3 text-lg font-medium text-gray-700">${option}</span>
        </label>
        `).join('')}
    </div>
</div>

                            <!-- Add Question Button -->
                            <div class="flex justify-center">
                                <button type="button" onclick="addQuestion()" class="bg-[#B80236] text-white px-8 py-3 rounded-lg hover:bg-[#900028] transition-colors font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                                    <i data-lucide="plus-circle" class="w-5 h-5"></i>
                                    Add Question to Exam
                                </button>
                            </div>
                        </div>

                       <!-- Questions List -->
                        <div class="border-t border-gray-200 pt-8">
                            <div class="flex items-center justify-between mb-6">
                                <h3 class="text-2xl font-bold text-gray-800">Current Questions</h3>
                                <span class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">${exam.questions.length} questions</span>
                            </div>
                            <div id="questions-list" class="space-y-4">
                                ${questionsList}
                            </div>                            
                        </div>
                        
                        <!-- Save Exam Button -->
                        <div class="flex justify-end gap-4 pt-8 border-t border-gray-200">
                            <button type="button" onclick="setPage('teacher')" class="bg-gray-200 text-gray-700 py-3 px-8 rounded-lg hover:bg-gray-300 transition-colors font-semibold">
                                Cancel
                            </button>
                            <button type="submit" class="bg-[#B80236] text-white py-3 px-8 rounded-lg hover:bg-[#900028] transition-colors font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                                <i data-lucide="save" class="w-5 h-5 mr-2 inline"></i>
                                ${state.editingExamId ? 'Update Exam' : 'Save Exam'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

function renderStudentInfoForm(state) {
    // Always use fresh empty values to prevent disabled state issues
    const studentInfo = { name: '', class: '', arms: '' };
    
    return `
        <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-xl p-6 md:p-8 w-full max-w-md animate-fadeIn">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 rounded-full bg-[#B80236] mx-auto mb-4 flex items-center justify-center">
                        <i data-lucide="user-check" class="w-8 h-8 text-white"></i>
                    </div>
                    <h1 class="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Student Information</h1>
                    <p class="text-gray-600 text-sm md:text-base">Please enter your details to start the exam.</p>
                </div>
                <form id="student-info-form" onsubmit="submitStudentInfo(event)" class="space-y-4">
                    <div>
                        <label for="student-name" class="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                        <input type="text" 
                               id="student-name" 
                               name="student-name"
                               value=""
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-[#B80236] focus:border-transparent" 
                               placeholder="e.g., John Doe" 
                               required />
                    </div>
                    <div>
                        <label for="student-class" class="block text-sm font-semibold text-gray-700 mb-2">Class</label>
                        <select id="student-class" 
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-[#B80236] focus:border-transparent" 
                                required>
                            <option value="">Select Class</option>
                            <option value="SS 1" ${studentInfo.class === 'SS 1' ? 'selected' : ''}>SS 1</option>
                            <option value="SS 2" ${studentInfo.class === 'SS 2' ? 'selected' : ''}>SS 2</option>
                            <option value="SS 3" ${studentInfo.class === 'SS 3' ? 'selected' : ''}>SS 3</option>
                        </select>
                    </div>
                    <div>
                        <label for="student-arms" class="block text-sm font-semibold text-gray-700 mb-2">Arms</label>
                        <select id="student-arms" 
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-[#B80236] focus:border-transparent" 
                                required>
                            <option value="">Select Arms</option>
                            <option value="A" ${studentInfo.arms === 'A' ? 'selected' : ''}>A</option>
                            <option value="B" ${studentInfo.arms === 'B' ? 'selected' : ''}>B</option>
                            <option value="C" ${studentInfo.arms === 'C' ? 'selected' : ''}>C</option>
                            <option value="D" ${studentInfo.arms === 'D' ? 'selected' : ''}>D</option>
                            <option value="E" ${studentInfo.arms === 'E' ? 'selected' : ''}>E</option>
                            <option value="F" ${studentInfo.arms === 'F' ? 'selected' : ''}>F</option>                            
                            <option value="G" ${studentInfo.arms === 'G' ? 'selected' : ''}>G</option>
                            <option value="H" ${studentInfo.arms === 'H' ? 'selected' : ''}>H</option>
                        </select>
                    </div>
                    <button type="submit" 
                        class="w-full bg-[#B80236] text-white py-3 rounded-lg hover:bg-[#900028] transition-colors text-sm md:text-base font-semibold">
                        Proceed to Exams
                    </button>
                    <button type="button" onclick="setPage('home')" class="w-full text-gray-500 text-sm py-2 hover:underline">
                        Back to Home
                    </button>
                </form>
            </div>
        </div>
    `;
}


function updateQuestionField(field, value) {
    if (state.editingQuestionId) {
        const q = state.currentExamData.questions.find(q => q.id === state.editingQuestionId);
        if (q) q[field] = value;
    }
    // Also update preview if you have one
}

function renderStudentDashboard(state) {
    const student = state.studentInfo;
    const filteredExams = state.availableExams.filter(exam => exam.class === student.class);

    const examListHtml = filteredExams.length > 0 ? filteredExams.map(exam => `
        <div class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-[#B80236] h-full flex flex-col">
            <div class="flex-1">
                <p class="font-bold text-gray-900 text-xl mb-2">${exam.subject}</p>
                <p class="text-gray-600 font-medium mb-4">${exam.exam_id}</p>
                <div class="flex flex-wrap gap-3 text-sm text-gray-600">
                    <span class="flex items-center gap-1">
                        <i data-lucide="list" class="w-4 h-4"></i> 
                        ${exam.questions.length} Questions
                    </span>
                    <span class="flex items-center gap-1">
                        <i data-lucide="clock" class="w-4 h-4"></i> 
                        ${exam.duration} mins
                    </span>
                    <span class="flex items-center gap-1">
                        <i data-lucide="school" class="w-4 h-4"></i> 
                        ${exam.class}
                    </span>
                </div>
            </div>
            <button onclick="startExamSafe('${exam.exam_id}')" 
                    class="bg-[#B80236] hover:bg-[#900028] text-white px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 mt-4 w-full flex items-center justify-center gap-2">
                Start Exam
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('') : `
        <div class="col-span-full text-center py-12">
            <i data-lucide="inbox" class="w-16 h-16 text-gray-400 mx-auto mb-4"></i>
            <p class="text-gray-500 text-lg">No exams available for your class.</p>
        </div>
    `;

    return `
        <div class="min-h-screen bg-gray-50">
            <header class="bg-[#B80236] text-white p-4 md:p-6 shadow-lg">
                <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 class="text-2xl md:text-3xl font-bold mb-2">Welcome, ${student.name}</h1>
                        <p class="text-sm md:text-base font-medium">Class: ${student.class}${student.arms}</p>
                    </div>
                    <button onclick="setPage('student-info')" 
                            class="bg-[#900028] hover:bg-[#700020] px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i> Back
                    </button>
                </div>
            </header>
            
            <main class="max-w-7xl mx-auto p-4 md:p-6">
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-gray-800">Select Your Exam</h2>
                        <span class="px-4 py-2 bg-[#B80236] text-white rounded-lg font-semibold">
                            ${filteredExams.length} Total
                        </span>
                    </div>
                    
                    <!-- IMPORTANT: Grid layout - DO NOT use space-y-4 -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${examListHtml}
                    </div>
                </div>
            </main>
        </div>
    `;
}

function renderExamInterface(state) {
    const student = state.studentInfo || {};
    const welcomeName = student.name || 'Student';
    const studentClassArms = (student.class && student.arms) ? `${student.class} ${student.arms}` : 'N/A';

    const exam = state.shuffledExam || state.selectedExam;

    if (!exam || !exam.questions || exam.questions.length === 0) {
        return `<div style="padding:40px;text-align:center;">Error: No Exam Loaded</div>`;
    }

    const currentQuestion = exam.questions[state.currentQuestionIndex];
    const totalQuestions = exam.questions.length;
    const currentQuestionNumber = state.currentQuestionIndex + 1;
    const progress = (currentQuestionNumber / totalQuestions) * 100;

    console.log('📝 Current Question:', {
        id: currentQuestion.id,
        question: currentQuestion.question.substring(0, 50),
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
       - 2 columns x 2 rows (A+B top row, C+D bottom row)
       - No card styling, flat background
       - onclick directly updates DOM styles immediately (no re-render needed)
       - Selected = solid maroon bg + white text + white checkmark badge
    ========================================================= */
    if (questionType === 'multiple_choice') {
        const opts = currentQuestion.options || [];

        // Build the onclick handler string — directly manipulates DOM for instant feedback
        const buildClick = (label) => `
            (function(){
                var wrap = document.getElementById('opts-${qid}');
                if(!wrap) return;
                wrap.querySelectorAll('[data-opt]').forEach(function(lbl){
                    var mine = lbl.getAttribute('data-opt') === '${label}';
                    lbl.style.background = mine ? '#B80236' : '#f0f2f5';
                    var b = lbl.querySelector('[data-b]');
                    var t = lbl.querySelector('[data-t]');
                    var c = lbl.querySelector('[data-c]');
                    if(b){ b.style.background=mine?'#fff':'#d1d5db'; b.style.color=mine?'#B80236':'#4b5563'; }
                    if(t){ t.style.color=mine?'#fff':'#1f2937'; }
                    if(c){ c.style.display=mine?'flex':'none'; }
                });
                updateAnswer('${qid}', '${label}');
            })()`.replace(/\n\s+/g, ' ');

        optionsContent += `<div id="opts-${qid}" style="display:flex;flex-direction:column;gap:10px;width:100%;">`;

        [[0,1],[2,3]].forEach(function(row) {
            optionsContent += `<div style="display:flex;gap:10px;width:100%;">`;
            row.forEach(function(index) {
                const optionText = (opts[index] || '').trim();
                const optionLabel = String.fromCharCode(65 + index);
                const sel = state.studentAnswers[qid] === optionLabel;
                const dis = optionText === '';

                optionsContent += `
                    <label data-opt="${optionLabel}"
                        onclick="${buildClick(optionLabel)}"
                        style="position:relative;display:flex;align-items:center;gap:10px;flex:1;
                            padding:12px 14px;border-radius:10px;
                            cursor:${dis ? 'default' : 'pointer'};
                            opacity:${dis ? '0.35' : '1'};
                            pointer-events:${dis ? 'none' : 'auto'};
                            background:${sel ? '#B80236' : '#f0f2f5'};
                            user-select:none;">

                        <span data-b style="display:inline-flex;align-items:center;justify-content:center;
                            width:30px;height:30px;min-width:30px;border-radius:7px;
                            font-size:13px;font-weight:800;
                            background:${sel ? '#fff' : '#d1d5db'};
                            color:${sel ? '#B80236' : '#4b5563'};">
                            ${optionLabel}
                        </span>

                        <span data-t style="font-size:13px;font-weight:500;line-height:1.4;flex:1;min-width:0;
                            color:${sel ? '#fff' : '#1f2937'};">
                            ${optionText}
                        </span>

                        <span data-c style="display:${sel ? 'flex' : 'none'};align-items:center;justify-content:center;
                            width:22px;height:22px;min-width:22px;border-radius:50%;
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
       - Selected = solid maroon
    ========================================================= */
    else if (questionType === 'true_false' || questionType === 'truefalse') {
        const sel = state.studentAnswers[qid];

        const tfClick = (val) => `
            (function(){
                ['True','False'].forEach(function(v){
                    var lbl = document.getElementById('tf-${qid}-'+v);
                    if(!lbl) return;
                    var mine = v === '${val}';
                    lbl.style.background = mine ? '#B80236' : '#f0f2f5';
                    var ic = lbl.querySelector('[data-ic]');
                    var tx = lbl.querySelector('[data-tx]');
                    if(ic){ ic.style.background = mine ? 'rgba(255,255,255,0.25)' : (v==='True'?'#dcfce7':'#fee2e2'); }
                    if(tx){ tx.style.color = mine ? '#fff' : '#374151'; }
                });
                updateAnswer('${qid}', '${val}');
            })()`.replace(/\n\s+/g, ' ');

        optionsContent = `
            <div style="display:flex;gap:14px;width:100%;max-width:500px;margin:0 auto;">

                <label id="tf-${qid}-True" onclick="${tfClick('True')}"
                    style="position:relative;flex:1;display:flex;flex-direction:column;
                        align-items:center;justify-content:center;gap:8px;
                        padding:20px 12px;border-radius:12px;cursor:pointer;user-select:none;
                        background:${sel === 'True' ? '#B80236' : '#f0f2f5'};">
                    <div data-ic style="width:42px;height:42px;border-radius:50%;
                        display:flex;align-items:center;justify-content:center;
                        background:${sel === 'True' ? 'rgba(255,255,255,0.25)' : '#dcfce7'};">
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
                            stroke="${sel === 'True' ? '#fff' : '#16a34a'}" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                    </div>
                    <span data-tx style="font-size:15px;font-weight:800;
                        color:${sel === 'True' ? '#fff' : '#374151'};">TRUE</span>
                    <input type="radio" name="answer-${qid}" value="True"
                        ${sel === 'True' ? 'checked' : ''}
                        style="position:absolute;width:0;height:0;opacity:0;pointer-events:none;">
                </label>

                <label id="tf-${qid}-False" onclick="${tfClick('False')}"
                    style="position:relative;flex:1;display:flex;flex-direction:column;
                        align-items:center;justify-content:center;gap:8px;
                        padding:20px 12px;border-radius:12px;cursor:pointer;user-select:none;
                        background:${sel === 'False' ? '#B80236' : '#f0f2f5'};">
                    <div data-ic style="width:42px;height:42px;border-radius:50%;
                        display:flex;align-items:center;justify-content:center;
                        background:${sel === 'False' ? 'rgba(255,255,255,0.25)' : '#fee2e2'};">
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
                            stroke="${sel === 'False' ? '#fff' : '#dc2626'}" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </div>
                    <span data-tx style="font-size:15px;font-weight:800;
                        color:${sel === 'False' ? '#fff' : '#374151'};">FALSE</span>
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
        <div class="no-select" style="position:fixed;inset:0;display:flex;flex-direction:column;
            height:100vh;background:#f0f2f5;overflow:hidden;margin:0;padding:0;">

            <!-- HEADER -->
            <header style="position:relative;flex-shrink:0;z-index:40;
                background:linear-gradient(90deg,#B80236 0%,#8a0228 100%);
                padding:10px 20px;-webkit-app-region:no-drag;">
                <div style="position:absolute;inset:0;opacity:0.07;pointer-events:none;
                    background-image:radial-gradient(circle,#fff 1px,transparent 1px);
                    background-size:18px 18px;"></div>
                <div style="position:relative;display:flex;justify-content:space-between;align-items:center;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div style="width:40px;height:40px;border-radius:50%;
                            background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.4);
                            display:flex;align-items:center;justify-content:center;
                            font-size:17px;font-weight:800;color:#fff;flex-shrink:0;">
                            ${welcomeName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-size:15px;font-weight:700;color:#fff;line-height:1.2;">${exam.subject}</div>
                            <div style="font-size:12px;color:rgba(255,255,255,0.85);">
                                <b>${welcomeName}</b>&nbsp;•&nbsp;${studentClassArms}
                            </div>
                        </div>
                    </div>
                    <div style="background:linear-gradient(135deg,#fbbf24,#f59e0b);border-radius:12px;
                        padding:7px 16px;border:2px solid rgba(255,255,255,0.5);
                        box-shadow:0 4px 12px rgba(0,0,0,0.2);">
                        <div style="font-size:10px;font-weight:700;color:#1f2937;text-transform:uppercase;letter-spacing:0.05em;">Time Left</div>
                        <div id="timer-display" style="font-size:22px;font-family:monospace;font-weight:900;color:#111;line-height:1.1;">
                            ${formatTime(state.timeRemaining)}
                        </div>
                    </div>
                </div>
            </header>

            <!-- PROGRESS BAR -->
            <div style="height:4px;background:#dde1e7;flex-shrink:0;">
                <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,#22c55e,#16a34a);transition:width 0.4s;"></div>
            </div>

            <!-- BODY -->
            <div style="display:flex;flex:1;overflow:hidden;gap:12px;padding:12px;min-height:0;">

                <!-- SIDEBAR -->
                <aside class="hidden lg:flex" style="flex-direction:column;width:215px;flex-shrink:0;
                    background:#fff;border-radius:18px;box-shadow:0 2px 16px rgba(0,0,0,0.07);
                    padding:14px;overflow-y:auto;">

                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <span style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;">Questions</span>
                        <span style="font-size:10px;font-weight:700;color:#B80236;background:#fce7f3;padding:1px 8px;border-radius:20px;">${totalQuestions}</span>
                    </div>

                    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-bottom:14px;">
                        ${exam.questions.map((q, idx) => {
                            const isAnswered = !!state.studentAnswers[q.id];
                            const isCurrent = idx === state.currentQuestionIndex;
                            const bg = isCurrent ? '#B80236' : isAnswered ? '#22c55e' : '#f3f4f6';
                            const col = (isCurrent || isAnswered) ? '#fff' : '#6b7280';
                            const ring = isCurrent ? 'box-shadow:0 0 0 2px #fff,0 0 0 4px #B80236;' : '';
                            return `<button onclick="goToQuestion(${idx})" style="height:34px;border-radius:7px;
                                font-size:11px;font-weight:700;border:none;cursor:pointer;
                                background:${bg};color:${col};${ring}transition:all 0.15s;">
                                ${idx + 1}
                            </button>`;
                        }).join('')}
                    </div>

                    <div style="border-top:1px solid #f3f4f6;padding-top:10px;display:flex;flex-direction:column;gap:7px;">
                        <div style="display:flex;align-items:center;gap:7px;">
                            <div style="width:11px;height:11px;border-radius:3px;background:#B80236;"></div>
                            <span style="font-size:11px;color:#6b7280;">Current</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:7px;">
                            <div style="width:11px;height:11px;border-radius:3px;background:#22c55e;"></div>
                            <span style="font-size:11px;color:#6b7280;">Answered</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:7px;">
                            <div style="width:11px;height:11px;border-radius:3px;background:#e5e7eb;border:1px solid #d1d5db;"></div>
                            <span style="font-size:11px;color:#6b7280;">Pending</span>
                        </div>
                    </div>

                    <div style="margin-top:auto;padding-top:12px;border-top:1px solid #f3f4f6;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                            <span style="font-size:11px;color:#6b7280;">Progress</span>
                            <span style="font-size:11px;font-weight:700;color:#B80236;">${Math.round(progress)}%</span>
                        </div>
                        <div style="height:5px;background:#e5e7eb;border-radius:99px;overflow:hidden;">
                            <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,#B80236,#8a0228);border-radius:99px;transition:width 0.4s;"></div>
                        </div>
                    </div>
                </aside>

                <!-- MAIN PANEL -->
                <main style="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;min-height:0;">
                    <div style="flex:1;background:#fff;border-radius:18px;
                        box-shadow:0 2px 16px rgba(0,0,0,0.07);
                        display:flex;flex-direction:column;overflow:hidden;min-height:0;">

                        <!-- Question + image -->
                        <div style="flex-shrink:0;padding:16px 20px 14px;border-bottom:2px solid #f3f4f6;">
                            ${isValidImageSrc(currentQuestion.image) ? `
                                <div style="display:flex;justify-content:center;margin-bottom:10px;">
                                    <img src="${currentQuestion.image}" alt="Question diagram"
                                        style="max-width:100%;max-height:80px;border-radius:10px;
                                            border:2px solid #e5e7eb;box-shadow:0 2px 8px rgba(0,0,0,0.1);cursor:pointer;"
                                        onclick="openImageModal('${currentQuestion.image.replace(/'/g, "\\'")}')"/>
                                </div>` : ''}
                            <div style="border-left:4px solid #B80236;padding-left:12px;">
                                <p style="margin:0;font-size:17px;font-weight:600;color:#1f2937;line-height:1.6;">
                                    ${currentQuestion.question}
                                </p>
                            </div>
                        </div>

                        <!-- Options -->
                        <div style="flex:1;display:flex;align-items:center;padding:16px 20px;overflow:hidden;min-height:0;">
                            <div style="width:100%;">
                                ${optionsContent}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <!-- FOOTER -->
            <footer style="flex-shrink:0;padding:6px 14px 12px;z-index:30;">
                <div style="background:#fff;border-radius:14px;padding:9px 16px;
                    box-shadow:0 2px 12px rgba(0,0,0,0.08);
                    display:flex;justify-content:space-between;align-items:center;">

                    <button onclick="changeQuestion(-1)"
                        ${state.currentQuestionIndex === 0 ? 'style="visibility:hidden;"' : ''}
                        style="display:flex;align-items:center;gap:6px;padding:7px 18px;
                            font-size:13px;font-weight:700;border:none;border-radius:9px;cursor:pointer;
                            background:#f3f4f6;color:#374151;">
                        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                        </svg>
                        Previous
                    </button>

                    <span class="lg:hidden" style="font-size:13px;font-weight:700;color:#9ca3af;">
                        ${currentQuestionNumber} / ${totalQuestions}
                    </span>

                    ${state.currentQuestionIndex === totalQuestions - 1
                        ? `<button onclick="submitExam()"
                                style="display:flex;align-items:center;gap:6px;padding:7px 22px;
                                    font-size:13px;font-weight:700;border:none;border-radius:9px;cursor:pointer;
                                    background:linear-gradient(90deg,#22c55e,#16a34a);color:#fff;">
                                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                Submit Exam
                            </button>`
                        : `<button onclick="changeQuestion(1)"
                                style="display:flex;align-items:center;gap:6px;padding:7px 22px;
                                    font-size:13px;font-weight:700;border:none;border-radius:9px;cursor:pointer;
                                    background:linear-gradient(90deg,#B80236,#8a0228);color:#fff;">
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


function renderViewResultsPage(state) {
    const filteredResults = state.allResults.filter(result => {
    // Convert to lowercase for case-insensitive matching
    const subjectMatch = !state.resultFilter.subject || 
        (result.exam_subject && result.exam_subject.toLowerCase().includes(state.resultFilter.subject.toLowerCase()));
    
    const classMatch = !state.resultFilter.class || 
        (result.student_class && result.student_class.toLowerCase().includes(state.resultFilter.class.toLowerCase()));
    
    const armsMatch = !state.resultFilter.arms || 
        (result.student_arms && result.student_arms.toLowerCase().includes(state.resultFilter.arms.toLowerCase()));
    
    return subjectMatch && classMatch && armsMatch;
});

    const getGrade = (percentage) => {
        if (percentage >= 70) return { grade: 'A1', color: 'text-green-600 bg-green-100' };
        if (percentage >= 65) return { grade: 'B2', color: 'text-green-600 bg-green-100' };
        if (percentage >= 60) return { grade: 'B3', color: 'text-yellow-600 bg-yellow-100' };
        if (percentage >= 55) return { grade: 'C4', color: 'text-yellow-600 bg-yellow-100' };
        if (percentage >= 50) return { grade: 'C5', color: 'text-yellow-700 bg-yellow-100' };
        if (percentage >= 45) return { grade: 'C6', color: 'text-orange-600 bg-orange-100' };
        if (percentage >= 40) return { grade: 'D7', color: 'text-red-600 bg-red-100' };
        if (percentage >= 35) return { grade: 'E8', color: 'text-red-600 bg-red-100' };
        return { grade: 'F9', color: 'text-red-700 bg-red-200 font-bold' };
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const resultsList = filteredResults.length === 0 ? 
        `<tr><td colspan="9" class="px-6 py-12 text-center text-gray-500 text-lg">No results found. Try adjusting the filters.</td></tr>` :
        filteredResults.map((result, index) => {
            const totalQuestions = result.exam_details?.questions?.length || 1;
            const percentage = Math.round((result.score / totalQuestions) * 100);
            const { grade, color } = getGrade(percentage);

            return `
                <tr class="hover:bg-gray-50 transition-colors border-b">
                    <td class="px-4 py-4 text-sm font-medium text-gray-900">${index + 1}</td>
                    <td class="px-4 py-4 text-sm font-semibold text-gray-800">${result.student_name || 'Anonymous'}</td>
                    <td class="px-4 py-4 text-sm text-gray-600">${result.student_class}${result.student_arms}</td>
                    <td class="px-4 py-4 text-sm text-gray-700 font-medium">${result.exam_subject}</td>
                    <td class="px-4 py-4 text-sm font-bold text-gray-800">${result.score}<span class="text-gray-400">/${totalQuestions}</span></td>
                    <td class="px-4 py-4 text-lg font-bold text-gray-900">${percentage}%</td>
                    <td class="px-4 py-4">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${color}">
                            ${grade}
                        </span>
                    </td>
                    <td class="px-4 py-4 text-xs text-gray-500">${formatDate(result.submitted_at)}</td>
                    <td class="px-4 py-4 text-right">                        
                        <button onclick="viewDetailedResult('${result.result_id}')" 
                                class="text-[#B80236] hover:text-[#900028] font-bold underline text-sm">
                            View Details
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    return `
        <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <!-- Header -->
            <div class="bg-gradient-to-r from-[#B80236] to-[#900028] text-white shadow-xl">
                <div class="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 class="text-2xl md:text-3xl font-bold flex items-center gap-3">
                            <i data-lucide="bar-chart-3" class="w-8 h-8"></i>
                            All Exam Results
                        </h1>
                        <p class="text-pink-100 mt-1">Total: <strong>${filteredResults.length}</strong> submission(s)</p>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="toggleFilterModal()" 
                                class="bg-white/20 hover:bg-white/30 backdrop-blur px-5 py-3 rounded-xl font-medium flex items-center gap-2 transition-all">
                            <i data-lucide="filter" class="w-5 h-5"></i>
                            Filter Results
                        </button>
                        <button onclick="setPage('teacher')" 
                                class="bg-white text-[#B80236] hover:bg-gray-100 px-6 py-3 rounded-xl font-bold transition-all">
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>

            <!-- Results Table -->
            <div class="max-w-7xl mx-auto p-4 md:p-6">
                <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div class="px-6 py-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                        <h2 class="text-xl font-bold text-gray-800">Results Summary</h2>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50 border-b-2 border-gray-200">
                                <tr>
                                    <th class="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase">#</th>
                                    <th class="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase">Student</th>
                                    <th class="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase">Class</th>
                                    <th class="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase">Subject</th>
                                    <th class="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase">Score</th>
                                    <th class="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase">%</th>
                                    <th class="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase">Grade</th>
                                    <th class="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                                    <th class="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                ${resultsList}
                            </tbody>
                        </table>
                    </div>

                    ${filteredResults.length === 0 ? '' : `
<div class="px-6 py-4 bg-gray-50 border-t text-center text-sm text-gray-600">
                        End of results • ${filteredResults.length} record(s) shown
                    </div>`}
                </div>
            </div>

            <!-- Filter Modal (already in your code) -->
            ${state.showFilterModal ? renderFilterModal() : ''}
        </div>
    `;
 }
 
 function renderExamOfficeResultsPage(state) {
     const { subject, class: studentClass, arms } = state.resultFilter || {};
     
     const filteredResults = state.allResults.filter(result => {
         const subjectMatch = !subject || result.exam_subject === subject;
         const classMatch = !studentClass || result.student_class === studentClass;
         const armsMatch = !arms || result.student_arms === arms;
         return subjectMatch && classMatch && armsMatch;
     });
 
     const getGrade = (percentage) => {
         if (percentage >= 70) return { grade: 'A1', color: 'text-green-600 bg-green-100' };
         if (percentage >= 65) return { grade: 'B2', color: 'text-green-600 bg-green-100' };
         if (percentage >= 60) return { grade: 'B3', color: 'text-yellow-600 bg-yellow-100' };
         if (percentage >= 55) return { grade: 'C4', color: 'text-yellow-600 bg-yellow-100' };
         if (percentage >= 50) return { grade: 'C5', color: 'text-yellow-700 bg-yellow-100' };
         if (percentage >= 45) return { grade: 'C6', color: 'text-orange-600 bg-yellow-100' };
         if (percentage >= 40) return { grade: 'D7', color: 'text-red-600 bg-red-100' };
         if (percentage >= 35) return { grade: 'E8', color: 'text-red-600 bg-red-100' };
         return { grade: 'F9', color: 'text-red-700 bg-red-200 font-bold' };
     };
 
     const formatDate = (isoString) => {
         const date = new Date(isoString);
         return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
     };
 
     const resultsList = filteredResults.length === 0 ? 
         `<tr><td colspan="9" class="px-6 py-12 text-center text-gray-500 text-lg">No results found. Try adjusting the filters.</td></tr>` :
         filteredResults.map((result, index) => {
             const totalQuestions = result.exam_details?.questions?.length || 1;
             const percentage = Math.round((result.score / totalQuestions) * 100);
             const { grade, color } = getGrade(percentage);
 
             return `
                 <tr class="hover:bg-gray-50 transition-colors border-b">
                     <td class="px-4 py-4 text-sm font-medium text-gray-900">${index + 1}</td>
                     <td class="px-4 py-4 text-sm font-semibold text-gray-800">${result.student_name || 'Anonymous'}</td>
                     <td class="px-4 py-4 text-sm text-gray-600">${result.student_class}${result.student_arms}</td>
                     <td class="px-4 py-4 text-sm text-gray-700 font-medium">${result.exam_subject}</td>
                     <td class="px-4 py-4 text-sm font-bold text-gray-800">${result.score}<span class="text-gray-400">/${totalQuestions}</span></td>
                     <td class="px-4 py-4 text-lg font-bold text-gray-900">${percentage}%</td>
                     <td class="px-4 py-4">
                         <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${color}">
                             ${grade}
                         </span>
                     </td>
                     <td class="px-4 py-4 text-xs text-gray-500">${formatDate(result.submitted_at)}</td>
                     <td class="px-4 py-4 text-right">                        
                         <button onclick="viewDetailedResult('${result.result_id}')" 
                                 class="text-purple-600 hover:text-purple-800 font-bold underline text-sm">
                             View Details
                         </button>
                     </td>
                 </tr>
             `;
         }).join('');
 
     return `
         <style>
             ::-webkit-scrollbar { width: 8px; }
             ::-webkit-scrollbar-track { background: #f1f1f1; }
             ::-webkit-scrollbar-thumb { background: #7e22ce; border-radius: 4px; }
             .sidebar-transition { transition: transform 0.3s ease-in-out; }
             @media (max-width: 768px) { .sidebar-hidden { transform: translateX(-100%); } }
             .menu-item-active { background: linear-gradient(to right, rgba(255,255,255,0.2), rgba(255,255,255,0.1)); border-left: 4px solid #fff; }
         </style>
 
         <div class="flex h-screen overflow-hidden bg-gray-50">
             <aside id="examOfficeSidebar" class="sidebar-transition bg-gradient-to-b from-purple-700 to-purple-900 text-white w-64 flex-shrink-0 fixed md:relative h-full z-50 overflow-y-auto">
                 <div class="flex flex-col h-full">
                     <div class="p-6 border-b border-white/20">
                         <div class="flex items-center gap-3">
                             <div class="bg-white/20 p-2 rounded-lg">
                                 <i data-lucide="building" class="w-8 h-8"></i>
                             </div>
                             <div>
                                 <h1 class="text-xl font-bold">${state.user?.school_name || state.user?.name || 'School'}</h1>
                                 <p class="text-xs text-purple-200">Exam Office Portal</p>
                             </div>
                         </div>
                     </div>
                     <nav class="flex-1 py-4">
                         <ul class="space-y-1 px-3">
                             <li><a href="#" onclick="setPage('exam-office-dashboard')" class="exam-office-menu-item flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-page="exam-office-dashboard"><i data-lucide="layout-dashboard" class="w-5 h-5"></i><span class="font-medium">Dashboard</span></a></li>
                             <li><a href="#" onclick="setPage('exam-office-results')" class="exam-office-menu-item menu-item-active flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-page="exam-office-results"><i data-lucide="bar-chart-2" class="w-5 h-5"></i><span class="font-medium">View Results</span></a></li>
                             <li><button onclick="logout()" class="w-full exam-office-menu-item flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-left"><i data-lucide="log-out" class="w-5 h-5"></i><span class="font-medium">Logout</span></button></li>
                         </ul>
                     </nav>
                 </div>
             </aside>
 
             <div id="sidebarOverlay" class="hidden md:hidden fixed inset-0 bg-black/50 z-40" onclick="toggleExamOfficeSidebar()"></div>
 
             <div class="flex-1 flex flex-col overflow-hidden">
                 <header class="bg-white shadow-sm border-b border-gray-200">
                     <div class="flex items-center justify-between px-6 py-4">
                         <div class="flex items-center gap-4">
                             <button onclick="toggleExamOfficeSidebar()" class="md:hidden text-gray-600"><i data-lucide="menu" class="w-6 h-6"></i></button>
                             <div><h2 class="text-2xl font-bold text-gray-800">Exam Results</h2><p class="text-sm text-gray-500">View and analyze all exam results</p></div>
                         </div>
                         <button onclick="toggleFilterModal()" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"><i data-lucide="filter" class="w-4 h-4"></i>Filter</button>
                     </div>
                 </header>
 
                 <main class="flex-1 overflow-y-auto p-6">
                     <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                         <div class="px-6 py-5 bg-gradient-to-r from-purple-50 to-purple-100 border-b">
                             <h2 class="text-xl font-bold text-gray-800">Results Summary</h2>
                             <p class="text-sm text-gray-600">Total: <strong>${filteredResults.length}</strong> record(s)</p>
                         </div>
 
                         <div class="overflow-x-auto">
                             <table class="w-full">
                                 <thead class="bg-gray-50 border-b-2 border-gray-200">
                                     <tr>
                                         <th class="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase">#</th>
                                         <th class="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase">Student</th>
                                         <th class="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase">Class</th>
                                         <th class="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase">Subject</th>
                                         <th class="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase">Score</th>
                                         <th class="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase">%</th>
                                         <th class="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase">Grade</th>
                                         <th class="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                                         <th class="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase">Action</th>
                                     </tr>
                                 </thead>
                                 <tbody class="divide-y divide-gray-200">
                                     ${resultsList}
                                 </tbody>
                             </table>
                         </div>
                     </div>
                 </main>
             </div>
         </div>
 
         ${state.showFilterModal ? renderFilterModal(state) : ''}
 
         <script>
             function toggleExamOfficeSidebar() {
                 document.getElementById('examOfficeSidebar').classList.toggle('sidebar-hidden');
                 document.getElementById('sidebarOverlay').classList.toggle('hidden');
             }
             setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 100);
         </script>
     `;
 }
 
function renderStudentExamList(state) {
     const { name = 'Student', class: studentClass = '', arms = '' } = state.studentInfo || {};

     // Only show exams that have been scheduled (checked) by the exam office
     const availableExams = (state.availableExams || []).filter(exam => exam.scheduledDate);

     const examListHtml = availableExams.length > 0
         ? availableExams.map(exam => `
            <div class="bg-white p-6 rounded-xl shadow hover:shadow-xl transition-all border-l-4 border-[#B80236] mb-6">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div class="flex-1">
                        <h3 class="text-2xl font-bold text-gray-800">${exam.subject}</h3>
                        <p class="text-gray-600 mt-1 text-lg font-medium">${exam.exam_id}</p>
                        <div class="flex flex-wrap gap-6 mt-4 text-sm text-gray-600">
                            <span><i data-lucide="list" class="w-4 h-4 inline"></i> ${exam.questions.length} Questions</span>
                            <span><i data-lucide="clock" class="w-4 h-4 inline"></i> ${exam.duration} mins</span>
                            <span><i data-lucide="school" class="w-4 h-4 inline"></i> ${exam.class}</span>
                        </div>
                    </div>
                    <button onclick="startExamSafe('${exam.exam_id}')"
                            class="bg-[#B80236] hover:bg-[#900028] text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors whitespace-nowrap">
                        Start Exam →
                    </button>
                </div>
            </div>
        `).join('')
        : `
            <div class="text-center py-16">
                <i data-lucide="book-open" class="w-20 h-20 text-gray-300 mx-auto mb-4"></i>
                <p class="text-xl text-gray-600">No scheduled exams available for</p>
                <p class="text-3xl font-bold text-[#B80236] mt-3">${studentClass}${arms || ''}</p>
                <p class="text-gray-500 mt-6">Please contact your teacher or exam office.</p>
            </div>
        `;

    return `
        <div class="min-h-screen bg-gradient-to-br from-pink-50 to-red-50">
            <!-- Header -->
            <header class="bg-[#B80236] text-white p-6 shadow-lg">
                <div class="max-w-5xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl md:text-3xl font-bold">Welcome, ${name}!</h1>
                        <p class="text-pink-100 text-lg">Class: ${studentClass}${arms}</p>
                    </div>
                    <button onclick="setPage('home')" class="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg">
                        <i data-lucide="home" class="w-5 h-5"></i> Home
                    </button>
                </div>
            </header>

            <!-- Main Content -->
            <main class="max-w-5xl mx-auto p-6">
                <h2 class="text-3xl font-bold text-center text-gray-800 mb-10">
                    Select Your Exam
                </h2>

                <div class="space-y-6">
                    ${examListHtml}
                </div>
            </main>
        </div>
    `;
}


 function renderStudentResultsPage() {
     return `<div class="min-h-screen flex items-center justify-center p-4"><p class="text-xl text-gray-600">Student result viewing is disabled.</p></div>`;
}

 function renderFilterModal(state) {
    return `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-800">Filter Results</h3>
                    <button onclick="toggleFilterModal()" class="text-gray-400 hover:text-gray-600">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <form id="filter-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                        <select id="filter-subject" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm">
                            <option value="">All Subjects</option>
                            <option value="Agricultural Science" ${state.resultFilter.subject === 'Agricultural Science' ? 'selected' : ''}>Agricultural Science</option>
                                    <option value="Arabic" ${state.resultFilter.subject === 'Arabic' ? 'selected' : ''}>Arabic</option>
                                    <option value="Beauty & Cosmetology" ${state.resultFilter.subject === 'Beauty & Cosmetology' ? 'selected' : ''}>Beauty & Cosmetology</option>
                                    <option value="Biology" ${state.resultFilter.subject === 'Biology' ? 'selected' : ''}>Biology</option>
                                    <option value="Chemistry" ${state.resultFilter.subject === 'Chemistry' ? 'selected' : ''}>Chemistry</option>
                                    <option value="Christian Religious Studies" ${state.resultFilter.subject === 'Christian Religious Studies' ? 'selected' : ''}>Christian Religious Studies</option>
                                    <option value="Citizenship & Heritage Studies Education" ${state.resultFilter.subject === 'Citizenship & Heritage Studies Education' ? 'selected' : ''}>Citizenship & Heritage Studies Education</option>
                                    <option value="Commerce" ${state.resultFilter.subject === 'Commerce' ? 'selected' : ''}>Commerce</option>
                                    <option value="Digital Technologies" ${state.resultFilter.subject === 'Digital Technologies' ? 'selected' : ''}>Digital Technologies</option>
                                    <option value="Economics" ${state.resultFilter.subject === 'Economics' ? 'selected' : ''}>Economics</option>
                                    <option value="English Language" ${state.resultFilter.subject === 'English Language' ? 'selected' : ''}>English Language</option>
                                    <option value="Financial Accounting" ${state.resultFilter.subject === 'Financial Accounting' ? 'selected' : ''}>Financial Accounting</option>
                                    <option value="Fishery" ${state.resultFilter.subject === 'Fishery' ? 'selected' : ''}>Fishery</option>
                                    <option value="Foods and Nutrition" ${state.resultFilter.subject === 'Foods and Nutrition' ? 'selected' : ''}>Foods and Nutrition</option>
                                    <option value="French" ${state.resultFilter.subject === 'French' ? 'selected' : ''}>French</option>
                                    <option value="Further Mathematics" ${state.resultFilter.subject === 'Further Mathematics' ? 'selected' : ''}>Further Mathematics</option>
                                    <option value="Fashion Design & Garment Making" ${state.resultFilter.subject === 'Fashion Design & Garment Making' ? 'selected' : ''}>Fashion Design & Garment Making</option>
                                    <option value="General Mathematics" ${state.resultFilter.subject === 'General Mathematics' ? 'selected' : ''}>General Mathematics</option>
                                    <option value="Geography" ${state.resultFilter.subject === 'Geography' ? 'selected' : ''}>Geography</option>
                                    <option value="Government" ${state.resultFilter.subject === 'Government' ? 'selected' : ''}>Government</option>
                                    <option value="Hausa" ${state.resultFilter.subject === 'Hausa' ? 'selected' : ''}>Hausa</option>
                                    <option value="History" ${state.resultFilter.subject === 'History' ? 'selected' : ''}>History</option>
                                    <option value="Health Education/Health Science" ${state.resultFilter.subject === 'Health Education' ? 'selected' : ''}>Health Education</option>
                                    <option value="Home Management" ${state.resultFilter.subject === 'Home Management' ? 'selected' : ''}>Home Management</option>
                                    <option value="Horticulture & Crop Production" ${state.resultFilter.subject === 'Horticulture & Crop Production' ? 'selected' : ''}>Horticulture & Crop Production</option>
                                    <option value="Igbo" ${state.resultFilter.subject === 'Igbo' ? 'selected' : ''}>Igbo</option>
                                    <option value="Insurance" ${state.resultFilter.subject === 'Insurance' ? 'selected' : ''}>Insurance</option>
                                    <option value="Islamic Religious Studies" ${state.resultFilter.subject === 'Islamic Religious Studies' ? 'selected' : ''}>Islamic Religious Studies</option>
                                    <option value="Literature in English" ${state.resultFilter.subject === 'Literature in English' ? 'selected' : ''}>Literature in English</option>
                                    <option value="Leather Works" ${state.resultFilter.subject === 'Leather Works' ? 'selected' : ''}>Leather Works</option>
                                    <option value="Livestock Farming" ${state.resultFilter.subject === 'Livestock Farming' ? 'selected' : ''}>Livestock Farming</option>                                    
                                    <option value="Marketing" ${state.resultFilter.subject === 'Marketing' ? 'selected' : ''}>Marketing</option>
                                    <option value="Painting and Decoration" ${state.resultFilter.subject === 'Painting and Decoration' ? 'selected' : ''}>Painting and Decoration</option>
                                    <option value="Physical Education" ${state.resultFilter.subject === 'Physical Education' ? 'selected' : ''}>Physical Education</option>
                                    <option value="Physics" ${state.resultFilter.subject === 'Physics' ? 'selected' : ''}>Physics</option>
                                    <option value="Store Management" ${state.resultFilter.subject === 'Store Management' ? 'selected' : ''}>Store Management</option>
                                    <option value="Technical Drawing" ${state.resultFilter.subject === 'Technical Drawing' ? 'selected' : ''}>Technical Drawing</option>
                                    <option value="Visual Arts" ${state.resultFilter.subject === 'Visual Arts' ? 'selected' : ''}>Visual Arts</option>
                                    <option value="Yoruba" ${state.resultFilter.subject === 'Yoruba' ? 'selected' : ''}>Yoruba</option>
                                </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Class</label>
                        <select id="filter-class" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm">
                            <option value="">All Classes</option>
                            <option value="SS 1" ${state.resultFilter.class === 'SS 1' ? 'selected' : ''}>SS 1</option>
                            <option value="SS 2" ${state.resultFilter.class === 'SS 2' ? 'selected' : ''}>SS 2</option>
                            <option value="SS 3" ${state.resultFilter.class === 'SS 3' ? 'selected' : ''}>SS 3</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Arms</label>
                        <select id="filter-arms" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm">
                            <option value="">All Arms</option>
                            <option value="A" ${state.resultFilter.arms === 'A' ? 'selected' : ''}>A</option>
                            <option value="B" ${state.resultFilter.arms === 'B' ? 'selected' : ''}>B</option>
                            <option value="C" ${state.resultFilter.arms === 'C' ? 'selected' : ''}>C</option>
                            <option value="D" ${state.resultFilter.arms === 'D' ? 'selected' : ''}>D</option>
                            <option value="E" ${state.resultFilter.arms === 'E' ? 'selected' : ''}>E</option>
                            <option value="F" ${state.resultFilter.arms === 'F' ? 'selected' : ''}>F</option>
                            <option value="G" ${state.resultFilter.arms === 'G' ? 'selected' : ''}>G</option>
                            <option value="H" ${state.resultFilter.arms === 'H' ? 'selected' : ''}>H</option>
                        </select>
                    </div>
                    <div class="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onclick="clearFilters()" class="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 text-sm font-semibold">
                            Clear Filters
                        </button>
                        <button type="button" onclick="applyFilters()" class="bg-[#B80236] text-white py-2 px-4 rounded-lg hover:bg-[#900028] text-sm font-semibold">
                            Apply Filters
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

 function renderDetailedResultModal(state) {
    const result = state.lastResult;
    // Ensure the student info is available for the modal title
    const studentInfo = state.studentInfo || {}; 
    
    if (!result) return '';
    
    // Calculate necessary display values
    const totalQuestions = result.exam_details?.questions?.length || 1;
    const scorePercentage = ((result.score / totalQuestions) * 100).toFixed(0);
    

    // NOTE: Keeping questionsHtml logic but not rendering the output to hide the breakdown
    const questionsHtml = (result.exam_details?.questions || []).map(question => {
        const studentAnswer = result.answers[question.id];
        
        // Define isCorrect based on question type
        const isCorrect = question.type !== 'essay' ? (studentAnswer === question.correct_answer) : null;
        
        let answerClass = '';
        if (isCorrect === true) { answerClass = 'bg-green-100 text-green-700 border-green-300'; }
        else if (isCorrect === false) { answerClass = 'bg-red-100 text-red-700 border-red-300'; }        
        else { answerClass = 'bg-gray-100 text-gray-700 border-gray-300'; }

        return `
            <div class="p-4 border rounded-lg ${answerClass} ${state.answersExpanded ? 'mb-4' : 'mb-2'}">
                <div class="flex justify-between items-center mb-2">                    
                    <span class="text-xs font-semibold">
                        ${isCorrect === true ? 'Correct' : isCorrect === false ? 'Incorrect' : 'Pending'} 
                    </span>
                </div>
                ${state.answersExpanded ? `
                    <p class="text-sm text-gray-700 mb-3">${question.question}</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div><strong>Your Answer:</strong> ${studentAnswer || 'Not answered'}</div>
                        <div><strong>Correct Answer:</strong> ${question.correct_answer || question.marking_scheme || 'N/A'}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('') || '<p class="text-gray-500">No question details available.</p>';

    return `
    <div class="min-h-screen flex flex-col bg-gray-50">
        <header class="bg-[#B80236] text-white p-4 shadow-lg sticky top-0 z-50">
            <div class="max-w-6xl mx-auto flex justify-between items-center">
                <div class="flex flex-col text-sm">
                    <p class="font-bold text-lg">${student.name || 'Student'} (${student.class || ''}${student.arms || ''})</p>
                    <p class="text-sm font-medium">${exam.subject} - ${exam.exam_id}</p>
                </div>
                <div class="flex items-center bg-white text-[#B80236] font-extrabold text-xl py-2 px-4 rounded-lg shadow-md">
                    <i data-lucide="clock" class="w-6 h-6 mr-2"></i>                    
                    <span id="timer-display">${formatTime(state.timeRemaining || 0)}</span>
                </div>
            </div>
        </header>
        
        <main class="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 pt-0">
            <div class="grid grid-cols-1 gap-6">
                <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mt-6">
                    <div class="mb-6 pb-4 border-b">
                        <h2 class="text-2xl font-bold text-gray-800 mb-2">Question ${currentQuestionNumber} of ${totalQuestions}</h2>
                    </div>
                    
                    <div class="text-lg text-gray-700 mb-8 whitespace-pre-wrap">
                        ${currentQuestion.question}
                    </div>
                    
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">Your Answer:</h3>
                    ${optionsContent}

                    <div class="flex justify-between items-center mt-8 pt-4 border-t">
                        <button onclick="changeQuestion(-1)" 
                                ${state.currentQuestionIndex === 0 ? 'disabled' : ''}
                                class="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                            <i data-lucide="arrow-left" class="w-5 h-5 mr-2"></i> Previous
                        </button>
                        
                        ${state.currentQuestionIndex < totalQuestions - 1 
                            ? `<button onclick="changeQuestion(1)" 
                                        class="bg-[#B80236] text-white px-6 py-2 rounded-lg hover:bg-[#900028] transition-colors flex items-center">
                                        Next <i data-lucide="arrow-right" class="w-5 h-5 ml-2"></i>
                                    </button>`
                            : `<button onclick="submitExam()" 
                                        class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center">
                                        <i data-lucide="check-circle" class="w-5 h-5 mr-2"></i> Submit Exam
                                    </button>`
                        }
                    </div>
                </div>
            </div>
        </main>
    </div>
`;
}

// ========================================
// ADD THESE FUNCTIONS TO THE END OF YOUR render.js FILE
// (Before any window.export statements if you have them)
// ========================================

// Render student result modal (shown immediately after exam submission)
function renderStudentResultModal(result) {
    const percentage = result.percentage || 0;
    const passed = percentage >= 50;
    const wrong = result.total - result.score;
    
    return `
        <div id="result-modal" class="fixed inset-0 bg-gradient-to-br from-orange-900/90 via-red-900/90 to-orange-900/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-3">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[96vh] overflow-y-auto">
                <!-- Header -->
                <div class="bg-gradient-to-br from-orange-600 via-red-700 to-orange-800 text-white p-4 rounded-t-2xl relative overflow-hidden">
                    <!-- Background pattern -->
                    <div class="absolute inset-0 opacity-10">
                        <div class="absolute inset-0" style="background-image: 
                            repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px);"></div>
                    </div>
                    
                    <div class="relative">
                        <div class="text-center mb-3">
                            <h2 class="text-lg font-bold mb-0.5">Exam Completed! 🎉</h2>
                            <p class="text-white/80 text-xs">${result.student_name || 'Student'}</p>
                        </div>
                        
                        <!-- Score Circle -->
                        <div class="flex justify-center mb-2">
                            <div class="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex flex-col items-center justify-center shadow-xl">
                                <div class="text-4xl font-black text-white leading-none">
                                    ${result.score}
                                </div>
                                <div class="flex items-center gap-1 text-white/80">
                                    <div class="h-px w-3 bg-white/50"></div>
                                    <span class="text-base font-bold">${result.total}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="text-center">
                            <span class="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold">
                                ${passed ? 'Passed ✓' : 'Needs Improvement'} • ${percentage}%
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Content -->
                <div class="p-4">
                    <!-- Stats Grid -->
                    <div class="grid grid-cols-3 gap-2 mb-3">
                        <div class="bg-gradient-to-br from-emerald-50 to-green-50 p-2.5 rounded-lg text-center border-2 border-emerald-200">
                            <div class="w-7 h-7 mx-auto mb-1 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                                <i data-lucide="check" class="w-3.5 h-3.5 text-white"></i>
                            </div>
                            <p class="text-xl font-black text-emerald-600">${result.score}</p>
                            <p class="text-[8px] font-bold text-emerald-700 uppercase">Correct</p>
                        </div>
                        <div class="bg-gradient-to-br from-rose-50 to-red-50 p-2.5 rounded-lg text-center border-2 border-rose-200">
                            <div class="w-7 h-7 mx-auto mb-1 bg-gradient-to-br from-rose-500 to-red-600 rounded-lg flex items-center justify-center">
                                <i data-lucide="x" class="w-3.5 h-3.5 text-white"></i>
                            </div>
                            <p class="text-xl font-black text-rose-600">${wrong}</p>
                            <p class="text-[8px] font-bold text-rose-700 uppercase">Wrong</p>
                        </div>
                        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-2.5 rounded-lg text-center border-2 border-blue-200">
                            <div class="w-7 h-7 mx-auto mb-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <i data-lucide="list" class="w-3.5 h-3.5 text-white"></i>
                            </div>
                            <p class="text-xl font-black text-blue-600">${result.total}</p>
                            <p class="text-[8px] font-bold text-blue-700 uppercase">Total</p>
                        </div>
                    </div>

                    <!-- Quick Info -->
                    <div class="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-2.5 mb-3 border border-orange-200">
                        <div class="flex items-center justify-between text-xs">
                            <div class="flex items-center gap-1.5">
                                <i data-lucide="clock" class="w-3.5 h-3.5 text-orange-600"></i>
                                <span class="font-bold text-orange-900 font-mono">
                                    ${Math.floor((result.duration_taken || 0) / 60)}:${((result.duration_taken || 0) % 60).toString().padStart(2, '0')}
                                </span>
                            </div>
                            <div class="h-3 w-px bg-orange-300"></div>
                            <div class="flex items-center gap-1.5">
                                <i data-lucide="book-open" class="w-3.5 h-3.5 text-orange-600"></i>
                                <span class="font-semibold text-orange-900 truncate max-w-[120px]">
                                    ${result.exam_id || result.exam_subject || 'Exam'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Performance Message -->
                    <div class="bg-gradient-to-r ${passed ? 'from-emerald-500 to-green-600' : 'from-orange-500 to-red-600'} p-2.5 rounded-lg mb-3 text-center">
                        <p class="font-bold text-white text-xs leading-tight">
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
                        class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 mb-3"
                    >
                        <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                        View Answers
                    </button>
                    `}

                    ${window.state?.answersExpanded ? `
                    <div class="mb-3">
                        <button 
                            onclick="toggleAnswers()" 
                            class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 mb-2"
                        >
                            <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>
                            Hide Answers
                        </button>
                        <div class="max-h-[200px] overflow-y-auto">
                            ${renderDetailedAnswers(result)}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Action Buttons -->
                    <div class="grid grid-cols-2 gap-2">
                        <button 
                            onclick="closeResultModal(); setPage('home');" 
                            class="bg-gradient-to-br from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 text-white py-2.5 px-3 rounded-lg font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                            <i data-lucide="home" class="w-3.5 h-3.5"></i>
                            EXIT
                        </button>
                        <button 
                            onclick="closeResultModal(); setPage('student-info');" 
                            class="bg-gradient-to-br ${passed ? 'from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700' : 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'} text-white py-2.5 px-3 rounded-lg font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
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

// Render detailed answers breakdown
function renderDetailedAnswers(result) {
    const exam = result.exam_details;
    const answers = result.answers;
    
    if (!exam || !exam.questions) {
        return '<p class="text-gray-500 text-center">No detailed answers available</p>';
    }
    
    return `
        <div class="border-t border-gray-200 pt-4">
            <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <i data-lucide="file-text" class="w-5 h-5"></i>
                Detailed Answers
            </h3>
            <div class="space-y-4 max-h-96 overflow-y-auto">
                ${exam.questions.map((q, idx) => {
                    const studentAnswer = answers[q.id];
                    const isCorrect = checkAnswerCorrect(q, studentAnswer);
                    
                    return `
                        <div class="border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} rounded-lg p-4">
                            <div class="flex items-start gap-3">
                                <div class="flex-shrink-0 w-8 h-8 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-red-500'} flex items-center justify-center">
                                    <i data-lucide="${isCorrect ? 'check' : 'x'}" class="w-5 h-5 text-white"></i>
                                </div>
                                <div class="flex-1">
                                    <p class="font-semibold text-gray-800 mb-2">Q${idx + 1}: ${q.question}</p>
                                    
                                    ${q.type === 'multiple_choice' ? `
                                        <div class="space-y-1 text-sm mb-2">
                                            ${q.options.map((opt, i) => {
                                                const letter = String.fromCharCode(65 + i);
                                                const isStudentAnswer = studentAnswer === letter;
                                                const isCorrectAnswer = q.correct_answer.includes(letter);
                                                
                                                return `
                                                    <div class="flex items-center gap-2 ${isStudentAnswer ? 'font-semibold' : ''}">
                                                        <span class="w-6 ${isCorrectAnswer ? 'text-green-600' : 'text-gray-600'}">${letter}.</span>
                                                        <span class="${isStudentAnswer ? (isCorrect ? 'text-green-700' : 'text-red-700') : 'text-gray-600'}">
                                                            ${opt}
                                                            ${isStudentAnswer ? ' ← Your answer' : ''}
                                                            ${isCorrectAnswer ? ' ✓ Correct' : ''}
                                                        </span>
                                                    </div>
                                                `;
                                            }).join('')}
                                        </div>
                                    ` : (q.type === 'true_false' || q.type === 'truefalse') ? `
                                        <p class="text-sm mb-1">
                                            <span class="font-medium">Your answer:</span> 
                                            <span class="${isCorrect ? 'text-green-700' : 'text-red-700'}">${studentAnswer || 'No answer'}</span>
                                        </p>
                                        <p class="text-sm">
                                            <span class="font-medium">Correct answer:</span> 
                                            <span class="text-green-700">${q.correct_answer}</span>
                                        </p>
                                    ` : `
                                        <p class="text-sm text-gray-600">Essay question - will be graded by teacher</p>
                                        <p class="text-sm mt-1">
                                            <span class="font-medium">Your answer:</span> ${studentAnswer || 'No answer provided'}
                                        </p>
                                    `}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// Helper function to check if answer is correct
function checkAnswerCorrect(question, studentAnswer) {
    if (question.type === 'essay' || !studentAnswer) {
        return false;
    }

    const qType = question.type ? question.type.toLowerCase().trim() : '';

    if (qType === 'true_false' || qType === 'truefalse') {
        return studentAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
    }

    if (qType === 'multiple_choice') {
        if (question.correct_answer.includes(',')) {
            const studentAnswers = studentAnswer.split(',').map(s => s.trim().toUpperCase()).sort().join(',');
            const correctAnswers = question.correct_answer.split(',').map(s => s.trim().toUpperCase()).sort().join(',');
            return studentAnswers === correctAnswers;
        } else {
            return studentAnswer.trim().toUpperCase() === question.correct_answer.trim().toUpperCase();
        }
    }

    return false;
}

// ========================================
// EXAM OFFICE UPLOAD PAGE
// ========================================

function renderExamOfficeUploadPage(state) {
    const recentUploads = state.recentUploads || [];

    return `
        <style>
            .upload-zone {
                border: 3px dashed #c084fc;
                border-radius: 16px;
                padding: 60px 30px;
                text-align: center;
                background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
                transition: all 0.3s ease;
                cursor: pointer;
                position: relative;
            }
            .upload-zone:hover, .upload-zone.drag-over {
                border-color: #7e22ce;
                background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
                transform: scale(1.01);
            }
            .upload-zone.has-file {
                border-color: #22c55e;
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            }
            .file-list-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                margin-bottom: 8px;
                transition: all 0.2s ease;
            }
            .file-list-item:hover {
                border-color: #c084fc;
                box-shadow: 0 2px 8px rgba(192, 132, 252, 0.15);
            }
            .upload-progress {
                height: 6px;
                background: #e2e8f0;
                border-radius: 3px;
                overflow: hidden;
                margin-top: 8px;
            }
            .upload-progress-fill {
                height: 100%;
                background: linear-gradient(to right, #7e22ce, #a855f7);
                border-radius: 3px;
                transition: width 0.3s ease;
            }
        </style>

        <div class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
            <!-- Header -->
            <header class="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-6 shadow-lg">
                <div class="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 class="text-2xl md:text-3xl font-bold">Upload Exams</h1>
                        <p class="text-purple-200 text-lg">Import exam files (CSV) to your school platform</p>
                    </div>
                    <button onclick="setPage('exam-office-dashboard')" class="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg transition-colors">
                        <i data-lucide="arrow-left" class="w-5 h-5 mr-1"></i> Back to Dashboard
                    </button>
                </div>
            </header>

            <!-- Main Content -->
            <main class="max-w-5xl mx-auto p-6">
                <!-- Upload Instructions Card -->
                <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                    <div class="flex items-start gap-3 mb-2">
                        <i data-lucide="info" class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"></i>
                        <div>
                            <h3 class="font-semibold text-blue-800">How It Works</h3>
                            <p class="text-sm text-blue-700 mt-1">Upload one or more CSV exam files. The file format must match the standard CSV export format (exam_id, subject, class, duration, questions_json). You can upload files for multiple classes at once.</p>
                        </div>
                    </div>
                </div>

                <!-- Upload Area -->
                <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <i data-lucide="upload-cloud" class="w-6 h-6 text-purple-600"></i>
                        Upload Exam Files
                    </h2>

                    <div id="upload-zone" class="upload-zone" onclick="document.getElementById('exam-file-input').click()" ondrop="handleDrop(event)" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)">
                        <input type="file" id="exam-file-input" multiple accept=".csv,text/csv" onchange="handleExamOfficeFileSelect(event)" style="display:none;">
                        <div id="upload-content">
                            <i data-lucide="upload-cloud" class="w-16 h-16 text-purple-400 mx-auto mb-4"></i>
                            <p class="text-lg font-semibold text-gray-700 mb-2">Drag & Drop CSV files here</p>
                            <p class="text-sm text-gray-500 mb-4">or click to browse your files</p>
                            <span class="inline-block bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-xs font-semibold">.csv format only</span>
                        </div>
                        <div id="upload-status" class="hidden mt-4">
                            <div class="flex items-center justify-between mb-2">
                                <span id="files-selected-info" class="text-sm font-medium text-gray-700"></span>
                                <button onclick="clearFileList()" class="text-sm text-red-500 hover:underline">Clear All</button>
                            </div>
                            <div id="file-list" class="space-y-1"></div>
                            <div class="flex justify-between items-center mt-4">
                                <span id="upload-progress-text" class="text-sm text-gray-500"></span>
                                <button id="process-upload-btn" onclick="processExamUpload()" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2">
                                    <i data-lucide="upload" class="w-4 h-4"></i>
                                    Upload & Save All
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recently Uploaded Exams -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <i data-lucide="clock" class="w-5 h-5 text-purple-600"></i>
                            Recent Uploads
                        </h2>
                        <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">${recentUploads.length} upload(s)</span>
                    </div>

                    ${recentUploads.length > 0 ? `
                        <div class="space-y-3">
                            ${recentUploads.map((upload, idx) => `
                                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <i data-lucide="file-text" class="w-5 h-5 text-purple-600"></i>
                                        </div>
                                        <div class="min-w-0">
                                            <p class="font-semibold text-gray-800 truncate">${upload.filename}</p>
                                            <p class="text-xs text-gray-500">${upload.examCount} exam(s) • ${upload.questionCount} question(s)</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2 flex-shrink-0">
                                        <span class="text-xs px-2 py-1 ${upload.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} rounded-full font-semibold">${upload.status === 'success' ? 'Processed' : 'Pending'}</span>
                                        <span class="text-xs text-gray-400">${upload.time}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="text-center py-8">
                            <i data-lucide="inbox" class="w-12 h-12 text-gray-300 mx-auto mb-3"></i>
                            <p class="text-gray-500">No uploads yet. Upload your first exam file above!</p>
                        </div>
                    `}
                </div>
            </main>
        </div>
    `;

    // We need to recreate the hidden file input and its handlers after render
    setTimeout(() => {
        const fileInput = document.getElementById('exam-file-input');
        if (fileInput && !fileInput._hasListener) {
            fileInput._hasListener = true;
            fileInput.addEventListener('change', handleExamOfficeFileSelect);
        }
    }, 100);
}

// ========================================
// EXAM OFFICE UPLOAD HANDLERS
// ========================================

// Store parsed files before processing
let pendingUploadFiles = [];

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');

    const files = Array.from(event.dataTransfer.files || []);
    processSelectedFiles(files);
}

function handleExamOfficeFileSelect(event) {
    const files = Array.from(event.target.files || []);
    processSelectedFiles(files);
}

function processSelectedFiles(files) {
    // Validate all files are CSV
    const nonCsvFiles = files.filter(file => {
        const name = file.name.toLowerCase();
        return !name.endsWith('.csv') && !file.type.includes('csv');
    });

    if (nonCsvFiles.length > 0) {
        showAlert(`❌ Non-CSV files detected:\n${nonCsvFiles.map(f => f.name).join('\n')}\n\nOnly CSV files are accepted.`, 'error', 5000);
        return;
    }

    if (files.length === 0) return;

    pendingUploadFiles = files;

    // Show file list
    const statusEl = document.getElementById('upload-status');
    const fileListEl = document.getElementById('file-list');
    const filesInfoEl = document.getElementById('files-selected-info');

    if (statusEl) statusEl.classList.remove('hidden');

    let totalQuestions = 0;

    // Read and preview each file
    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const exam = parseCSVWithBetterHandling(e.target.result);
                totalQuestions += exam.questions?.length || 0;

                const itemHtml = `
                    <div class="file-list-item">
                        <div class="flex items-center gap-2 min-w-0">
                            <i data-lucide="file" class="w-4 h-4 text-green-500 flex-shrink-0"></i>
                            <div class="min-w-0">
                                <p class="text-sm font-medium text-gray-800 truncate">${file.name}</p>
                                <p class="text-xs text-gray-500">${exam.subject || 'Unknown'} • ${exam.class || 'N/A'} • ${exam.questions?.length || 0} questions${exam.duration ? ' • ' + exam.duration + ' min' : ''}</p>
                            </div>
                        </div>
                        <span class="text-xs text-green-600 font-semibold">✓ Valid</span>
                    </div>
                `;

                if (fileListEl) {
                    // Insert or update
                    let existingItem = fileListEl.children[index];
                    if (existingItem) {
                        existingItem.outerHTML = itemHtml;
                    } else {
                        fileListEl.insertAdjacentHTML('beforeend', itemHtml);
                    }
                }

                if (filesInfoEl) {
                    filesInfoEl.textContent = `${files.length} file(s) selected • ${totalQuestions} total questions`;
                }

                if (window.lucide) lucide.createIcons();
            } catch (err) {
                // Show error for this file
                const errorHtml = `
                    <div class="file-list-item">
                        <div class="flex items-center gap-2 min-w-0">
                            <i data-lucide="file-x" class="w-4 h-4 text-red-500 flex-shrink-0"></i>
                            <div class="min-w-0">
                                <p class="text-sm font-medium text-gray-800 truncate">${file.name}</p>
                                <p class="text-xs text-red-500">${err.message || 'Invalid CSV format'}</p>
                            </div>
                        </div>
                        <span class="text-xs text-red-600 font-semibold">✗ Error</span>
                    </div>
                `;
                if (fileListEl) {
                    let existingItem = fileListEl.children[index];
                    if (existingItem) {
                        existingItem.outerHTML = errorHtml;
                    } else {
                        fileListEl.insertAdjacentHTML('beforeend', errorHtml);
                    }
                }
            }
        };
        reader.onerror = function() {
            if (fileListEl) {
                const errorHtml = `
                    <div class="file-list-item">
                        <div class="flex items-center gap-2">
                            <i data-lucide="file-x" class="w-4 h-4 text-red-500"></i>
                            <span class="text-sm text-red-600">${file.name} — Failed to read file</span>
                        </div>
                        <span class="text-xs text-red-600">✗ Error</span>
                    </div>
                `;
                fileListEl.insertAdjacentHTML('beforeend', errorHtml);
            }
        };
        reader.readAsText(file);
    });
}

function clearFileList() {
    pendingUploadFiles = [];
    const fileInput = document.getElementById('exam-file-input');
    if (fileInput) {
        fileInput.value = '';
        const newInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newInput, fileInput);
    }
    const statusEl = document.getElementById('upload-status');
    if (statusEl) statusEl.classList.add('hidden');

    // Reset upload zone appearance
    const uploadZone = document.getElementById('upload-zone');
    if (uploadZone) uploadZone.classList.remove('has-file');
}

async function processExamUpload() {
    if (pendingUploadFiles.length === 0) {
        showAlert('No files selected. Please select CSV file(s) first.', 'error');
        return;
    }

    const btn = document.getElementById('process-upload-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Processing...';
    }

    let successful = 0;
    let failed = 0;
    let skipped = 0;
    let failedDetails = [];
    let totalQuestionsUploaded = 0;

    for (let i = 0; i < pendingUploadFiles.length; i++) {
        const file = pendingUploadFiles[i];

        try {
            showAlert(`📖 Processing ${i + 1}/${pendingUploadFiles.length}: ${file.name}...`, 'info', 3000);

            const content = await readFileAsText(file);
            let exam = parseCSVWithBetterHandling(content);

            // Normalize and validate
            exam = normalizeExamData(exam);
            const validationError = validateExamStructure(exam);

            if (validationError) {
                throw new Error(`Validation failed: ${validationError.substring(0, 100)}`);
            }

            // Track question count for recent uploads summary
            totalQuestionsUploaded += exam.questions?.length || 0;

            // Check if exam already exists
            const existing = state.availableExams.find(e => e.exam_id === exam.exam_id);
            if (existing) {
                const replace = confirm(
                    `⚠️ Exam "${exam.exam_id}" already exists!\n\n` +
                    `Subject: ${existing.subject}\n` +
                    `Current: ${existing.questions.length} questions\n` +
                    `New: ${exam.questions.length} questions\n\n` +
                    `Replace existing exam?`
                );

                if (!replace) {
                    skipped++;
                    continue;
                }

                await deleteExamFromDB(exam.exam_id);
            }

            // Set metadata
            exam.created_by = state.user?.phone_number || state.user?.name || 'exam_office';
            exam.created_date = new Date().toISOString().split('T')[0];

            // Save to database
            await saveExamToDB(exam);

            successful++;
            showAlert(`✅ "${exam.subject}" uploaded successfully!`, 'success', 2000);

        } catch (error) {
            console.error(`❌ Upload failed for ${file.name}:`, error);
            failed++;
            failedDetails.push(`${file.name}: ${error.message}`);
        }

        // Update progress display
        const progressText = document.getElementById('upload-progress-text');
        if (progressText) {
            progressText.textContent = `Processed ${i + 1} of ${pendingUploadFiles.length}`;
        }
    }

    // Reload exams from database
    await loadExams();

    // Update progress display
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="upload" class="w-4 h-4"></i> Upload & Save All';
    }

    // Show summary
    let summary = `📊 Upload Complete!\n\n`;
    if (successful > 0) summary += `✅ ${successful} exam(s) uploaded successfully\n`;
    if (skipped > 0) summary += `⏭️ ${skipped} exam(s) skipped (already exist)\n`;
    if (failed > 0) {
        summary += `❌ ${failed} exam(s) failed:\n`;
        failedDetails.forEach(d => summary += `   • ${d}\n`);
    }

    const alertType = failed > 0 ? (successful > 0 ? 'info' : 'error') : 'success';
    showAlert(summary, alertType, failed > 0 ? 12000 : 6000);

    if (successful > 0) {
        // Record this upload in recent uploads
        if (!state.recentUploads) state.recentUploads = [];
        const now = new Date();
        state.recentUploads.unshift({
            filename: pendingUploadFiles.length === 1
                ? pendingUploadFiles[0].name
                : `${pendingUploadFiles.length} files`,
            examCount: successful,
            questionCount: totalQuestionsUploaded,
            status: successful > 0 ? 'success' : 'partial',
            time: now.toLocaleTimeString()
        });

        // Keep only last 10 uploads
        if (state.recentUploads.length > 10) state.recentUploads = state.recentUploads.slice(0, 10);
    }

    // Clear file list and re-render
    clearFileList();

    // Go back to dashboard after a moment
    setTimeout(() => {
        if (state.currentPage === 'exam-office-upload') {
            setPage('exam-office-dashboard');
        }
    }, 1500);
}

// Export all rendering functions globally
if (typeof window !== 'undefined') {
    window.renderHomePage = renderHomePage;
    window.renderTeacherLoginPage = renderTeacherLoginPage;
    window.renderTeacherRegistrationPage = renderTeacherRegistrationPage;
    window.renderExamOfficeLoginPage = renderExamOfficeLoginPage;
    window.renderExamOfficeRegisterPage = renderExamOfficeRegisterPage;
    window.renderExamOfficeDashboard = renderExamOfficeDashboard;
    window.renderTeacherDashboard = renderTeacherDashboard;
    window.renderCreateExamPage = renderCreateExamPage;
    window.renderStudentInfoForm = renderStudentInfoForm;
    window.renderStudentDashboard = renderStudentDashboard;
    window.renderExamInterface = renderExamInterface;
    window.renderViewResultsPage = renderViewResultsPage;
    window.renderExamOfficeResultsPage = renderExamOfficeResultsPage;
    window.renderExamOfficeUploadPage = renderExamOfficeUploadPage;
    window.renderStudentResultModal = renderStudentResultModal;
    window.renderDetailedAnswers = renderDetailedAnswers;
    window.renderFilterModal = renderFilterModal;
    window.checkAnswerCorrect = checkAnswerCorrect;
    window.formatTime = formatTime;
    window.isMobile = isMobile;
    window.isValidImageSrc = isValidImageSrc;

    // Additional functions used in onclick handlers
    window.showClassExams = showClassExams;
    window.closeExamOfficeModal = closeExamOfficeModal;
    window.toggleExamOfficeSidebar = toggleExamOfficeSidebar;

    // Exam Office Upload functions
    window.handleDragOver = handleDragOver;
    window.handleDragLeave = handleDragLeave;
    window.handleDrop = handleDrop;
    window.handleExamOfficeFileSelect = handleExamOfficeFileSelect;
    window.processExamUpload = processExamUpload;
    window.clearFileList = clearFileList;
}