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
    const avgDuration = totalExams > 0 ? Math.round(state.availableExams.reduce((sum, exam) => sum + exam.duration, 0) / totalExams) : 0;

    const examListHtml = state.availableExams.length > 0 ? state.availableExams.map(exam => `
        <div class="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-t-4 border-[#B80236] group">
            <div class="bg-gradient-to-r from-[#B80236] to-[#900028] p-4">
                <h3 class="font-bold text-white text-lg truncate" title="${exam.subject}">${exam.subject}</h3>
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
    `).join('') : '<div class="col-span-3 text-center py-12"><i data-lucide="inbox" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i><p class="text-gray-500 text-lg">No exams available. Create one to get started!</p></div>';

    return `
        <style>
            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-track { background: #f1f1f1; }
            ::-webkit-scrollbar-thumb { background: #B80236; border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: #900028; }
            .sidebar-transition { transition: transform 0.3s ease-in-out; }
            @media (max-width: 768px) { .sidebar-hidden { transform: translateX(-100%); } }
            .menu-item-active { background: linear-gradient(to right, rgba(255,255,255,0.2), rgba(255,255,255,0.1)); border-left: 4px solid #fff; }
            .card-hover:hover { transform: translateY(-4px); }
        </style>

        <div class="flex h-screen overflow-hidden bg-gray-50">
            <aside id="teacherSidebar" class="sidebar-transition bg-gradient-to-b from-[#B80236] to-[#900028] text-white w-64 flex-shrink-0 shadow-2xl fixed md:relative h-full z-50 overflow-y-auto">
                <div class="flex flex-col h-full">
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

            <div id="sidebarOverlay" class="hidden md:hidden fixed inset-0 bg-black/50 z-40" onclick="toggleTeacherSidebar()"></div>

            <div class="flex-1 flex flex-col overflow-hidden">
                <header class="bg-white shadow-sm border-b border-gray-200">
                    <div class="flex items-center justify-between px-6 py-4">
                        <div class="flex items-center gap-4">
                            <button onclick="toggleTeacherSidebar()" class="md:hidden text-gray-600 hover:text-gray-900">
                                <i data-lucide="menu" class="w-6 h-6"></i>
                            </button>
                            <div>
                                <h2 class="text-2xl font-bold text-gray-800">Dashboard</h2>
                                <p class="text-sm text-gray-500">Overview of your exams and activities</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <button class="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <i data-lucide="bell" class="w-6 h-6"></i>
                                <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                            <button class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <i data-lucide="help-circle" class="w-6 h-6"></i>
                            </button>
                        </div>
                    </div>
                </header>

                <main class="flex-1 overflow-y-auto p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white card-hover transition-all">
                            <div class="flex items-center justify-between mb-4">
                                <div class="bg-white/20 p-3 rounded-lg">
                                    <i data-lucide="file-text" class="w-8 h-8"></i>
                                </div>
                                <span class="text-3xl font-bold">${totalExams}</span>
                            </div>
                            <p class="text-blue-100 text-sm font-medium">Total Exams</p>
                        </div>

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

                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-2xl font-bold text-gray-800">My Exams</h2>
                            <span class="px-4 py-2 bg-[#B80236] text-white rounded-lg font-semibold">
                                ${state.availableExams.length} Total
                            </span>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            ${examListHtml}
                        </div>
                    </div>
                </main>
            </div>
        </div>

        <script>
            function toggleTeacherSidebar() {
                const sidebar = document.getElementById('teacherSidebar');
                const overlay = document.getElementById('sidebarOverlay');
                
                sidebar.classList.toggle('sidebar-hidden');
                overlay.classList.toggle('hidden');
            }

            function updateActiveMenuItem(page) {
                document.querySelectorAll('.dashboard-menu-item').forEach(item => {
                    item.classList.remove('menu-item-active');
                    if (item.dataset.page === page) {
                        item.classList.add('menu-item-active');
                    }
                });
            }

            setTimeout(() => {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 100);
        </script>
    `;
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

    const questionsPerPage = 20;
    const currentPage = state.currentQuestionPage || 1;
    const totalQuestions = (exam?.questions || []).length;
    const totalPages = Math.ceil(totalQuestions / questionsPerPage);

    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    const questionsToDisplay = (exam?.questions || []).slice(startIndex, endIndex);

    const questionsList = totalQuestions === 0 ? 
        '<p class="text-gray-500 text-center py-8">No questions added yet</p>' :
        `
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

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${questionsToDisplay.map((q, idx) => {
                const actualIndex = startIndex + idx;
                const isImageValid = isValidImageSrc(q.image);
                return `
                    <div class="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 hover:border-[#B80236] transition-colors">
                        <div class="flex justify-between items-start gap-2">
                            <div class="flex-1 min-w-0">
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
            <div class="bg-[#B80236] text-white p-4 md:p-6 shadow-lg">
                <div class="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 class="text-2xl md:text-3xl font-bold">${state.editingExamId ? 'Edit Exam' : 'Create New Exam'}</h1>
                    <button onclick="setPage('teacher')" class="bg-[#900028] hover:bg-[#700020] px-4 md:px-6 py-2 rounded-lg transition-colors text-sm md:text-base">
                        ← Back to Dashboard
                    </button>
                </div>
            </div>

            <div class="max-w-4xl mx-auto p-4 md:p-6">
                <div class="bg-white rounded-xl shadow-lg p-6 md:p-8">
                    <form id="create-exam-form" onsubmit="saveExam(event)" class="space-y-6">
                        
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

                        <div class="border-t border-gray-200 pt-8">
                            <div class="flex items-center justify-between mb-6">
                                <h3 class="text-2xl font-bold text-gray-800">Add Question</h3>
                                <span class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Questions: ${exam.questions.length}</span>
                            </div>
                            
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
                                    
                                    <div class="mt-6 pt-6 border-t-2 border-gray-300">
                                        <h4 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                                            Custom Subscript/Superscript
                                        </h4>
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <div class="mb-6">
                                <label class="block text-sm font-semibold text-gray-700 mb-3">Question Text</label>
                                <textarea id="question-text" rows="4" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B80236] focus:border-transparent transition-all resize-none" placeholder="Enter your question here... You can use the symbols above for mathematical expressions."></textarea>
                            </div>
                                                       
                            <div class="mb-6">
                                <label class="block text-sm font-semibold text-gray-700 mb-3">
                                    Question Image/Diagram (Optional)
                                    <span class="text-xs font-normal text-gray-500 ml-2">For Biology diagrams, charts, etc.</span>
                                </label>
                                
                                <input type="file" 
                                    id="question-image-input" 
                                    accept="image/*" 
                                    onchange="handleQuestionImageUpload(event)"
                                    class="hidden" />
                                
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
                                
                                <div id="image-preview-container" class="mt-4"></div>
                                
                                <p class="text-xs text-gray-500 mt-2">
                                    <i data-lucide="info" class="w-3 h-3 inline"></i>
                                    Supported: PNG, JPG, GIF • Max size: 5MB • You can paste from clipboard
                                </p>
                            </div>

                            <div class="mb-6">
                                <label class="block text-sm font-semibold text-gray-700 mb-3">Question Type</label>
                                <select id="question-type" onchange="toggleQuestionOptions()" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B80236] focus:border-transparent transition-all">
                                    <option value="multiple_choice">Multiple Choice</option>
                                    <option value="true_false">True/False</option>
                                </select>
                            </div>

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

                            <div class="flex justify-center">
                                <button type="button" onclick="addQuestion()" class="bg-[#B80236] text-white px-8 py-3 rounded-lg hover:bg-[#900028] transition-colors font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                                    <i data-lucide="plus-circle" class="w-5 h-5"></i>
                                    Add Question to Exam
                                </button>
                            </div>
                        </div>

                        <div class="border-t border-gray-200 pt-8">
                            <div class="flex items-center justify-between mb-6">
                                <h3 class="text-2xl font-bold text-gray-800">Current Questions</h3>
                                <span class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">${exam.questions.length} questions</span>
                            </div>
                            <div id="questions-list" class="space-y-4">
                                ${questionsList}
                            </div>                            
                        </div>
                        
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

// Export to global scope
window.renderTeacherRegistrationPage = renderTeacherRegistrationPage;
window.renderTeacherLoginPage = renderTeacherLoginPage;
window.renderTeacherDashboard = renderTeacherDashboard;
window.renderCreateExamPage = renderCreateExamPage;
window.updateDashboardMenu = updateDashboardMenu;