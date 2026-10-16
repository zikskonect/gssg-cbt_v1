// teacher.render.js - Teacher Render Functions
// Renders teacher pages (login, register, dashboard, create exam)

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

function renderTeacherDashboard(state) {
    const userName = state.user ? state.user.name : 'User';
    const userPhone = state.user ? (state.user.phone_number || 'N/A') : 'N/A';
    const userInitial = userName.charAt(0).toUpperCase();
    
    const totalExams = state.availableExams.length;
    const totalQuestions = state.availableExams.reduce((sum, exam) => sum + exam.questions.length, 0);

    const examListHtml = state.availableExams.length > 0 ? state.availableExams.map(exam => {
        const statusLabel = typeof getExamStatusLabel === 'function' ? getExamStatusLabel(exam) : 'available';
        let statusBadge = '';
        if (statusLabel === 'upcoming') {
            statusBadge = `<span class="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-semibold">Upcoming</span>`;
        } else if (statusLabel === 'available') {
            statusBadge = `<span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">Available</span>`;
        } else if (statusLabel === 'closed') {
            statusBadge = `<span class="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-semibold">Closed</span>`;
        }
        
        return `
        <div class="exam-card bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-t-4 border-[#B80236] group relative" data-exam-id="${exam.exam_id}">
            <!-- Checkbox for bulk selection -->
            <div class="absolute top-3 right-3 z-20">
                <label class="flex items-center cursor-pointer">
                    <input type="checkbox" 
                           class="exam-checkbox w-5 h-5 text-[#B80236] rounded focus:ring-2 focus:ring-[#B80236] cursor-pointer bg-white/90 shadow" 
                           data-exam-id="${exam.exam_id}"
                           onchange="handleExamCheckboxChange(this)">
                </label>
            </div>
            
            <div class="bg-gradient-to-r from-[#B80236] to-[#900028] p-4">
                <div class="flex justify-between items-start">
                    <h3 class="font-bold text-white text-lg truncate pr-8" title="${exam.subject}">${exam.subject}</h3>
                    ${statusBadge}
                </div>
                <p class="text-pink-100 text-sm truncate" title="${exam.exam_id}">${exam.exam_id}</p>
            </div>
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
                    ${exam.scheduledDate ? `
                        <div class="flex items-center gap-2 text-gray-500">
                            <i data-lucide="calendar" class="w-4 h-4 flex-shrink-0"></i>
                            <span class="text-xs">Scheduled: ${new Date(exam.scheduledDate).toLocaleDateString()}</span>
                        </div>
                    ` : ''}
                    ${exam.created_by ? `
                        <div class="flex items-center gap-2 text-gray-500">
                            <i data-lucide="user" class="w-4 h-4 flex-shrink-0"></i>
                            <span class="text-xs truncate" title="${exam.created_by}">${exam.created_by}</span>
                        </div>
                    ` : ''}
                </div>
                
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
    `}).join('') : '<div class="col-span-3 text-center py-12"><i data-lucide="inbox" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i><p class="text-gray-500 text-lg">No exams available. Create one to get started!</p></div>';

    return `
        <style>
            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-track { background: #f1f1f1; }
            ::-webkit-scrollbar-thumb { background: #B80236; border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: #900028; }
            .card-hover:hover { transform: translateY(-4px); }
            
            /* Selected exam card highlight */
            .exam-card.selected {
                box-shadow: 0 0 0 3px #B80236, 0 10px 25px -5px rgba(184, 2, 54, 0.3) !important;
                border-color: #B80236 !important;
                transform: translateY(-2px);
            }
        </style>
        
        <div class="flex h-screen overflow-hidden bg-gray-50">
            <!-- Overlay for mobile -->
            <div id="sidebarOverlay" class="sidebar-overlay" onclick="closeTeacherSidebar()"></div>
            
            <!-- Sidebar -->
            <aside id="teacherSidebar" class="sidebar-transition bg-gradient-to-b from-[#B80236] to-[#900028] text-white w-64 flex-shrink-0 shadow-2xl fixed md:relative h-full z-50 overflow-y-auto sidebar-hidden md:sidebar-visible">
                <div class="flex flex-col h-full">
                    <button onclick="closeTeacherSidebar()" 
                            class="md:hidden absolute top-3 right-3 text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors z-10">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                    
                    <div class="p-6 border-b border-white/20">
                        <div class="flex items-center gap-3">
                            <div class="bg-white/20 p-2 rounded-lg">
                                <i data-lucide="graduation-cap" class="w-8 h-8"></i>
                            </div>
                            <div>
                                <h1 class="text-xl font-bold">${window.SCHOOL_CONFIG?.schoolShortName || 'GSSS'} T/M CBT</h1>
                                <p class="text-xs text-pink-200">Teacher Portal</p>
                            </div>
                        </div>
                    </div>

                    <div class="p-6 border-b border-white/20 bg-white/10">
                        <div class="flex items-center gap-3">
                            <div class="bg-white text-[#B80236] w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                                <span>${userInitial}</span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="font-semibold truncate">${userName}</p>
                                <p class="text-xs text-pink-200 truncate">${userPhone}</p>
                            </div>
                        </div>
                    </div>

                    <nav class="flex-1 py-4 overflow-y-auto">
                        <ul class="space-y-1 px-3">
                            <li>
                                <a href="#" onclick="setPageAndCloseTeacherSidebar('dashboard')" class="dashboard-menu-item menu-item-active flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-page="dashboard">
                                    <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
                                    <span class="font-medium">Dashboard</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" onclick="setPageAndCloseTeacherSidebar('create-exam')" class="dashboard-menu-item flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-page="create-exam">
                                    <i data-lucide="plus-circle" class="w-5 h-5"></i>
                                    <span class="font-medium">Create Exam</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" onclick="handleTeacherImportClick(event)" class="dashboard-menu-item flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-page="import">
                                    <i data-lucide="upload" class="w-5 h-5"></i>
                                    <span class="font-medium">Import Exam</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" onclick="setPageAndCloseTeacherSidebar('view-results')" class="dashboard-menu-item flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-page="view-results">
                                    <i data-lucide="bar-chart-2" class="w-5 h-5"></i>
                                    <span class="font-medium">View Results</span>
                                </a>
                            </li>
                            <div class="border-t border-white/20 mt-2 pt-2">
                            <li>
                                <button onclick="closeTeacherSidebar(); logout();" class="w-full dashboard-menu-item flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-left">
                                    <i data-lucide="log-out" class="w-5 h-5"></i>
                                    <span class="font-medium">Logout</span>
                                </button>
                            </li>
                            </div>
                        </ul>
                    </nav>
                </div>
            </aside>

            <!-- Main Content -->
            <div class="flex-1 flex flex-col overflow-hidden w-full">
                <header class="bg-white shadow-sm border-b border-gray-200">
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
                                <h2 class="text-lg md:text-2xl font-bold text-gray-800">Dashboard</h2>
                                <p class="text-xs md:text-sm text-gray-500 hidden sm:block">Overview of your exams and activities</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 md:gap-3">
                            <button class="relative p-1.5 md:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <i data-lucide="bell" class="w-5 h-5 md:w-6 md:h-6"></i>
                                <span class="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                            <button class="p-1.5 md:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block">
                                <i data-lucide="help-circle" class="w-5 h-5 md:w-6 md:h-6"></i>
                            </button>
                        </div>
                    </div>
                </header>

                <main class="flex-1 overflow-y-auto p-4 md:p-6">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 md:p-6 text-white card-hover transition-all">
                            <div class="flex items-center justify-between mb-3 md:mb-4">
                                <div class="bg-white/20 p-2 md:p-3 rounded-lg">
                                    <i data-lucide="file-text" class="w-6 h-6 md:w-8 md:h-8"></i>
                                </div>
                                <span class="text-2xl md:text-3xl font-bold">${totalExams}</span>
                            </div>
                            <p class="text-blue-100 text-xs md:text-sm font-medium">Total Exams</p>
                        </div>

                        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-4 md:p-6 text-white card-hover transition-all">
                            <div class="flex items-center justify-between mb-3 md:mb-4">
                                <div class="bg-white/20 p-2 md:p-3 rounded-lg">
                                    <i data-lucide="help-circle" class="w-6 h-6 md:w-8 md:h-8"></i>
                                </div>
                                <span class="text-2xl md:text-3xl font-bold">${totalQuestions}</span>
                            </div>
                            <p class="text-green-100 text-xs md:text-sm font-medium">Total Questions</p>
                        </div>
                    </div>

                    ${state.availableExams.length > 0 ? `
                        <div class="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-3 md:p-4 mb-4 md:mb-6 border border-purple-200">
                            <div class="flex flex-col sm:flex-row justify-between items-center gap-3">
                                <div class="flex items-center gap-3">
                                    <div class="bg-purple-600 p-2 rounded-lg hidden sm:block">
                                        <i data-lucide="package" class="w-5 h-5 md:w-6 md:h-6 text-white"></i>
                                    </div>
                                    <div>
                                        <p class="font-semibold text-gray-800 text-sm md:text-base">Bulk Export</p>
                                        <p class="text-xs text-gray-600">Export all ${state.availableExams.length} exam(s) at once</p>
                                    </div>
                                </div>
                                <button onclick="exportAllExams()" 
                                        class="bg-purple-600 hover:bg-purple-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg transition-colors flex items-center gap-2 font-semibold shadow-md hover:shadow-lg text-sm md:text-base w-full sm:w-auto justify-center">
                                    <i data-lucide="download" class="w-4 h-4 md:w-5 md:h-5"></i>
                                    <span>Export All</span>
                                </button>
                            </div>
                        </div>
                    ` : ''}

                    <div class="bg-white rounded-xl shadow-lg p-4 md:p-6">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 md:mb-6">
                            <h2 class="text-xl md:text-2xl font-bold text-gray-800">My Exams</h2>
                            <span class="px-3 py-1 md:px-4 md:py-2 bg-[#B80236] text-white rounded-lg font-semibold text-sm md:text-base">
                                ${state.availableExams.length} Total
                            </span>
                        </div>

                        ${state.availableExams.length > 0 ? `
                            <!-- Bulk Actions Toolbar for Exams -->
                            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <label class="flex items-center gap-2 cursor-pointer select-none">
                                    <input type="checkbox" 
                                           id="select-all-exams" 
                                           class="w-5 h-5 text-[#B80236] rounded focus:ring-2 focus:ring-[#B80236] cursor-pointer"
                                           onchange="handleSelectAllExams(this)">
                                    <span class="text-sm font-semibold text-gray-700">Select All</span>
                                    <span id="selected-count-badge" class="hidden text-xs font-bold bg-[#B80236] text-white px-2 py-0.5 rounded-full">
                                        0 selected
                                    </span>
                                </label>
                                
                                <button id="bulk-delete-btn" 
                                        onclick="deleteSelectedExams()" 
                                        disabled
                                        class="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    <span>Delete Selected</span>
                                </button>
                            </div>
                        ` : ''}
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            ${examListHtml}
                        </div>
                    </div>
                </main>
            </div>

            <!-- Hidden file input for imports — must be in DOM before user clicks -->
        <input type="file"
            id="teacher-import-input"
            accept=".csv,text/csv,application/csv"
            style="display:none;"
            onchange="handleTeacherImportFile(event)">
            
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

function renderCreateExamPage(state) {
    // Get saved exam if editing
    const savedExam = state.editingExamId ? state.availableExams.find(ex => ex.exam_id === state.editingExamId) : null;
    
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
    const currentCount = exam?.questions?.length || 0;

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
        `<p class="text-gray-500 text-center py-8">No questions added yet (0/${maxQuestions})</p>` :
        `
        <!-- Question Progress -->
        <div class="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <span class="text-sm text-gray-600">${currentCount} of ${maxQuestions} questions added</span>
            <div class="flex items-center gap-3">
                <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full ${assessmentType === 'CA' ? 'bg-emerald-500' : 'bg-rose-500'} rounded-full transition-all duration-300" 
                         style="width: ${(currentCount / maxQuestions) * 100}%"></div>
                </div>
                <span class="text-xs font-bold ${assessmentType === 'CA' ? 'text-emerald-600' : 'text-rose-600'}">
                    ${Math.round((currentCount / maxQuestions) * 100)}%
                </span>
            </div>
        </div>

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

        <!-- Questions Grid WITH CHECKBOXES -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${questionsToDisplay.map((q, idx) => {
                const actualIndex = startIndex + idx;
                const isImageValid = isValidImageSrc(q.image);
                return `
                    <div class="question-card border-2 border-gray-200 rounded-lg p-4 bg-gray-50 hover:border-[#B80236] transition-colors relative" data-question-id="${q.id}">
                        <!-- Checkbox for bulk selection -->
                        <div class="absolute top-3 right-3 z-10">
                            <label class="flex items-center cursor-pointer">
                                <input type="checkbox" 
                                       class="question-checkbox w-5 h-5 text-[#B80236] rounded focus:ring-2 focus:ring-[#B80236] cursor-pointer bg-white shadow" 
                                       data-question-id="${q.id}"
                                       onchange="handleQuestionCheckboxChange(this)">
                            </label>
                        </div>
                        
                        <div class="flex justify-between items-start gap-2">
                            <div class="flex-1 min-w-0 pr-8">
                                <p class="font-semibold text-gray-800 text-sm mb-2">${actualIndex + 1}. ${q.question}</p>
                                
                                ${isImageValid ? `
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
                            <div class="flex flex-col gap-1 flex-shrink-0 mt-8">
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

        <style>
            /* Highlight for selected question cards */
            .question-card.selected {
                box-shadow: 0 0 0 3px #B80236, 0 8px 20px -5px rgba(184, 2, 54, 0.3) !important;
                border-color: #B80236 !important;
                background: #fef2f5 !important;
            }
        </style>
        `;

    return `
        <div class="min-h-screen bg-gray-50">
            <!-- Header with assessment type color -->
            <div class="${assessmentType === 'CA' ? 'bg-emerald-700' : 'bg-[#B80236]'} text-white p-4 md:p-6 shadow-lg">
                <div class="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 class="text-2xl md:text-3xl font-bold flex items-center gap-3">
                            <i data-lucide="${assessmentType === 'CA' ? 'clipboard-check' : 'graduation-cap'}" class="w-7 h-7"></i>
                            ${state.editingExamId ? 'Edit' : 'Create'} ${assessmentType === 'CA' ? 'CA' : 'Exam'}
                            <span class="text-sm font-normal ${assessmentType === 'CA' ? 'bg-emerald-600' : 'bg-[#900028]'} px-3 py-1 rounded-full">
                                ${assessmentType === 'CA' ? 'Max 20 Qs' : 'Max 100 Qs'}
                            </span>
                        </h1>
                        <p class="text-white/80 text-sm mt-1">${assessmentType === 'CA' ? 'Continuous Assessment' : 'Examination'} - ${currentCount}/${maxQuestions} questions</p>
                    </div>
                    <button onclick="setPage('teacher')" class="${assessmentType === 'CA' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#900028] hover:bg-[#700020]'} px-4 md:px-6 py-2 rounded-lg transition-colors text-sm md:text-base">
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

                        <!-- ASSESSMENT TYPE TOGGLE -->
                        <div class="border-t border-gray-200 pt-6">
                            <label class="block text-sm font-semibold text-gray-700 mb-3">Assessment Type</label>
                            <div class="flex flex-wrap gap-3">
                                <button type="button"
                                        id="ca-toggle-btn"
                                        onclick="toggleAssessmentType('CA')"
                                        class="flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold text-sm transition-all border-2 ${caActive ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}">
                                    <i data-lucide="clipboard-check" class="w-4 h-4"></i>
                                    CA
                                    <span class="text-xs font-normal text-gray-400">(20 Qs)</span>
                                </button>
                                <button type="button"
                                        id="exam-toggle-btn"
                                        onclick="toggleAssessmentType('EXAM')"
                                        class="flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold text-sm transition-all border-2 ${examActive ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}">
                                    <i data-lucide="graduation-cap" class="w-4 h-4"></i>
                                    Exam
                                    <span class="text-xs font-normal text-gray-400">(100 Qs)</span>
                                </button>
                            </div>
                            <div class="mt-2 flex items-center gap-2">
                                <span class="text-xs text-gray-500">Questions added:</span>
                                <span class="text-xs font-bold ${assessmentType === 'CA' ? 'text-emerald-600' : 'text-rose-600'}">${currentCount}/${maxQuestions}</span>
                                <div class="flex-1 max-w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden ml-2">
                                    <div class="h-full ${assessmentType === 'CA' ? 'bg-emerald-500' : 'bg-rose-500'} rounded-full transition-all duration-300" 
                                         style="width: ${(currentCount / maxQuestions) * 100}%"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Subject and Class -->
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
                                <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
                                    <h3 class="text-2xl font-bold text-gray-800">Add Question</h3>
                                    <div class="flex items-center gap-3">
                                        <button type="button"
                                                id="symbol-toggle-btn"
                                                onclick="toggleGlobalSymbols()"
                                                class="bg-amber-100 hover:bg-amber-200 border-2 border-amber-400 text-amber-800 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 font-bold text-sm"
                                                title="Insert symbol into last-clicked field">
                                            <span class="text-base">∑</span>
                                            <span>Symbols</span>
                                        </button>
                                        <span class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">${exam.questions.length}/${maxQuestions}</span>
                                    </div>
                                </div>

                                
                               <!-- Global symbol palette (hidden by default, sticky when visible) -->
                                <div id="global-symbol-palette" 
                                    class="hidden mb-4 bg-white border-2 border-amber-300 rounded-lg p-3 shadow-xl"
                                    style="position: sticky; top: 8px; z-index: 40; max-height: 60vh; overflow-y: auto;">
                                    <div class="flex items-center justify-between mb-2 sticky top-0 bg-white pb-1">
                                        <p id="symbol-target-label" class="text-xs font-semibold text-gray-400">
                                            Click into a field first, then pick a symbol
                                        </p>
                                        <button type="button" onclick="closeGlobalSymbols()" class="text-gray-400 hover:text-gray-600 text-xs px-2 py-0.5 rounded hover:bg-gray-100">✕ Close</button>
                                    </div>
                                    <div id="global-symbol-groups"></div>
                                </div>

                            <!-- Global symbol palette (hidden by default) -->
                            <div id="global-symbol-palette" class="hidden mb-4 bg-white border-2 border-amber-300 rounded-lg p-3 shadow-lg">
                                <div class="flex items-center justify-between mb-2">
                                    <p class="text-xs font-semibold text-amber-800">
                                        <span id="symbol-target-label">Click into a field first, then pick a symbol</span>
                                    </p>
                                    <button type="button" onclick="closeGlobalSymbols()" class="text-gray-400 hover:text-gray-600 text-xs px-2">✕</button>
                                </div>
                                <div id="global-symbol-groups"></div>
                            </div>
                            
                            

                            <!-- Question Text -->
<div class="mb-4">
    <label class="block text-sm font-semibold text-gray-700 mb-2">Question Text</label>
    <textarea id="question-text" rows="3" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B80236] focus:border-transparent transition-all resize-none" placeholder="Enter your question here..."></textarea>
</div>

<!-- Question Type + Image (side by side) -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
    <!-- Question Type -->
    <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">Question Type</label>
        <select id="question-type" onchange="toggleQuestionOptions()" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B80236] focus:border-transparent transition-all">
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True/False</option>
        </select>
    </div>

    <!-- Question Image Upload (compact) -->
    <div>
        <label class="block text-sm font-semibold text-gray-700 mb-2">
            Question Image <span class="text-xs font-normal text-gray-500">(Optional)</span>
        </label>
        <input type="file" id="question-image-input" accept="image/*" onchange="handleQuestionImageUpload(event)" class="hidden" />
        <div class="flex gap-2">
            <button type="button" onclick="triggerImageUpload()"
                    class="flex-1 bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 text-blue-700 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold text-sm">
                <i data-lucide="image-plus" class="w-4 h-4"></i>
                Upload
            </button>
            <div class="flex-1 flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2 py-2 rounded-lg border border-gray-300 justify-center">
                <i data-lucide="clipboard" class="w-3.5 h-3.5"></i>
                <span><kbd class="px-1 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono">Ctrl+V</kbd></span>
            </div>
        </div>
        <div id="image-preview-container" class="mt-2"></div>
    </div>
</div>

<!-- Multiple Choice Options (2-column grid on desktop) -->
<div id="options-container" class="mb-4">
    <label class="block text-sm font-semibold text-gray-700 mb-2">Options & Correct Answer</label>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${['A', 'B', 'C', 'D'].map(letter => `
        <div class="option-row flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
            <span class="letter-badge w-7 h-7 bg-[#B80236] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">${letter}</span>
            <input type="text"
                    id="option-${letter.toLowerCase()}"
                    placeholder="Option ${letter}"
                    class="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B80236] focus:border-transparent transition-all text-sm" />
            <label class="flex items-center gap-1 cursor-pointer flex-shrink-0">
                <input type="radio"
                        name="correct-answer"
                        value="${letter}"
                        class="w-4 h-4 text-[#B80236] focus:ring-[#B80236]" />
                <span class="text-[10px] font-medium text-gray-600 whitespace-nowrap">Correct</span>
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

                        <!-- Questions List with Bulk Actions -->
                        <div class="border-t border-gray-200 pt-8">
                            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                                <h3 class="text-2xl font-bold text-gray-800">Current Questions</h3>
                                <span class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">${exam.questions.length}/${maxQuestions}</span>
                            </div>

                            ${totalQuestions > 0 ? `
                                <!-- Bulk Actions Toolbar for Questions -->
                                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <label class="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox" 
                                               id="select-all-questions" 
                                               class="w-5 h-5 text-[#B80236] rounded focus:ring-2 focus:ring-[#B80236] cursor-pointer"
                                               onchange="handleSelectAllQuestions(this)">
                                        <span class="text-sm font-semibold text-gray-700">Select All on this page</span>
                                        <span id="selected-questions-badge" class="hidden text-xs font-bold bg-[#B80236] text-white px-2 py-0.5 rounded-full">
                                            0 selected
                                        </span>
                                    </label>
                                    
                                    <button id="bulk-delete-questions-btn" 
                                            onclick="deleteSelectedQuestions()" 
                                            disabled
                                            class="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm">
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
    const userName = state.user ? state.user.name : 'Teacher';
    const results = state.allResults || [];

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

    const resultsList = results.length === 0
        ? `<tr><td colspan="8" class="px-6 py-12 text-center text-gray-500 text-lg">No results yet. Students haven't taken any exams.</td></tr>`
        : results.map((result, index) => {
            const totalQuestions = result.exam_details?.questions?.length || 1;
            const percentage = Math.round((result.score / totalQuestions) * 100);
            const { grade, color } = getGrade(percentage);

            return `
                <tr class="hover:bg-gray-50 transition-colors border-b">
                    <td class="px-4 py-4 text-sm font-medium text-gray-900">${index + 1}</td>
                    <td class="px-4 py-4 text-sm font-semibold text-gray-800">${result.student_name || 'Anonymous'}</td>
                    <td class="px-4 py-4 text-sm text-gray-600">${result.student_class || ''}${result.student_arms || ''}</td>
                    <td class="px-4 py-4 text-sm text-gray-700 font-medium">${result.exam_subject || result.exam_id}</td>
                    <td class="px-4 py-4 text-sm font-bold text-gray-800">${result.score}<span class="text-gray-400">/${totalQuestions}</span></td>
                    <td class="px-4 py-4 text-lg font-bold text-gray-900">${percentage}%</td>
                    <td class="px-4 py-4">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${color}">
                            ${grade}
                        </span>
                    </td>
                    <td class="px-4 py-4 text-xs text-gray-500">${formatDate(result.submitted_at)}</td>
                </tr>
            `;
        }).join('');

    return `
        <div class="flex h-screen overflow-hidden bg-gray-50">
            <div id="sidebarOverlay" class="sidebar-overlay" onclick="closeTeacherSidebar()"></div>

            <aside id="teacherSidebar" class="sidebar-transition bg-gradient-to-b from-[#B80236] to-[#900028] text-white w-64 flex-shrink-0 shadow-2xl fixed md:relative h-full z-50 overflow-y-auto sidebar-hidden md:sidebar-visible">
                <div class="flex flex-col h-full">
                    <button onclick="closeTeacherSidebar()"
                            class="md:hidden absolute top-3 right-3 text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors z-10">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>

                    <div class="p-6 border-b border-white/20">
                        <div class="flex items-center gap-3">
                            <div class="bg-white/20 p-2 rounded-lg">
                                <i data-lucide="graduation-cap" class="w-8 h-8"></i>
                            </div>
                            <div>
                                <h1 class="text-xl font-bold">${window.SCHOOL_CONFIG?.schoolShortName || 'GSSS'} T/M CBT</h1>
                                <p class="text-xs text-pink-200">Teacher Portal</p>
                            </div>
                        </div>
                    </div>

                                        <nav class="flex-1 py-4">
                        <ul class="space-y-1 px-3">
                            <li>
                                <a href="#" onclick="setPageAndCloseTeacherSidebar('teacher')" class="dashboard-menu-item flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-page="dashboard">
                                    <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
                                    <span class="font-medium">Dashboard</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" onclick="setPageAndCloseTeacherSidebar('create-exam')" class="dashboard-menu-item flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-page="create-exam">
                                    <i data-lucide="plus-circle" class="w-5 h-5"></i>
                                    <span class="font-medium">Create Exam</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" onclick="handleTeacherImportClick(event)" class="dashboard-menu-item flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-page="import">
                                    <i data-lucide="upload" class="w-5 h-5"></i>
                                    <span class="font-medium">Import Exam</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" onclick="setPageAndCloseTeacherSidebar('view-results')" class="dashboard-menu-item menu-item-active flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors" data-page="view-results">
                                    <i data-lucide="bar-chart-2" class="w-5 h-5"></i>
                                    <span class="font-medium">View Results</span>
                                </a>
                            </li>
                            <div class="border-t border-white/20 mt-2 pt-2">
                                <li>
                                    <button onclick="closeTeacherSidebar(); logout();" class="w-full dashboard-menu-item flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-left">
                                        <i data-lucide="log-out" class="w-5 h-5"></i>
                                        <span class="font-medium">Logout</span>
                                    </button>
                                </li>
                            </div>
                        </ul>
                    </nav>
                </div>
            </aside>

            <div class="flex-1 flex flex-col overflow-hidden w-full">
                <header class="bg-white shadow-sm border-b border-gray-200">
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
                                <h2 class="text-lg md:text-2xl font-bold text-gray-800">Results</h2>
                                <p class="text-xs md:text-sm text-gray-500 hidden sm:block">All student results across all exams</p>
                            </div>
                        </div>
                        <span class="px-4 py-2 bg-[#B80236] text-white rounded-lg font-semibold">
                            ${results.length} Record(s)
                        </span>
                    </div>
                </header>

                <main class="flex-1 overflow-y-auto p-4 md:p-6">
                    <div class="bg-white rounded-xl shadow-lg overflow-hidden">
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


// ========================================
// EXPORTS
// ========================================

window.renderTeacherRegistrationPage = renderTeacherRegistrationPage;
window.renderTeacherLoginPage = renderTeacherLoginPage;
window.renderTeacherDashboard = renderTeacherDashboard;
window.renderCreateExamPage = renderCreateExamPage;
window.updateDashboardMenu = updateDashboardMenu;
window.renderTeacherResultsPage = renderTeacherResultsPage;