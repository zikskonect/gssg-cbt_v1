// app.js

// Add this at the very top of app.js
console.log('🚀 app.js loaded');

// Verify Electron API is available
console.log('🔍 Checking electronAPI...');
console.log('electronAPI available:', !!window.electronAPI);
console.log('electronAPI.closeApp:', typeof window.electronAPI?.closeApp);
console.log('electronAPI.minimizeApp:', typeof window.electronAPI?.minimizeApp);
if (window.electronAPI) {
    console.log('✅ electronAPI is available and ready');
} else {
    console.error('❌ electronAPI NOT FOUND - preload.js may not have loaded');
}

// Check if required functions are available
function checkDependencies() {
    const required = ['initDB', 'renderHomePage', 'setPage'];
    const missing = required.filter(func => typeof window[func] === 'undefined');
    
    if (missing.length > 0) {
        console.error('❌ Missing dependencies:', missing);
        return false;
    }
    
    console.log('✅ All dependencies loaded');
    return true;
}

// Modify your init function to check dependencies
function init() {
    console.log('🚀 Starting initialization...');
    
    if (!checkDependencies()) {
        showErrorPage(new Error('Required components failed to load. Please refresh the page.'));
        return;
    }
    
    updateLoadingStatus('Starting app...');
    
    try {
        // Check if IndexedDB is available
        if (!window.indexedDB) {
            throw new Error('IndexedDB is not supported in this browser/environment');
        }
        
        updateLoadingStatus('Initializing database...');
        console.log('📦 Initializing database...');
        
        // Use promise for initDB
        initDB().then(() => {
            console.log('✅ Database initialized');
            updateLoadingStatus('Loading exams...');
            
            return loadExams();
        }).then(() => {
            console.log('✅ Exams loaded:', state.availableExams.length);
            updateLoadingStatus('Loading results...');
            
            return loadResults();
        }).then(() => {
            console.log('✅ Results loaded:', state.allResults.length);
            updateLoadingStatus('Rendering app...');
            
            // Set up event listeners
            window.addEventListener('beforeunload', () => {
                if (state.currentPage === 'exam' && state.examTimer) {
                    clearInterval(state.examTimer);
                }
            });
            
            console.log('🎨 Rendering app...');
            render();
            console.log('✅ App initialized successfully');
            updateLoadingStatus('Ready!');
            
        }).catch(error => {
            console.error('❌ Initialization error:', error);
            showErrorPage(error);
        });
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showErrorPage(error);
    }
}


// ========== STATE MANAGEMENT ==========
 let state = {
     isAuthenticated: false,
     isTeacher: false,
     isExamOffice: false,
     user: null,
    currentPage: 'home',
    availableExams: [],
    studentInfo: { name: '', class: '', arms: '' },
    selectedExam: null,
    formSubmitted: false,
    examTimer: null,
    timeRemaining: 0,
    editingExamId: null,
    currentExamData: null,
    studentAnswers: {},
    resultFilter: { subject: '', class: '', arms: '' },
    showResultModal: false,
    lastResult: null,
    answersExpanded: false,
    allResults: [],
    currentQuestionIndex: 0,
    shuffleQuestions: false,
    shuffledExam: null,
    showFilterModal: false,
    showAlert: false,
    alertMessage: '',
    alertType: 'error',
    editingQuestionId: null,
    allTeachers: [],
    showTeacherRegisterModal: false,
    currentQuestionPage: 1,
    questionsPerPage: 20,
    recentUploads: []
};

// =======================================================
// ========== GLOBAL FUNCTION DEFINITIONS (START) ==========
// =======================================================


function startExam(examId) {
    const exam = state.availableExams.find(e => e.exam_id === examId);
    if (!exam) {
        showAlert('Exam not found', 'error');
        return;
    }

    // Validate student info exists
    if (!state.studentInfo || !state.studentInfo.name || !state.studentInfo.class) {
        showAlert('Please enter your student information first', 'error');
        setPage('student-info');
        return;
    }
    

    // Validate exam has questions
    if (!exam.questions || exam.questions.length === 0) {
        showAlert('This exam has no questions', 'error');
        return;
    }

    console.log("🚀 Starting exam:", {
        examId: exam.exam_id,
        studentInfo: state.studentInfo,
        questions: exam.questions.length
    });

    // CRITICAL: Set both selectedExam and shuffledExam BEFORE navigating
    state.selectedExam = exam; // Base exam object
    
    // Create shuffled copy
    let shuffledQuestions = JSON.parse(JSON.stringify(exam.questions));
    shuffledQuestions = shuffleArray(shuffledQuestions);
    
    state.shuffledExam = { ...exam, questions: shuffledQuestions };
    
    // Reset exam state
    state.studentAnswers = {};
    state.currentQuestionIndex = 0;
    state.timeRemaining = exam.duration * 60;
    state.formSubmitted = false;
    
    // Clear any existing timer
    if (state.examTimer) {
        clearInterval(state.examTimer);
        state.examTimer = null;
    }
    
    // Start timer with auto-submit safeguard
    let autoSubmitFired = false; // Prevent multiple submit attempts
    state.examTimer = setInterval(() => {
        try {
            // Decrement timer if still running
            if (state.timeRemaining > 0) {
                state.timeRemaining--;
            }

            // Update timer display
            const timerEl = document.getElementById('timer-display');
            if (timerEl) {
                timerEl.textContent = formatTime(state.timeRemaining);
            }

            // CRITICAL: Auto-submit when time runs out (or goes negative as safeguard)
            if (state.timeRemaining <= 0 && !autoSubmitFired) {
                autoSubmitFired = true; // Prevent duplicate submissions
                console.log('⏰ TIME ELAPSED - Auto-submitting exam');
                clearInterval(state.examTimer);
                state.examTimer = null;
                submitExam();
            }
        } catch (err) {
            console.error('❌ Timer error:', err);
            clearInterval(state.examTimer);
            state.examTimer = null;
        }
    }, 1000);
    console.log('✅ Exam timer started:', { duration: exam.duration, seconds: exam.duration * 60 });

    // NOW navigate to exam page
    setPage('exam');
}

// --- UTILITIES ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    // Ensures MM:SS format (e.g., 05:03)
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function calculateScore(exam, answers) {
    if (!exam || !exam.questions || !answers) {
        console.error("calculateScore received invalid data.");
        return { score: 0, total: 0, durationTakenSeconds: 0 };
    }
    let score = 0;
    const durationTakenSeconds = (exam.duration * 60) - (state.timeRemaining || 0);

    console.log("🔍 Starting score calculation:", {
        questionsCount: exam.questions.length,
        answersCount: Object.keys(answers).length,
        answers: answers
    });

    try {
        exam.questions.forEach((q, index) => {
            // Normalize values to avoid runtime errors when answers are missing
            const rawStudentAnswer = answers[q.id];
            const studentAnswer = (rawStudentAnswer == null) ? '' : String(rawStudentAnswer);
            const correctAnswerRaw = q.correct_answer == null ? '' : String(q.correct_answer);

            console.log(`📝 Question ${index + 1} (ID: ${q.id}):`, {
                type: q.type,
                studentAnswer: studentAnswer,
                correctAnswer: correctAnswerRaw,
                isEssay: q.type === 'essay'
            });

            // For multiple choice and true/false questions
            if (q.type === 'multiple_choice' || q.type === 'true_false' || q.type === 'truefalse') {
                if (q.type === 'true_false' || q.type === 'truefalse') {
                    const normalizedStudentAnswer = studentAnswer ? studentAnswer.trim() : '';
                    const normalizedCorrectAnswer = correctAnswerRaw ? correctAnswerRaw.trim() : '';
                    if (normalizedStudentAnswer !== '' && normalizedStudentAnswer.toLowerCase() === normalizedCorrectAnswer.toLowerCase()) {
                        score++;
                        console.log(`✅ Correct! True/False question ${q.id}`);
                    } else {
                        console.log(`❌ Incorrect or unanswered True/False question ${q.id}`);
                    }
                } else {
                    // Multi-select if correct answer contains comma
                    if (correctAnswerRaw.includes(',')) {
                        const studentAnswers = studentAnswer.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).sort().join(',');
                        const correctAnswers = correctAnswerRaw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).sort().join(',');

                        if (studentAnswers !== '' && studentAnswers === correctAnswers) {
                            score++;
                            console.log(`✅ Correct! Multi-select question ${q.id}`);
                        } else {
                            console.log(`❌ Incorrect or unanswered Multi-select question ${q.id}`);
                        }
                    } else {
                        if (studentAnswer.trim() !== '' && studentAnswer.trim().toUpperCase() === correctAnswerRaw.trim().toUpperCase()) {
                            score++;
                            console.log(`✅ Correct! Single answer question ${q.id}`);
                        } else {
                            console.log(`❌ Incorrect or unanswered Single answer question ${q.id}`);
                        }
                    }
                }
            }
        });

    } catch (err) {
        console.error('Error during score calculation:', err);
    }

    console.log(`🎯 Final score: ${score}/${exam.questions.length}`);
    return {
        score: score,
        total: exam.questions.length,
        durationTakenSeconds: durationTakenSeconds
    };
}


function downloadFileFallback(blob, filename, silent = false) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);

    // Only show alert if not silent mode
    if (!silent) {
        showAlert(`The file "${filename}" has been saved. Please open your phone's File Manager and find it in the **Download** folder to share it manually via Bluetooth or other apps.`, 'info', 10000); 
    }
}


/**
 * Converts exam data to CSV format
 * @param {Object} exam - The exam object to convert
 * @returns {string} - CSV formatted string
 */
function jsonToCsv(exam) {
    // Add a header
    let csv = 'exam_id,subject,class,duration,questions_json\n';
    
    // We encode the entire questions array as a single JSON string 
    // to keep it "immortal" and prevent CSV row splitting.
    const questionsSafe = JSON.stringify(exam.questions.map(q => ({
        ...q,
        options: q.options && q.options.length > 0 
            ? q.options 
            : ["Option A", "Option B", "Option C", "Option D"] // Fallback
    })));

    const row = [
        exam.exam_id,
        exam.subject,
        exam.class,
        exam.duration,
        `"${questionsSafe.replace(/"/g, '""')}"` // Escape quotes for CSV safety
    ];
    
    return csv + row.join(',');
}

function showAlert(message, type = 'error', duration = 4000) {
    state.alertMessage = message;
    state.alertType = type;
    state.showAlert = true;

    ensureAlertElement();
    renderAlert(); 
    
    if (state.alertTimeout) clearTimeout(state.alertTimeout);
    state.alertTimeout = setTimeout(hideAlert, duration);
}

function hideAlert() {
    state.showAlert = false;
    const alertElement = document.getElementById('custom-alert');
    if (alertElement) {
        alertElement.classList.add('translate-x-full', 'opacity-0', 'hidden');
        alertElement.classList.remove('translate-x-0', 'opacity-100');
    }
}

function ensureAlertElement() {
    let alertElement = document.getElementById('custom-alert');
    if (!alertElement) {
        alertElement = document.createElement('div');
        alertElement.id = 'custom-alert';
        alertElement.className = 'fixed top-4 right-4 z-[9999] p-4 rounded-lg shadow-2xl transition-all duration-300 transform translate-x-full opacity-0 max-w-sm w-full';
        alertElement.innerHTML = `
            <div class="flex items-start gap-3">
                <div id="alert-icon" class="flex-shrink-0"></div>
                <p id="alert-message" class="flex-1 text-sm font-medium"></p>
                <button onclick="hideAlert()" class="flex-shrink-0 text-gray-400 hover:text-gray-600">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
        `;
        document.body.appendChild(alertElement);
    }
}

function renderAlert() {
    const alertElement = document.getElementById('custom-alert');
    if (!alertElement || !state.showAlert) return;

    const messageElement = document.getElementById('alert-message');
    const iconContainer = document.getElementById('alert-icon');
    
    if (!messageElement || !iconContainer) {
        console.error('Alert message or icon container not found');
        return;
    }
    
    messageElement.textContent = state.alertMessage;

    alertElement.className = "fixed top-4 right-4 z-[9999] p-4 rounded-lg shadow-2xl transition-all duration-300 transform max-w-sm w-full border-2";
    iconContainer.innerHTML = '';
    
    let iconName, iconColor, bgColor, borderColor;

    switch (state.alertType) {
        case 'success':
            bgColor = 'bg-green-100';
            borderColor = 'border-green-400';
            iconColor = 'text-green-600';
            iconName = 'check-circle';
            break;
        case 'info':
            bgColor = 'bg-blue-100';
            borderColor = 'border-blue-400';
            iconColor = 'text-blue-600';
            iconName = 'info';
            break;
        case 'error':
        default:
            bgColor = 'bg-red-100';
            borderColor = 'border-red-400';
            iconColor = 'text-red-600';
            iconName = 'alert-triangle';
            break;
    }
    
    alertElement.classList.add(bgColor, borderColor);
    iconContainer.innerHTML = `<i data-lucide="${iconName}" class="w-6 h-6 ${iconColor}"></i>`;
    
    if (window.lucide) lucide.createIcons();

    alertElement.classList.remove('hidden', 'translate-x-full', 'opacity-0');
    alertElement.classList.add('translate-x-0', 'opacity-100');
}

// --- SIMPLIFIED FILE IMPORT FOR MOBILE ---
function parseCSVWithBetterHandling(csvText) {
    const rows = [];
    let currentLine = "";
    let inQuotes = false;

    // 1. Robust CSV Splitter
    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        if (char === '"') inQuotes = !inQuotes;
        if ((char === '\n' || char === '\r') && !inQuotes) {
            if (currentLine.trim()) rows.push(currentLine.trim());
            currentLine = "";
        } else {
            currentLine += char;
        }
    }
    if (currentLine.trim()) rows.push(currentLine.trim());

    if (rows.length < 2) throw new Error('File appears to be empty or invalid.');

    const firstDataRow = parseCSVLine(rows[1]);

    // 2. Format Identification
    // Check if the 5th column (Index 4) looks like a JSON array
    const jsonColumn = firstDataRow[4] ? firstDataRow[4].trim() : "";
    const isImmortalFormat = jsonColumn.startsWith('[') || jsonColumn.startsWith('"[');

    const exam = {
        exam_id: firstDataRow[0] || 'N/A',
        subject: firstDataRow[1] || 'Unknown Subject',
        class: firstDataRow[2] || 'Unknown Class',
        duration: parseInt(firstDataRow[3]) || 30,
        questions: []
    };

    if (isImmortalFormat) {
        // --- HANDLE IMMORTAL JSON FORMAT ---
        try {
            // Remove extra wrapping quotes if they exist from CSV escaping
            let cleanJson = jsonColumn;
            if (cleanJson.startsWith('"') && cleanJson.endsWith('"')) {
                cleanJson = cleanJson.substring(1, cleanJson.length - 1).replace(/""/g, '"');
            }
            exam.questions = JSON.parse(cleanJson);
        } catch (e) {
            throw new Error("The immortal JSON data is corrupted.");
        }
    } else {
        // --- HANDLE LEGACY MULTI-COLUMN FORMAT ---
        for (let i = 1; i < rows.length; i++) {
            const row = parseCSVLine(rows[i]);
            if (row.length < 8) continue; 
            exam.questions.push({
                id: row[5] || Date.now() + i,
                type: row[6] || 'multiple_choice',
                question: row[7],
                options: [row[8], row[9], row[10], row[11]],
                correct_answer: row[12]
            });
        }
    }

    return exam;
}

// Keep this exact version of parseCSVLine
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && line[i+1] === '"') {
            current += '"'; i++;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// ============================================
// BONUS: Add validation after import
// ============================================

function validateImportedExam(exam) {  // Removed expectedQuestionCount param
    const issues = [];
    
    // REMOVED: Expected count check - not reliable with skips
    
    // Check for duplicate question IDs
    const questionIds = exam.questions.map(q => q.id);
    const duplicateIds = questionIds.filter((id, index) => questionIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
        issues.push(`Duplicate question IDs found: ${[...new Set(duplicateIds)].join(', ')}`);
    }
    
    // Check each question has required fields
    exam.questions.forEach((q, idx) => {
        const qErr = [];
        
        if (!q.question || q.question.trim() === '') {
            issues.push(`Question ${idx + 1} (ID: ${q.id}) has no text`);
        }
        
        if (q.type === 'multiple_choice' && (!q.options || q.options.length < 2)) {
            issues.push(`Question ${idx + 1} (ID: ${q.id}) has insufficient options`);
        }
    });
    
    return {
        isValid: issues.length === 0,
        issues: issues,
        questionCount: exam.questions.length
    };
}


function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        console.log('📖 Starting to read file:', file.name);
        
        // Validate file size (max 10MB for mobile)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            reject(new Error('File is too large (max 10MB). Please use a smaller file.'));
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            console.log('✅ File read successfully, length:', e.target.result.length);
            resolve(e.target.result);
        };
        
        reader.onerror = function(error) {
            console.error('❌ FileReader error:', error);
            reject(new Error(`Failed to read file: ${file.name}. The file may be corrupted.`));
        };
        
        reader.onabort = function() {
            console.error('❌ FileReader aborted');
            reject(new Error('File reading was cancelled'));
        };
        
        // Set timeout (30 seconds)
        const timeout = setTimeout(() => {
            reader.abort();
            reject(new Error('File reading timeout - file may be too large or corrupted'));
        }, 30000);
        
        reader.onloadend = function() {
            clearTimeout(timeout);
        };
        
        // Start reading
        console.log('🔄 Reading file as text...');
        reader.readAsText(file, 'UTF-8'); // Explicitly set encoding
    });
}

function validateExamStructure(exam) {
    const errors = [];

    if (!exam.exam_id) errors.push('exam_id is missing');
    if (!exam.subject) errors.push('subject is missing');
    if (!exam.class) errors.push('class is missing');
    if (!exam.duration || isNaN(exam.duration) || exam.duration <= 0) {
        errors.push('duration must be a positive number');
    }

    if (!Array.isArray(exam.questions) || exam.questions.length === 0) {
        errors.push('questions array is missing or empty');
        return errors.join('; ');
    }

    exam.questions.forEach((q, idx) => {
        const qErr = [];

        if (!q.id && q.id !== 0) qErr.push('id missing');
        if (!q.type) qErr.push('type missing');
        if (!q.question) qErr.push('question text missing');

        switch (q.type) {
            case 'multiple_choice':
                if (!Array.isArray(q.options) || q.options.length < 2) {
                    qErr.push('options missing or insufficient (need at least 2 options)');
                }
                if (!q.correct_answer) {
                    qErr.push('correct_answer missing');
                } else {
                    const correctAnswers = q.correct_answer.split(',').map(a => a.trim().toUpperCase());
                    const availableOptions = ['A', 'B', 'C', 'D'].slice(0, q.options.length);
                    const invalidAnswers = correctAnswers.filter(ans => !availableOptions.includes(ans));
                    if (invalidAnswers.length > 0) {
                        qErr.push(`correct_answer "${q.correct_answer}" contains invalid options. Available: ${availableOptions.join(', ')}`);
                    }
                }
                break;
                
            case 'true_false':
            case 'truefalse':
                if (!['True', 'False', 'true', 'false'].includes(q.correct_answer)) {
                    qErr.push('correct_answer must be "True" or "False"');
                }
                break;
                
            case 'essay':
                if (!q.marking_scheme) {
                    qErr.push('marking_scheme missing');
                }
                break;
                
            default:
                qErr.push(`unknown question type "${q.type}"`);
        }

        if (qErr.length > 0) {
            errors.push(`Question ${idx + 1} (ID: ${q.id}): ${qErr.join(', ')}`);
        }
    });

    return errors.length > 0 ? errors.join(' | ') : null;
}

// Add this helper to your import logic in app.js
function normalizeExamData(exam) {
    exam.questions = exam.questions.map(q => {
        // Normalize question type - handle case variations and format differences
        if (q.type) {
            const normalizedType = q.type.toLowerCase().trim();
            // Map various possible type values to standard ones
            if (normalizedType === 'truefalse' || normalizedType === 'true_false') {
                q.type = 'true_false';
            }
        }
        
        if (q.type === 'multiple_choice' && (!q.options || q.options.length < 4)) {
            // Fill missing options with placeholders to prevent distortion
            const currentOptions = q.options || [];
            while (currentOptions.length < 4) {
                currentOptions.push(`Option ${String.fromCharCode(65 + currentOptions.length)}`);
            }
            q.options = currentOptions;
        }
        return q;
    });
    return exam;
}

// ========================================
// MOBILE FILE IMPORT - CORRECT VERSION
// ========================================

// Check for required permissions on Android
async function checkFilePermissions() {
    return new Promise((resolve) => {
        // Check if we're in Cordova environment
        if (!window.cordova) {
            console.log('Not in Cordova environment, using browser file access');
            resolve(true);
            return;
        }

        // Check if permission plugin is available
        if (!window.cordova.plugins || !window.cordova.plugins.permissions) {
            console.log('Permission plugin not available');
            resolve(true); // Continue anyway
            return;
        }

        const permissions = window.cordova.plugins.permissions;
        
        const permissionsToCheck = [
            permissions.READ_EXTERNAL_STORAGE,
            permissions.WRITE_EXTERNAL_STORAGE
        ];

        let grantedCount = 0;
        let checkedCount = 0;

        permissionsToCheck.forEach(permission => {
            permissions.checkPermission(permission, (status) => {
                checkedCount++;
                if (status.hasPermission) {
                    grantedCount++;
                }
                
                if (checkedCount === permissionsToCheck.length) {
                    if (grantedCount === 0) {
                        requestFilePermissions().then(resolve);
                    } else {
                        resolve(true);
                    }
                }
            }, () => {
                checkedCount++;
                if (checkedCount === permissionsToCheck.length) {
                    resolve(true);
                }
            });
        });
    });
}

// Request file permissions
async function requestFilePermissions() {
    return new Promise((resolve) => {
        if (!window.cordova || !window.cordova.plugins || !window.cordova.plugins.permissions) {
            resolve(true);
            return;
        }

        const permissions = window.cordova.plugins.permissions;
        const permissionsToRequest = [
            permissions.READ_EXTERNAL_STORAGE,
            permissions.WRITE_EXTERNAL_STORAGE
        ];

        permissions.requestPermissions(permissionsToRequest, (status) => {
            const granted = Object.values(status).some(val => val === true || val.hasPermission === true);
            if (!granted) {
                showAlert('Storage permission denied. Some features may not work.', 'error');
            }
            resolve(granted);
        }, () => {
            resolve(false);
        });
    });
}


function handleImportExam() {
    try {
        console.log('📱 Import exam triggered.');
                
        createFileInput(); 
        
    } catch (error) {
        console.error('❌ Error in handleImportExam:', error);
        showAlert('Error preparing file import. Check console for details.', 'error', 5000);
    }
}

// Helper function to create and trigger file input
function createFileInput() {
    try {
        // Remove any existing file input
        const existingInput = document.getElementById('hidden-file-input');
        if (existingInput) {
            existingInput.remove();
        }

        // Create new file input
        const fileInput = document.createElement('input');
        fileInput.id = 'hidden-file-input';
        fileInput.type = 'file';
        
        // Comprehensive accept attributes - ONLY CSV
        fileInput.accept = '.csv,text/csv,application/csv,text/comma-separated-values,application/vnd.ms-excel';
        
        // CRITICAL: Better positioning for mobile
        fileInput.style.cssText = 'position: absolute; top: 0; left: 0; opacity: 0; width: 1px; height: 1px; z-index: -1; pointer-events: auto;';
        
        // Add change handler BEFORE appending
        fileInput.onchange = async (e) => {
            console.log('📄 File input changed');
            const file = e.target.files?.[0];
            
            if (!file) {
                console.log('❌ No file selected');
                return;
            }
            
            console.log('📂 File selected:', {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: new Date(file.lastModified).toISOString()
            });
            
            // Validate CSV file
            const fileName = file.name.toLowerCase();
            const isCSV = fileName.endsWith('.csv') || 
                         file.type.includes('csv') || 
                         file.type.includes('comma-separated') ||
                         file.type === 'application/vnd.ms-excel';
            
            if (!isCSV) {
                showAlert('❌ Please select a CSV file (.csv)', 'error', 5000);
                if (fileInput && fileInput.parentNode) {
                    fileInput.remove();
                }
                return;
            }
            
            // Call the existing handleExamImport function
            await handleExamImport(file);
            
            // Clean up
            setTimeout(() => {
                if (fileInput && fileInput.parentNode) {
                    fileInput.remove();
                }
            }, 100);
        };
        
        // Append to body
        document.body.appendChild(fileInput);
        
        // Trigger file picker with delay for mobile
        setTimeout(() => {
            try {
                console.log('🖱️ Triggering file picker...');
                fileInput.click();
            } catch (error) {
                console.error('❌ Error triggering file picker:', error);
                showAlert('Cannot open file picker. Please ensure the app has storage permissions.', 'error', 6000);
                if (fileInput && fileInput.parentNode) {
                    fileInput.remove();
                }
            }
        }, 150); // Slightly longer delay for mobile devices
    } catch (error) {
        console.error('❌ Error creating file input:', error);
        showAlert('Error preparing file import: ' + error.message, 'error', 5000);
    }
}

function startExamSafe(examId) {
    const exam = state.availableExams.find(e => e.exam_id === examId);
    if (!exam) {
        showAlert('Exam not found!', 'error');
        return;
    }

    state.selectedExam = exam;
    const shuffled = JSON.parse(JSON.stringify(exam.questions));
    shuffleArray(shuffled);

    state.shuffledExam = { ...exam, questions: shuffled };
    state.studentAnswers = {};
    state.currentQuestionIndex = 0;
    state.timeRemaining = exam.duration * 60;

    if (state.examTimer) clearInterval(state.examTimer);
    state.examTimer = setInterval(() => {
        state.timeRemaining--;

        // 🚀 FIX 1: Update the timer display directly using the correct ID ('timer-display')
        const timerEl = document.getElementById('timer-display');
        if (timerEl) {
            timerEl.textContent = formatTime(state.timeRemaining);
        }

        if (state.timeRemaining <= 0) {
            clearInterval(state.examTimer);
            console.log("⏰ Time's up. Submitting exam...");
            submitExam();
        }

    }, 1000);

    setPage('exam');  // This will now work
}


// ========================================
// ALSO UPDATE THIS FUNCTION IN YOUR app.js
// ========================================
async function handleExamImport(file) {
    try {
        console.log('📄 Starting exam import:', { 
            name: file.name, 
            size: file.size,
            type: file.type
        });

        showAlert(`📂 Reading file: ${file.name}...`, 'info', 3000);

        // Read file content
        const content = await readFileAsText(file);
        
        console.log('📄 File content loaded, length:', content.length);
        
        // ✅ Count expected questions from CSV
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        const expectedQuestions = lines.length - 1; // Minus header row
        console.log(`📊 CSV has ${expectedQuestions} data rows (expected questions)`);

        showAlert('🔍 Parsing CSV data...', 'info', 2000);

        // Parse CSV
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

        // ✅ NEW: Validate the imported exam
        const validation = validateImportedExam(exam, expectedQuestions);
        
        if (!validation.isValid) {
            console.warn('⚠️ Import validation issues:', validation.issues);
            
            // Show detailed warning
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

        // Normalize and validate structure
        exam = normalizeExamData(exam);

        const validationError = validateExamStructure(exam);
        if (validationError) {
            console.error('❌ Validation error:', validationError);
            throw new Error(`Invalid file format: ${validationError.substring(0, 150)}...`);
        }

        // Check for existing exam
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

        // Add metadata
        exam.created_by = state.user?.phone_number || 'teacher';
        exam.created_date = new Date().toISOString().split('T')[0];

        // Save to database
        showAlert('💾 Saving exam to database...', 'info', 2000);
        await saveExamToDB(exam);
        await loadExams();

        // ✅ Success with detailed info
        showAlert(
            `✅ "${exam.subject}" imported successfully!\n\n` +
            `📚 ${exam.questions.length} questions loaded\n` +
            `📊 Class: ${exam.class}\n` +
            `⏱️ Duration: ${exam.duration} minutes`,
            'success',
            6000
        );

        console.log('✅ Import completed successfully');
        console.log(`📊 Final question count: ${exam.questions.length}`);

        // Refresh UI
        setTimeout(() => {
            if (state.currentPage === 'teacher') {
                render();
            }
        }, 1000);

    } catch (err) {
        console.error('❌ Import failed:', err);
        console.error('Error stack:', err.stack);
        
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
        // Always clean up the file input
        const fileInput = document.getElementById('hidden-file-input');
        if (fileInput) {
            fileInput.value = '';
        }
    }
}

// ========================================
// Initialize permission check (Cordova only)
// ========================================
document.addEventListener('deviceready', async function() {
    console.log('📱 Cordova device ready');
    
    try {
        await checkFilePermissions();
        console.log('✅ File permissions checked');
    } catch (error) {
        console.error('❌ Permission check failed:', error);
    }
}, false);



// --- CORE ---
// app.js

// ... (Rest of the render function's switch statement)

// --- CORE --- 
function render() {
    const app = document.getElementById('app');
    if (!app) return;
    
    console.log('Rendering page:', state.currentPage);
    let pageContent = '';

    // 1. Determine the main page content
    switch (state.currentPage) {
        case 'home':
            pageContent = renderHomePage();
            break;
case 'teacher-login':
             pageContent = renderTeacherLoginPage(state);
             break;
         case 'teacher-register':
             pageContent = renderTeacherRegistrationPage(state);
             break;
         case 'exam-office-login':
             pageContent = renderExamOfficeLoginPage(state);
             break;
         case 'exam-office-register':
             pageContent = renderExamOfficeRegisterPage(state);
             break;
         case 'exam-office-dashboard':
             if (!state.isExamOffice) { setPage('exam-office-login'); return; }
             pageContent = renderExamOfficeDashboard(state);
             break;
         case 'teacher':
             if (!state.isTeacher && !state.isExamOffice) { setPage('teacher-login'); return; }
             pageContent = renderTeacherDashboard(state);
             break;
         case 'create-exam':
             if (!state.isTeacher && !state.isExamOffice) { setPage('home'); return; }
             pageContent = renderCreateExamPage(state);
             break;
         case 'student-info':
             pageContent = renderStudentInfoForm(state);
             break;
case 'student-exam-list':
             pageContent = renderStudentExamList(state);
             break;
         case 'exam':
             pageContent = renderExamInterface(state);
             break;
         case 'view-results':
             if (!state.isTeacher && !state.isExamOffice) { setPage('home'); return; }
             pageContent = renderViewResultsPage(state);
             break;
case 'exam-office-results':
              if (!state.isExamOffice) { setPage('exam-office-login'); return; }
              pageContent = renderExamOfficeResultsPage(state);
              break;
          case 'exam-office-upload':
              if (!state.isExamOffice) { setPage('exam-office-login'); return; }
              pageContent = renderExamOfficeUploadPage(state);
              break;
         default:
             pageContent = renderHomePage();
    }

    // 2. Set the main page content
    app.innerHTML = pageContent;

    // 3. CRITICAL FIX: Conditionally render the modal
    if (state.showResultModal && state.lastResult) {
        // Append the modal HTML directly to the app container.
        // The modal uses fixed positioning (z-50) so it will appear on top.
        app.innerHTML += renderStudentResultModal(state.lastResult); //
    }
    
    // 4. Conditionally render the filter modal (for teacher view)
    if (state.showFilterModal && state.isTeacher) { 
        app.innerHTML += renderFilterModal(state);
    }
    
    // 5. Ensure alerts are rendered
    if (state.showAlert) {
        renderAlert();
    }

    // 6. Re-create Lucide icons for all newly rendered HTML
    if (window.lucide) { 
        window.lucide.createIcons(); 
    } 

    if (state.showResultModal) {
        const existingModal = document.getElementById('result-modal');
        if (existingModal) existingModal.remove();  // Ensure no duplicate modals
        app.innerHTML += renderStudentResultModal(state.lastResult);
        lucide.createIcons();
    }

    // 7. Set up close button event listener
    const closeBtn = document.getElementById('closeBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            console.log('🔴 Close button clicked from UI');
            if (window.electronAPI && window.electronAPI.closeApp) {
                window.electronAPI.closeApp();
            } else {
                console.error('❌ electronAPI.closeApp not available');
            }
        });
    }
}


function resetExamState() {
    if (window.state) {
        // Clear exam-related state
        state.selectedExam = null;
        state.shuffledExam = null;
        state.studentAnswers = {};
        state.currentQuestionIndex = 0;
        state.timeRemaining = 0;
        state.examStarted = false;
        state.examSubmitted = false;
        
        // Keep only essential student info
        if (state.studentInfo) {
            // Preserve student info but clear any exam-specific data
            state.studentInfo = {
                name: state.studentInfo.name || '',
                class: state.studentInfo.class || '',
                arms: state.studentInfo.arms || ''
            };
        }
        
        // Force re-render
        render();
    }
}

async function setPage(page) {
    // Stop exam timer if leaving exam page
    if (state.currentPage === 'exam' && page !== 'exam') {
        if (state.examTimer) {
            clearInterval(state.examTimer);
            state.examTimer = null;
        }
        // Reset all exam-related state
        state.selectedExam = null;
        state.studentAnswers = {};
        state.shuffledExam = null;
        state.currentQuestionIndex = 0;
        state.timeRemaining = 0;
        state.examStarted = false;
        state.examSubmitted = false;
        
        // IMPORTANT: Only clear student info if going to student-info page
        if (page === 'student-info') {
            state.studentInfo = { name: '', class: '', arms: '' };
        }
    }

    // Handle protected pages (teacher pages)
    const protectedPages = ['teacher', 'create-exam', 'view-results'];
    if (protectedPages.includes(page)) {
        if (!state.isTeacher) {
            console.warn('Unauthorized access attempt to:', page);
            setPage('home');
            return;
        }
    }

    // Load data for specific pages
    if (page === 'student-dashboard' || page === 'teacher') {
        await loadExams(); 
        if (state.isTeacher) await loadResults();
    }

    // Force reset student info when explicitly navigating to student-info
    if (page === 'student-info') {
        // Always start fresh when going to student info
        state.studentInfo = { name: '', class: '', arms: '' };
        state.selectedExam = null;
        state.studentAnswers = {};
        state.shuffledExam = null;
        state.currentQuestionIndex = 0;
        state.timeRemaining = 0;
        state.examStarted = false;
        state.examSubmitted = false;
        state.editingExamId = null;
        state.editingQuestionId = null;
        state.currentExamData = null;
        // Close any open modals to prevent interference
        state.showResultModal = false;
        state.showFilterModal = false;
        // Remove any existing modals from DOM
        const resultModal = document.getElementById('result-modal');
        if (resultModal) resultModal.remove();
        console.log('📝 [SETPAGE] Reset student-info state:', state.studentInfo);
    }

    // Clear editing state when leaving create-exam page (e.g., when closing edit and going to teacher dashboard)
    if (state.currentPage === 'create-exam' && page !== 'create-exam') {
        state.editingExamId = null;
        state.currentExamData = null;
        state.editingQuestionId = null;
        console.log('📝 [SETPAGE] Cleared edit state when leaving create-exam page');
    }

    // Clear currentExamData when navigating to create-exam unless we're actually editing
    if (page === 'create-exam' && !state.editingExamId) {
        state.currentExamData = null;
        state.editingQuestionId = null;
        console.log('📝 [SETPAGE] Cleared currentExamData for new exam');
    }

    console.log('📄 [SETPAGE] Navigating to page:', page, 'isTeacher:', state.isTeacher); 
    state.currentPage = page;
    
    // Render the page
    render();
    
    // Special handling for student-info page to ensure name field is active
    if (page === 'student-info') {
        setTimeout(() => {
            const nameInput = document.getElementById('student-name');
            const classSelect = document.getElementById('student-class');
            const armsSelect = document.getElementById('student-arms');
            
            console.log('🔧 [STUDENT-INFO] Fixing input fields...');
            
            if (nameInput) {
                // Remove any attributes that might disable the input
                nameInput.removeAttribute('readonly');
                nameInput.removeAttribute('disabled');
                nameInput.value = '';
                nameInput.focus(); // Auto-focus on the name field
                console.log('✅ [STUDENT-INFO] Name field is ready');
            }
            
            if (classSelect) {
                classSelect.removeAttribute('readonly');
                classSelect.removeAttribute('disabled');
                classSelect.value = '';
            }
            
            if (armsSelect) {
                armsSelect.removeAttribute('readonly');
                armsSelect.removeAttribute('disabled');
                armsSelect.value = '';
            }
        }, 100);
    }
}

// --- DATA LOADERS & AUTH ---
// app.js

async function loadExams() {
    updateLoadingStatus('Loading available exams...');
    try {
        // Use the function from storage.js to fetch all exams
        const exams = await loadAllExamsFromDB(); 
        
        // CRUCIAL: Set the state variable.
        state.availableExams = exams; 
        
        console.log(`✅ Loaded ${exams.length} exams.`);
        // Note: You must call render() after setting state if it's not called by setPage
        // The setPage function (which calls loadExams) usually handles the final render.
    } catch (error) {
        console.error('❌ Failed to load exams:', error);
        showToast('Failed to load exams.', 'error');
    }
}

async function loadResults() {
    try {
        const allResults = await loadResultsFromDB(); 
        
        if (state.isTeacher && state.user?.phone_number) {
            const teacherExams = await loadExamsByCreator(state.user.phone_number);
            const teacherExamIds = teacherExams.map(e => e.exam_id);
            
            state.allResults = allResults.filter(r => teacherExamIds.includes(r.exam_id));
            console.log(`✅ Teacher loaded ${state.allResults.length} results`);
        }
    } catch (error) {
        console.error('❌ Error loading results:', error);
        state.allResults = [];
    }
}

// --- LOGIN/REGISTRATION HANDLERS ---
async function handleTeacherRegistration(event) {
    event.preventDefault();

    const name = document.getElementById('register-name').value.trim();
    const phone = document.getElementById('register-phone').value.trim();
    const password = document.getElementById('register-password').value;

    if (!name || !phone || !password) {
        showAlert('Please fill all fields', 'error');
        return;
    }

    try {
        const existing = await getUserByPhone(phone);
        if (existing) {
            showAlert('Phone number already registered. Please use a different number.', 'error');
            return;
        }

        const hashedPassword = await hashPassword(password);

        await saveUserToDB({
            name,
            phone_number: phone,
            password: hashedPassword,
            role: 'teacher'
        });

        showAlert('Registration successful! You can now log in.', 'success');
        setPage('teacher-login');
    } catch (err) {
        console.error('Registration error:', err);
        showAlert('Registration failed. Please try again.', 'error');
    }
}

async function handleTeacherLogin(event) {
    event.preventDefault();

    const phoneInput = document.getElementById('teacher-phone');
    const passwordInput = document.getElementById('teacher-password');
    
    if (!phoneInput || !passwordInput) {
        console.error('Form inputs not found');
        return;
    }

    const phone = phoneInput.value.trim();
    const password = passwordInput.value;

    console.log('Login attempt:', { phone, passwordLength: password.length });

    if (!phone || !password) {
        showAlert('Please enter phone and password', 'error');
        return;
    }

    try {
        const user = await getUserByPhone(phone);
        console.log('User lookup result:', user ? 'Found' : 'Not found');
        
        if (!user) {
            showAlert('No account found with this phone number.', 'error');
            return;
        }
        
        if (user.role !== 'teacher') {
            showAlert('This account is not a teacher account.', 'error');
            return;
        }

        const hashedInput = await hashPassword(password);
        console.log('Password check:', hashedInput === user.password ? 'Match' : 'No match');
        
        if (hashedInput !== user.password) {
            showAlert('Incorrect password.', 'error');
            return;
        }

        state.user = user;
        state.isTeacher = true;
        state.isAuthenticated = true;
        
        await loadExams();
        await loadResults();
        
        showAlert('Login successful!', 'success');
        
        setTimeout(() => {
            setPage('teacher');
        }, 500);
        
} catch (err) {
         console.error('Login error:', err);
         showAlert('Login failed: ' + err.message, 'error');
     }
 }
 
 
 async function handleExamOfficeRegistration(event) {
     event.preventDefault();
 
     const schoolName = document.getElementById('exam-office-school-name').value.trim();
     const adminName = document.getElementById('exam-office-admin-name').value.trim();
     const phone = document.getElementById('exam-office-phone').value.trim();
     const email = document.getElementById('exam-office-email').value.trim();
     const password = document.getElementById('exam-office-password').value;
 
     if (!schoolName || !adminName || !phone || !email || !password) {
         showAlert('Please fill all fields', 'error');
         return;
     }
 
     try {
         const existing = await getUserByPhone(phone);
         if (existing) {
             showAlert('Phone number already registered. Please use a different number.', 'error');
             return;
         }
 
         const hashedPassword = await hashPassword(password);
 
         await saveUserToDB({
             name: adminName,
             phone_number: phone,
             email: email,
             school_name: schoolName,
             password: hashedPassword,
             role: 'exam_office'
         });
 
         showAlert('School registration successful! You can now log in.', 'success');
         setPage('exam-office-login');
     } catch (err) {
         console.error('Exam Office Registration error:', err);
         showAlert('Registration failed. Please try again.', 'error');
     }
 }
 
 async function handleExamOfficeLogin(event) {
     event.preventDefault();
 
     const phoneInput = document.getElementById('exam-office-login-phone');
     const passwordInput = document.getElementById('exam-office-login-password');
     
     if (!phoneInput || !passwordInput) {
         console.error('Form inputs not found');
         return;
     }
 
     const phone = phoneInput.value.trim();
     const password = passwordInput.value;
 
     console.log('Exam Office Login attempt:', { phone, passwordLength: password.length });
 
     if (!phone || !password) {
         showAlert('Please enter phone and password', 'error');
         return;
     }
 
     try {
         const user = await getUserByPhone(phone);
         console.log('User lookup result:', user ? 'Found' : 'Not found');
         
         if (!user) {
             showAlert('No account found with this phone number.', 'error');
             return;
         }
         
         if (user.role !== 'exam_office') {
             showAlert('This account is not an exam office account.', 'error');
             return;
         }
 
         const hashedInput = await hashPassword(password);
         console.log('Password check:', hashedInput === user.password ? 'Match' : 'No match');
         
         if (hashedInput !== user.password) {
             showAlert('Incorrect password.', 'error');
             return;
         }
 
state.user = user;
         state.isExamOffice = true;
         state.isAuthenticated = true;
         
         await loadExams();
         await loadResults();
         
         showAlert('Login successful!', 'success');
         
         setTimeout(() => {
             setPage('exam-office-dashboard');
         }, 500);
         
     } catch (err) {
console.error('Exam Office Login error:', err);
         showAlert('Login failed: ' + err.message, 'error');
     }
 }
 
 async function toggleExamSchedule(examId, isScheduled) {
     try {
         const exam = state.availableExams.find(e => e.exam_id === examId);
         if (!exam) return;
 
         if (isScheduled) {
             const tomorrow = new Date();
             tomorrow.setDate(tomorrow.getDate() + 1);
             exam.scheduledDate = tomorrow.toISOString().split('T')[0];
             showAlert(`Exam "${exam.subject}" scheduled for tomorrow`, 'success');
         } else {
             delete exam.scheduledDate;
             showAlert(`Exam "${exam.subject}" unscheduled`, 'info');
         }
 
         await saveExamToDB(exam);
         render();
     } catch (err) {
         console.error('Toggle schedule error:', err);
         showAlert('Failed to update schedule', 'error');
     }
 }
 
 function showClassExams(className) {
     const modal = document.getElementById('examOfficeModal');
     const modalTitle = document.getElementById('modalTitle');
     const modalContent = document.getElementById('modalContent');
     
     const exams = state.availableExams.filter(exam => exam.class === className);
     
     modalTitle.textContent = `${className} - Select Exams to Schedule`;
     
     modalContent.innerHTML = exams.map(exam => {
         const isScheduled = exam.scheduledDate;
         const scheduledDate = isScheduled ? new Date(exam.scheduledDate).toLocaleDateString() : '';
         return `
             <div class="${isScheduled ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50 border-l-4 border-gray-300'} rounded-lg p-4 mb-3">
                 <div class="flex items-start justify-between gap-3">
                     <div class="flex-1 min-w-0">
                         <div class="flex items-center gap-2 mb-2">
                             <input type="checkbox" 
                                     ${isScheduled ? 'checked' : ''}
                                     onchange="toggleExamSchedule('${exam.exam_id}', this.checked)"
                                     class="w-5 h-5 text-green-600 rounded focus:ring-green-500 cursor-pointer">
                             <h3 class="font-bold text-gray-800">${exam.subject}</h3>
                         </div>
                         <p class="text-xs text-gray-500 mb-2">${exam.exam_id}</p>
                         <div class="flex flex-wrap gap-4 text-sm text-gray-600">
                             <span class="flex items-center gap-1">
                                 <i data-lucide="list" class="w-3 h-3"></i> ${exam.questions.length} Questions
                             </span>
                             <span class="flex items-center gap-1">
                                 <i data-lucide="clock" class="w-3 h-3"></i> ${exam.duration} mins
                             </span>
                         </div>
                         ${isScheduled ? `<p class="text-xs text-green-600 mt-2 font-semibold">Scheduled: ${scheduledDate}</p>` : ''}
                     </div>
                     <div class="flex flex-col gap-1">
                         <button onclick="shareExamWithOptions('${exam.exam_id}')" 
                                 class="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors" title="Share">
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
 
 function logout() {
     console.log('🔴 [LOGOUT] Clearing all state...');
     
     // Clear ALL session states completely
     state.isAuthenticated = false;
     state.isTeacher = false;
     state.isExamOffice = false;
     state.user = null;
    state.studentInfo = { name: '', class: '', arms: '' };
    state.selectedExam = null;
    state.shuffledExam = null;
    state.studentAnswers = {};
    state.formSubmitted = false;
    state.currentQuestionIndex = 0;
    state.timeRemaining = 0;
    state.examStarted = false;
    state.examSubmitted = false;
    state.editingExamId = null;
    state.editingQuestionId = null;
    state.currentExamData = null;
    state.recentUploads = [];
    state.showResultModal = false;
    
    // Clear any exam timer
    if (state.examTimer) {
        clearInterval(state.examTimer);
        state.examTimer = null;
    }
    
    // Close sidebar if open
    const sidebar = document.getElementById('teacherSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.add('sidebar-hidden');
    if (overlay) overlay.classList.add('hidden');
    
    console.log('✅ [LOGOUT] State cleared:', JSON.stringify({isTeacher: state.isTeacher, isAuthenticated: state.isAuthenticated}));
    
    // Return to home and force a fresh render
    state.currentPage = 'home';
    loadExams().then(() => {
        console.log('✅ [LOGOUT] Exams reloaded, rendering home page');
        render();
    }).catch(err => {
        console.error('❌ [LOGOUT] Error reloading exams:', err);
        render();
    });
}


async function quitCBT() {
    if (confirm("Are you sure you want to exit the GSS CBT System?")) {
        try {
            // This is the Tauri-specific way to close the window
            const { exit } = window.__TAURI__.process;
            await exit(0);
        } catch (e) {
            console.log("Not in Tauri environment, using fallback.");
            window.close();
        }
    }
}


// --- STUDENT FLOW HANDLERS ---
async function submitStudentInfo(e) {
    e.preventDefault();

    const name = document.getElementById('student-name')?.value.trim();
    const studentClass = document.getElementById('student-class')?.value.trim();
    const arms = document.getElementById('student-arms')?.value.trim() || '';

    if (!name || !studentClass) {
        showAlert('Please enter your full name and class', 'error');
        return;
    }

    // Save student info
    state.studentInfo = { name, class: studentClass, arms };

    try {
        // Load ALL exams from DB (teacher-created ones)
        const allExams = await loadAllExamsFromDB();

        // Filter only exams that match the student's class AND are scheduled
        const filteredExams = allExams.filter(exam => {
            // Handle formats like "SS 3", "SS3", "ss3", "SS-3", etc.
            const examClass = exam.class?.toString().trim();
            const studentCls = studentClass.trim();

            const classMatch = examClass &&
                   (examClass.toUpperCase() === studentCls.toUpperCase() ||
                    examClass.toUpperCase().replace(/[^A-Z0-9]/g, '') === studentCls.toUpperCase().replace(/[^A-Z0-9]/g, ''));

            // Only include exams that have been scheduled (checked) by the exam office
            const isScheduled = exam.scheduledDate != null && exam.scheduledDate !== '';

            return classMatch && isScheduled;
        });

        state.availableExams = filteredExams;

        if (filteredExams.length === 0) {
            showAlert(`No scheduled exams found for ${studentClass}. Please contact your teacher or exam office.`, 'info', 8000);
        }

        // Go to student exam list
        setPage('student-exam-list');

    } catch (err) {
        showAlert('Failed to load exams. Check your connection or try again.', 'error');
        console.error(err);
    }
}


async function submitExam() {
    // Allow auto-submit from timer even if manual submit already clicked once
    // Only skip if result already exists
    if (state.formSubmitted && state.showResultModal) {
        console.log('ℹ️ Exam already submitted.');
        return;
    }
    
    console.log('📤 Submitting exam...');
    
    // 1. Identify which exam object to use for scoring
    const activeExam = state.shuffledExam || state.selectedExam;
    
    if (!activeExam) {
        console.error("No active exam found to submit");
        showAlert('Error: Exam data missing.', 'error');
        return;
    }

    // 2. Calculate the score using the active exam
    const { score, total, durationTakenSeconds } = calculateScore(activeExam, state.studentAnswers);
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    // 3. Generate unique result_id
    const result_id = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 4. Construct the result object (using activeExam)
    const result = {
        result_id: result_id,
        exam_id: activeExam.exam_id, // FIXED: Changed from exam to activeExam
        exam_subject: activeExam.subject, // FIXED
        student_name: state.studentInfo?.name || 'Anonymous Student',
        student_class: state.studentInfo?.class || '',
        student_arms: state.studentInfo?.arms || '',
        score: score,
        total: total,
        percentage: percentage,
        answers: state.studentAnswers,
        exam_details: activeExam, // FIXED
        duration_taken: durationTakenSeconds,
        submitted_at: new Date().toISOString()
    };

    // 5. Update UI State immediately
    state.lastResult = result;
    state.showResultModal = true;
    state.formSubmitted = true;
    
    if (state.examTimer) {
        clearInterval(state.examTimer);
    }

    // 6. Attempt to persist to Database
    try {
        if (typeof saveResultToDB !== 'function') {
            throw new Error('saveResultToDB function not found. Storage.js might not be loaded.');
        }

        await saveResultToDB(result);
        console.log('✅ Result saved successfully');
        showAlert('✅ Exam submitted successfully!', 'success', 3000);

    } catch (error) {
        console.error('❌ Database save failed:', error);
        showAlert('⚠️ Score calculated, but failed to save to teacher records.', 'info', 6000);
    }

    // 7. Re-render to show the modal
    render();
}

window.submitExam = submitExam;

function updateAnswer(questionId, answer) {
    // Save the answer immediately
    state.studentAnswers[questionId] = answer.trim();

    // Instantly update the visual state of the selected radio button
    const currentQuestion = (state.shuffledExam || state.selectedExam).questions[state.currentQuestionIndex];
    const radioButtons = document.querySelectorAll(`input[name="answer-${currentQuestion.id}"]`);
    
    radioButtons.forEach(radio => {
        const label = radio.closest('label');
        if (radio.value === answer) {
            label.classList.remove('border-gray-300');
            label.classList.add('border-[#B80236]', 'bg-pink-50');
        } else {
            label.classList.remove('border-[#B80236]', 'bg-pink-50');
            label.classList.add('border-gray-300');
        }
    });

    // Update question palette button (sidebar + mobile grid) to show answered
    const paletteButtons = document.querySelectorAll('.question-palette button, #mobile-question-grid button');
    const currentIndex = state.currentQuestionIndex;
    const btn = paletteButtons[currentIndex];
    if (btn) {
        btn.classList.remove('bg-gray-200', 'text-gray-700');
        btn.classList.add('bg-green-500', 'text-white', 'hover:bg-green-600');
        if (!btn.innerHTML.includes('check')) {
            btn.innerHTML += ' check';
        }
    }

    // For essay: no visual change needed beyond textarea content
    console.log(`Answer saved: Q${questionId} = ${answer}`);
    
    // DO NOT CALL render() HERE → this is what breaks the timer!
}


function nextQuestion() {
    if (state.currentQuestionIndex < state.shuffledExam.questions.length - 1) {
        state.currentQuestionIndex++;
        render();
    }
}

function previousQuestion() {
    if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
        render();
    }
}

function changeQuestion(direction) {
    direction === 1 ? nextQuestion() : previousQuestion();
}

function goToQuestion(index) {
    const exam = state.shuffledExam || state.selectedExam;
    if (!exam || !exam.questions) return;
    if (index >= 0 && index < exam.questions.length) {
        state.currentQuestionIndex = index;
        render();
    }
}

// --- TEACHER MANAGEMENT HANDLERS ---
// Toggle symbol bank visibility
function toggleSymbolBank() {
    const symbolBank = document.getElementById('symbol-bank');
    const toggleText = document.getElementById('symbol-bank-toggle-text');
    const chevron = document.getElementById('symbol-chevron');
    
    if (symbolBank.classList.contains('hidden')) {
        symbolBank.classList.remove('hidden');
        toggleText.textContent = '∑ Hide Symbols';
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    } else {
        symbolBank.classList.add('hidden');
        toggleText.textContent = '∑ Show Symbols';
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
}

// Insert symbol at cursor position
function insertSymbol(symbol) {
    const textarea = document.getElementById('question-text');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = text.substring(0, start) + symbol + text.substring(end);
    textarea.value = newText;
    textarea.focus();
    textarea.setSelectionRange(start + symbol.length, start + symbol.length);
}

// Convert normal characters to subscript
function toSubscript(text) {
    const subscriptMap = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
        '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
        'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
        'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
        'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
        'v': 'ᵥ', 'x': 'ₓ'
    };
    
    return text.split('').map(char => subscriptMap[char.toLowerCase()] || char).join('');
}

// Convert normal characters to superscript
function toSuperscript(text) {
    const superscriptMap = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
        'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
        'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ',
        'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ',
        'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ',
        'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ'
    };
    
    return text.split('').map(char => superscriptMap[char.toLowerCase()] || char).join('');
}

// Insert custom subscript
function insertCustomSubscript() {
    const input = document.getElementById('subscript-input');
    if (!input || !input.value.trim()) {
        showAlert('Please enter text for subscript', 'error', 3000);
        return;
    }
    
    const text = input.value.trim();
    const converted = toSubscript(text);
    insertSymbol(converted);
    input.value = ''; // Clear input
    showAlert(`Inserted: ${converted}`, 'success', 2000);
}

// Insert custom superscript
function insertCustomSuperscript() {
    const input = document.getElementById('superscript-input');
    if (!input || !input.value.trim()) {
        showAlert('Please enter text for superscript', 'error', 3000);
        return;
    }
    
    const text = input.value.trim();
    const converted = toSuperscript(text);
    insertSymbol(converted);
    input.value = ''; // Clear input
    showAlert(`Inserted: ${converted}`, 'success', 2000);
}

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

async function editQuestion(id) {
    if (state.currentPage !== 'create-exam') return;

    // Ensure we have the exam data
    if (!state.currentExamData && state.editingExamId) {
        const savedExam = state.availableExams.find(ex => ex.exam_id === state.editingExamId);
        if (savedExam) state.currentExamData = JSON.parse(JSON.stringify(savedExam));
    }
    
    if (!state.currentExamData) {
        showAlert('Error: No active exam data found.', 'error');
        return;
    }
    
    // FIX: Type-safe matching (String to String)
    const questionToEdit = state.currentExamData.questions.find(q => String(q.id) === String(id));
    
    if (!questionToEdit) {
        showAlert('Question not found in this exam.', 'error');
        return;
    }

    // Set the global editing ID
    state.editingQuestionId = id;
    
    // Handle Images
    if (questionToEdit.image) {
        currentQuestionImage = questionToEdit.image;
        if (typeof displayImagePreview === 'function') displayImagePreview(questionToEdit.image);
    } else {
        currentQuestionImage = null;
        const previewContainer = document.getElementById('image-preview-container');
        if (previewContainer) previewContainer.innerHTML = '';
    }

    // Populate Fields
    const questionTextarea = document.getElementById('question-text');
    const questionTypeSelect = document.getElementById('question-type');
    const addButton = document.querySelector('button[onclick="addQuestion()"]');

    if (questionTextarea) questionTextarea.value = questionToEdit.question;
    if (questionTypeSelect) {
        questionTypeSelect.value = questionToEdit.type;
        // Trigger UI change for the selected type
        if (typeof toggleQuestionOptions === 'function') toggleQuestionOptions();
    }

    // Transform Add Button to Update Button
    if (addButton) {
        addButton.innerHTML = '<i data-lucide="save" class="w-4 h-4 mr-2 inline"></i> Update Question Details';
        addButton.classList.replace('bg-[#B80236]', 'bg-blue-600');
        addButton.classList.replace('hover:bg-[#900028]', 'hover:bg-blue-700');
        if (window.lucide) lucide.createIcons();
    }

    // Populate Options based on Type
    setTimeout(() => {
        if (questionToEdit.type === 'multiple_choice') {
            ['a', 'b', 'c', 'd'].forEach((letter, index) => {
                const input = document.getElementById(`option-${letter}`);
                if (input) input.value = questionToEdit.options?.[index] || '';
            });
            
            // Set Correct Answers (Radios/Checkboxes)
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

    // UX: Scroll and Focus
    questionTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    questionTextarea.focus();
    showAlert('Editing Question Mode Active', 'info');
}

// Helper to convert image file to Base64 string
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

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

    const isEditingQuestion = state.editingQuestionId !== null;

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
            created_date: new Date().toISOString().split('T')[0],
            questions: []
        };
    }

    if (questionType === 'multiple_choice') {
        const options = ['a','b','c','d'].map(l => document.getElementById(`option-${l}`)?.value.trim() || '');
        
        // Get all checked correct answers
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
        // Get the selected True/False radio button
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
        showAlert('Question added successfully!', 'success');
    }

    // Clear form fields
    if (questionTextarea) questionTextarea.value = '';
    
    // Clear options based on question type
    if (questionType === 'multiple_choice') {
        ['a','b','c','d'].forEach(l => {
            const opt = document.getElementById(`option-${l}`);
            if (opt) opt.value = '';
        });
        // Clear radio buttons
        document.querySelectorAll('input[name="correct-answer"]').forEach(radio => radio.checked = false);
    } else if (questionType === 'true_false') {
        // Clear True/False radio buttons
        document.querySelectorAll('input[name="correct-answer-tf"]').forEach(radio => radio.checked = false);
        // Set default to True
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

    // Clear image after adding question
    currentQuestionImage = null;
    const previewContainer = document.getElementById('image-preview-container');
    if (previewContainer) previewContainer.innerHTML = '';
    const fileInput = document.getElementById('question-image-input');
    if (fileInput) fileInput.value = '';
    
    render();
}


async function deleteQuestion(questionId) {
    console.log('🗑️ Deletion requested for ID:', questionId);
    
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    // Use currentExamData since that's what editExam sets
    const exam = state.currentExamData;

    if (!exam || !exam.questions) {
        console.error("❌ No exam data found in state.currentExamData");
        return;
    }

    const originalCount = exam.questions.length;

    // THE FIX: String conversion ensures '1' matches 1
    exam.questions = exam.questions.filter(q => String(q.id) !== String(questionId));

    // Check if a match was actually found
    if (exam.questions.length === originalCount) {
        console.warn("⚠️ ID Mismatch. Available IDs in this exam:", exam.questions.map(q => q.id));
        showAlert('Error: Question ID not found in list.', 'error');
        return;
    }

    try {
        // 1. SAVE to Database immediately
        await saveExamToDB(exam);
        
        // 2. SYNC to the main list so the dashboard stays updated
        if (state.exams) {
            const idx = state.exams.findIndex(e => e.exam_id === exam.exam_id);
            if (idx !== -1) state.exams[idx] = JSON.parse(JSON.stringify(exam));
        }

        // 3. Clear editing state if the deleted question was being edited
        if (String(state.editingQuestionId) === String(questionId)) {
            state.editingQuestionId = null;
            const addButton = document.querySelector('button[onclick="addQuestion()"]');
            if (addButton) {
                addButton.innerHTML = 'Add Question';
                addButton.className = "w-full bg-[#B80236] text-white py-3 rounded-xl font-bold hover:bg-[#900028] transition-colors";
            }
        }

        showAlert('Question deleted successfully!', 'success');
        
        // 4. Handle Pagination
        const totalPages = Math.ceil(exam.questions.length / 20);
        if (state.currentQuestionPage > totalPages && totalPages > 0) {
            state.currentQuestionPage = totalPages;
        }
        
        // 5. Re-render UI
        render(); 

    } catch (error) {
        console.error("❌ DB Save Error:", error);
        showAlert('Could not save deletion to database.', 'error');
    }
}

function editExam(examId) {
    const exam = state.availableExams.find(e => e.exam_id === examId);
    
    if (!exam) {
        showAlert('Error: Exam data not found.', 'error');
        return;
    }

    // 1. Set the editing ID
    state.editingExamId = examId;
    
    // 2. CRITICAL: Deep copy the exam data into currentExamData IMMEDIATELY
    // This ensures the form in render.js has data to read
    state.currentExamData = JSON.parse(JSON.stringify(exam));
    
    // 3. Reset any editing question state
    state.editingQuestionId = null;

    console.log('✏️ Editing exam:', state.currentExamData);
    
    // 4. Navigate to page
    setPage('create-exam');
}

async function deleteExam(examId) {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) return;
    
    try {
        // 1. Delete from Database
        await deleteExamFromDB(examId);
        
        // 2. Update Local State immediately (so we don't have to wait for a reload)
        state.availableExams = state.availableExams.filter(e => e.exam_id !== examId);
        
        // 3. Show Success
        showAlert('Exam deleted successfully!', 'success');
        
        // 4. Force Re-render of the dashboard
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

// --- SIMPLIFIED EXPORT (CSV ONLY) ---
/**
 * Main export function - Exports exam as CSV file
 * @param {string} examId - The exam ID to export
 */
async function shareExamAsCSV(examId) {
    const exam = state.availableExams.find(e => e.exam_id === examId);
    
    if (!exam) {
        showAlert('Exam not found.', 'error');
        return;
    }
    
    if (!exam.questions || exam.questions.length === 0) {
        showAlert('This exam has no questions to export.', 'error');
        return;
    }
    
    try {
        console.log(`📤 Exporting exam: ${exam.exam_id} (${exam.questions.length} questions)`);
        
        // --- IMMORTAL FORMAT GENERATION ---
        const headers = ['exam_id', 'subject', 'class', 'duration', 'questions_json'];
        
        // We stringify the questions and escape double quotes for CSV safety
        const questionsJson = JSON.stringify(exam.questions).replace(/"/g, '""');
        
        const dataRow = [
            `"${exam.exam_id}"`,
            `"${exam.subject}"`,
            `"${exam.class}"`,
            `"${exam.duration || 30}"`,
            `"${questionsJson}"` // All questions safely tucked into one cell
        ];

        const csvContent = headers.join(',') + '\n' + dataRow.join(',');
        // --- END GENERATION ---

        const fileName = `${exam.subject.replace(/[^a-z0-9]/gi, '_')}_${exam.class}_Exam.csv`;
        console.log(`📄 CSV file created: ${fileName} (${csvContent.length} bytes)`);

        // Method 1: Capacitor Filesystem + Share
        if (window.Capacitor) {
            console.log('📱 Detected Capacitor environment');
            try {
                const { Filesystem, Share } = window.Capacitor.Plugins;
                if (Filesystem && Share) {
                    const result = await Filesystem.writeFile({
                        path: fileName,
                        data: csvContent,
                        directory: window.Capacitor.Plugins.Filesystem.Directory.Cache,
                        encoding: window.Capacitor.Plugins.Filesystem.Encoding.UTF8
                    });
                    
                    await Share.share({
                        title: `${exam.subject} Exam`,
                        text: `Exam: ${exam.subject} (${exam.class})`,
                        url: result.uri,
                        dialogTitle: 'Share Exam CSV'
                    });
                    
                    showAlert('✅ Exam shared successfully!', 'success');
                    return;
                }
            } catch (err) { console.error('Capacitor share failed', err); }
        }

        // Method 2: FileSharer plugin
        if (window.Capacitor && window.Capacitor.Plugins.FileSharer) {
            try {
                const base64Data = btoa(unescape(encodeURIComponent(csvContent)));
                await window.Capacitor.Plugins.FileSharer.share({
                    filename: fileName,
                    base64Data: base64Data,
                    contentType: 'text/csv'
                });
                showAlert('✅ Exam shared successfully!', 'success');
                return;
            } catch (err) { console.error('FileSharer failed', err); }
        }

        // Method 3: Modern Web Share API
        if (navigator.share) {
            try {
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const file = new File([blob], fileName, { type: 'text/csv' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
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

        // Method 4: Fallback to Direct Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert('✅ Exam exported successfully!', 'success', 3000);

    } catch (error) {
        console.error('❌ Export error:', error);
        showAlert('Failed to export exam.', 'error');
    }
}


/**
 * Fallback download function for browsers that don't support Web Share API
 * @param {Blob|string} content - The CSV content
 * @param {string} filename - The filename to save as
 */
function downloadCSVFallback(content, filename, silent = false) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: 'text/csv;charset=utf-8;' });
    
    // Create temporary download link
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }, 100);

    console.log(`✅ CSV downloaded: ${filename}`);
    
    // Only show detailed instructions if not in silent mode
    if (!silent) {
        showAlert(
            `📥 File saved as "${filename}"\n\n` +
            `📂 Check your Downloads folder\n` +
            `📤 You can now share it via Bluetooth, WhatsApp, Email, etc.`, 
            'info', 
            8000
        );
    }
}

/**
 * Simple wrapper function - Only exports CSV (no options modal)
 * @param {string} examId - The exam ID to export
 */
function shareExamWithOptions(examId) {
    // Directly export as CSV - no format selection
    shareExamAsCSV(examId);
}

/**
 * Main function to handle multiple file imports
 * Allows teachers to select multiple CSV files at once
 */
function handleImportMultipleExams() {
    try {
        console.log('📚 Import multiple exams triggered');
        createMultipleFileInput();
    } catch (error) {
        console.error('❌ Error in handleImportMultipleExams:', error);
        showAlert('Error preparing file import. Check console for details.', 'error', 5000);
    }
}


function handleSmartImport() {
    try {
        console.log('📚 Smart import triggered');
        createSmartFileInput();
    } catch (error) {
        console.error('❌ Error in handleSmartImport:', error);
        showAlert('Error preparing file import. Check console for details.', 'error', 5000);
    }
}

/**
 * Creates a file input that accepts single OR multiple files
 */
function createSmartFileInput() {
    try {
        // Remove any existing file input
        const existingInput = document.getElementById('hidden-file-input-smart');
        if (existingInput) {
            existingInput.remove();
        }

        // Create new file input with MULTIPLE attribute
        const fileInput = document.createElement('input');
        fileInput.id = 'hidden-file-input-smart';
        fileInput.type = 'file';
        fileInput.multiple = true; // 🔥 Allows both single and multiple selection
        
        // Accept only CSV files
        fileInput.accept = '.csv,text/csv,application/csv,text/comma-separated-values,application/vnd.ms-excel';
        
        // Position off-screen
        fileInput.style.cssText = 'position: absolute; top: 0; left: 0; opacity: 0; width: 1px; height: 1px; z-index: -1; pointer-events: auto;';
        
        // Handle file selection
        fileInput.onchange = async (e) => {
            console.log('📄 File(s) selected');
            const files = Array.from(e.target.files || []);
            
            if (files.length === 0) {
                console.log('❌ No files selected');
                return;
            }
            
            console.log(`📚 Selected ${files.length} file(s):`, files.map(f => f.name));
            
            // Validate all files are CSV
            const nonCsvFiles = files.filter(file => {
                const fileName = file.name.toLowerCase();
                return !fileName.endsWith('.csv') && 
                       !file.type.includes('csv') && 
                       !file.type.includes('comma-separated') &&
                       file.type !== 'application/vnd.ms-excel';
            });
            
            if (nonCsvFiles.length > 0) {
                showAlert(
                    `❌ Invalid files detected:\n${nonCsvFiles.map(f => f.name).join('\n')}\n\nPlease select only CSV files.`,
                    'error',
                    6000
                );
                if (fileInput && fileInput.parentNode) {
                    fileInput.remove();
                }
                return;
            }
            
            // 🔥 Smart handling: single file vs multiple files
            if (files.length === 1) {
                console.log('📖 Single file mode');
                await handleExamImport(files[0]);
            } else {
                console.log(`📚 Multiple files mode: ${files.length} files`);
                await importMultipleExams(files);
            }
            
            // Clean up
            setTimeout(() => {
                if (fileInput && fileInput.parentNode) {
                    fileInput.remove();
                }
            }, 100);
        };
        
        // Append to body
        document.body.appendChild(fileInput);
        
        // Trigger file picker
        setTimeout(() => {
            try {
                console.log('🖱️ Opening file picker...');
                fileInput.click();
            } catch (error) {
                console.error('❌ Error triggering file picker:', error);
                showAlert('Cannot open file picker. Please ensure the app has storage permissions.', 'error', 6000);
                if (fileInput && fileInput.parentNode) {
                    fileInput.remove();
                }
            }
        }, 150);
    } catch (error) {
        console.error('❌ Error creating file input:', error);
        showAlert('Error preparing file import: ' + error.message, 'error', 5000);
    }
}


/**
 * Creates file input that accepts multiple files
 */
function createMultipleFileInput() {
    try {
        // Remove any existing file input
        const existingInput = document.getElementById('hidden-file-input-multiple');
        if (existingInput) {
            existingInput.remove();
        }

        // Create new file input with MULTIPLE attribute
        const fileInput = document.createElement('input');
        fileInput.id = 'hidden-file-input-multiple';
        fileInput.type = 'file';
        fileInput.multiple = true; // 🔥 KEY: Allow multiple file selection
        
        // Accept only CSV files
        fileInput.accept = '.csv,text/csv,application/csv,text/comma-separated-values,application/vnd.ms-excel';
        
        // Position off-screen
        fileInput.style.cssText = 'position: absolute; top: 0; left: 0; opacity: 0; width: 1px; height: 1px; z-index: -1; pointer-events: auto;';
        
        // Handle file selection
        fileInput.onchange = async (e) => {
            console.log('📄 Files selected');
            const files = Array.from(e.target.files || []);
            
            if (files.length === 0) {
                console.log('❌ No files selected');
                return;
            }
            
            console.log(`📚 Selected ${files.length} file(s):`, files.map(f => f.name));
            
            // Validate all files are CSV
            const nonCsvFiles = files.filter(file => {
                const fileName = file.name.toLowerCase();
                return !fileName.endsWith('.csv') && 
                       !file.type.includes('csv') && 
                       !file.type.includes('comma-separated') &&
                       file.type !== 'application/vnd.ms-excel';
            });
            
            if (nonCsvFiles.length > 0) {
                showAlert(
                    `❌ Invalid files detected:\n${nonCsvFiles.map(f => f.name).join('\n')}\n\nPlease select only CSV files.`,
                    'error',
                    6000
                );
                if (fileInput && fileInput.parentNode) {
                    fileInput.remove();
                }
                return;
            }
            
            // Process all files
            await importMultipleExams(files);
            
            // Clean up
            setTimeout(() => {
                if (fileInput && fileInput.parentNode) {
                    fileInput.remove();
                }
            }, 100);
        };
        
        // Append to body
        document.body.appendChild(fileInput);
        
        // Trigger file picker
        setTimeout(() => {
            try {
                console.log('🖱️ Opening file picker...');
                fileInput.click();
            } catch (error) {
                console.error('❌ Error triggering file picker:', error);
                showAlert('Cannot open file picker. Please ensure the app has storage permissions.', 'error', 6000);
                if (fileInput && fileInput.parentNode) {
                    fileInput.remove();
                }
            }
        }, 150);
    } catch (error) {
        console.error('❌ Error creating file input:', error);
        showAlert('Error preparing file import: ' + error.message, 'error', 5000);
    }
}

/**
 * Imports multiple exam files sequentially
 * @param {File[]} files - Array of File objects to import
 */
async function importMultipleExams(files) {
    const results = {
        total: files.length,
        successful: [],
        failed: [],
        skipped: []
    };
    
    showAlert(`📚 Importing ${files.length} exam(s)...`, 'info', 3000);
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            console.log(`\n📖 [${i + 1}/${files.length}] Processing: ${file.name}`);
            showAlert(`📖 Importing ${i + 1}/${files.length}: ${file.name}...`, 'info', 2000);
            
            // Read file
            const content = await readFileAsText(file);
            
            // Parse CSV
            let exam;
            try {
                exam = parseCSVWithBetterHandling(content);
            } catch (csvError) {
                throw new Error(`Invalid CSV format: ${csvError.message}`);
            }
            
            if (!exam.questions || exam.questions.length === 0) {
                throw new Error('No questions found in file');
            }
            
            // Normalize and validate
            exam = normalizeExamData(exam);
            const validationError = validateExamStructure(exam);
            if (validationError) {
                throw new Error(`Validation failed: ${validationError.substring(0, 100)}...`);
            }
            
            // Check for existing exam
            const existing = state.availableExams.find(e => e.exam_id === exam.exam_id);
            if (existing) {
                console.log(`⚠️ Exam "${exam.exam_id}" already exists`);
                
                // Auto-skip duplicates (or you can prompt for each one)
                results.skipped.push({
                    file: file.name,
                    examId: exam.exam_id,
                    reason: 'Already exists'
                });
                continue;
            }
            
            // Add metadata
            exam.created_by = state.user?.phone_number || 'teacher';
            exam.created_date = new Date().toISOString().split('T')[0];
            
            // Save to database
            await saveExamToDB(exam);
            
            results.successful.push({
                file: file.name,
                examId: exam.exam_id,
                subject: exam.subject,
                questionCount: exam.questions.length
            });
            
            console.log(`✅ Successfully imported: ${exam.exam_id}`);
            
        } catch (error) {
            console.error(`❌ Failed to import ${file.name}:`, error);
            results.failed.push({
                file: file.name,
                error: error.message
            });
        }
        
        // Small delay between imports
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Reload exams
    await loadExams();
    
    // Show comprehensive results
    showImportResults(results);
    
    // Refresh UI
    if (state.currentPage === 'teacher') {
        render();
    }
}

/**
 * Displays detailed import results to the user
 * @param {Object} results - Import results object
 */
function showImportResults(results) {
    let message = `📊 Import Complete!\n\n`;
    
    if (results.successful.length > 0) {
        message += `✅ Successfully imported ${results.successful.length} exam(s):\n`;
        results.successful.forEach(item => {
            message += `   • ${item.subject} (${item.questionCount} questions)\n`;
        });
        message += '\n';
    }
    
    if (results.skipped.length > 0) {
        message += `⏭️ Skipped ${results.skipped.length} exam(s):\n`;
        results.skipped.forEach(item => {
            message += `   • ${item.file} - ${item.reason}\n`;
        });
        message += '\n';
    }
    
    if (results.failed.length > 0) {
        message += `❌ Failed ${results.failed.length} exam(s):\n`;
        results.failed.forEach(item => {
            message += `   • ${item.file}\n     ${item.error.substring(0, 50)}...\n`;
        });
    }
    
    let alertType = 'success';
    if (results.successful.length === 0) {
        alertType = 'error';
    } else if (results.failed.length > 0 || results.skipped.length > 0) {
        alertType = 'info';
    }
    
    showAlert(message, alertType, 10000);
    console.log('\n📊 IMPORT SUMMARY:', results);
}

/**
 * Enhanced version that prompts for duplicates
 * (Optional - use instead of importMultipleExams if you want user to decide on duplicates)
 */
async function importMultipleExamsWithPrompts(files) {
    const results = {
        total: files.length,
        successful: [],
        failed: [],
        skipped: []
    };
    
    showAlert(`📚 Importing ${files.length} exam(s)...`, 'info', 3000);
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            console.log(`\n📖 [${i + 1}/${files.length}] Processing: ${file.name}`);
            showAlert(`📖 Importing ${i + 1}/${files.length}: ${file.name}...`, 'info', 2000);
            
            const content = await readFileAsText(file);
            let exam = parseCSVWithBetterHandling(content);
            
            if (!exam.questions || exam.questions.length === 0) {
                throw new Error('No questions found');
            }
            
            exam = normalizeExamData(exam);
            const validationError = validateExamStructure(exam);
            if (validationError) {
                throw new Error(`Validation failed`);
            }
            
            // Check for duplicates and PROMPT user
            const existing = state.availableExams.find(e => e.exam_id === exam.exam_id);
            if (existing) {
                const replace = confirm(
                    `⚠️ Duplicate Found!\n\n` +
                    `File: ${file.name}\n` +
                    `Exam ID: ${exam.exam_id}\n\n` +
                    `Current: ${existing.questions.length} questions\n` +
                    `New: ${exam.questions.length} questions\n\n` +
                    `Replace existing exam?`
                );
                
                if (!replace) {
                    results.skipped.push({
                        file: file.name,
                        examId: exam.exam_id,
                        reason: 'User chose to keep existing'
                    });
                    continue;
                }
                
                await deleteExamFromDB(exam.exam_id);
            }
            
            exam.created_by = state.user?.phone_number || 'teacher';
            exam.created_date = new Date().toISOString().split('T')[0];
            
            await saveExamToDB(exam);
            
            results.successful.push({
                file: file.name,
                examId: exam.exam_id,
                subject: exam.subject,
                questionCount: exam.questions.length
            });
            
            console.log(`✅ Successfully imported: ${exam.exam_id}`);
            
        } catch (error) {
            console.error(`❌ Failed to import ${file.name}:`, error);
            results.failed.push({
                file: file.name,
                error: error.message
            });
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    await loadExams();
    showImportResults(results);
    
    if (state.currentPage === 'teacher') {
        render();
    }
}

// ============================================
// EXPORT MULTIPLE EXAMS (Enhanced version)
// ============================================

/**
 * Export multiple exams at once with progress tracking
 * @param {Array<string>} examIds - Array of exam IDs to export
 */
async function exportMultipleExams(examIds) {
    if (!examIds || examIds.length === 0) {
        showAlert('No exams selected for export', 'error');
        return;
    }
    
    showAlert(`📤 Preparing ${examIds.length} exam(s) for export...`, 'info', 3000);
    
    const results = {
        total: examIds.length,
        successful: [],
        failed: []
    };
    
    // Prepare all files first
    const filesToShare = [];
    
    for (let i = 0; i < examIds.length; i++) {
        const examId = examIds[i];
        const exam = state.availableExams.find(e => e.exam_id === examId);
        
        if (!exam) {
            results.failed.push({ examId, reason: 'Exam not found' });
            continue;
        }
        
        try {
            const csvContent = jsonToCsv(exam);
            const fileName = `${exam.subject.replace(/[^a-z0-9]/gi, '_')}_${exam.class}_Exam.csv`;
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            
            filesToShare.push({
                blob,
                fileName,
                exam
            });
            
            results.successful.push({
                examId: exam.exam_id,
                subject: exam.subject,
                fileName: fileName
            });
            
        } catch (error) {
            console.error(`❌ Failed to prepare ${examId}:`, error);
            results.failed.push({ examId, reason: error.message });
        }
    }
    
    if (filesToShare.length === 0) {
        showAlert('No files to export', 'error');
        return;
    }
    
    // Try to share multiple files on mobile
    await shareMultipleFiles(filesToShare, results);
}


/**
 * Smart sharing function that handles multiple files on mobile
 * @param {Array} filesToShare - Array of {blob, fileName, exam} objects
 * @param {Object} results - Results tracking object
 */
async function shareMultipleFiles(filesToShare, results) {
    const totalFiles = filesToShare.length;
    
    try {
        // Method 1: Try Capacitor Filesystem + Share (Best for multiple files)
        if (window.Capacitor && window.Capacitor.Plugins.Filesystem && window.Capacitor.Plugins.Share) {
            console.log('📱 Using Capacitor for multiple files');
            
            const { Filesystem } = window.Capacitor.Plugins;
            const { Share } = window.Capacitor.Plugins;
            
            // Write all files to cache
            const fileUris = [];
            for (const fileData of filesToShare) {
                const result = await Filesystem.writeFile({
                    path: fileData.fileName,
                    data: await fileData.blob.text(),
                    directory: window.Capacitor.Plugins.Filesystem.Directory.Cache,
                    encoding: window.Capacitor.Plugins.Filesystem.Encoding.UTF8
                });
                fileUris.push(result.uri);
            }
            
            // Share all files together
            await Share.share({
                title: `${totalFiles} Exam Files`,
                text: `Sharing ${totalFiles} exam(s)`,
                url: fileUris[0], // Primary file
                dialogTitle: 'Share Exam Files'
            });
            
            showAlert(`✅ ${totalFiles} exam(s) shared successfully!`, 'success', 3000);
            return;
        }
        
        // Method 2: Try Web Share API with multiple files
        if (navigator.share && navigator.canShare) {
            console.log('🌐 Trying Web Share API for multiple files');
            
            const files = await Promise.all(
                filesToShare.map(async (fileData) => {
                    return new File([fileData.blob], fileData.fileName, { type: 'text/csv' });
                })
            );
            
            if (navigator.canShare({ files })) {
                await navigator.share({
                    files,
                    title: `${totalFiles} Exam Files`,
                    text: `Sharing ${totalFiles} exam(s)`
                });
                
                showAlert(`✅ ${totalFiles} exam(s) shared successfully!`, 'success', 3000);
                return;
            }
        }
        
        // Method 3: Share files one by one (with better UX)
        if (navigator.share) {
            console.log('🔄 Sharing files sequentially...');
            
            for (let i = 0; i < filesToShare.length; i++) {
                const fileData = filesToShare[i];
                
                showAlert(
                    `📤 Share ${i + 1}/${totalFiles}\n${fileData.exam.subject}`,
                    'info',
                    2000
                );
                
                const file = new File([fileData.blob], fileData.fileName, { type: 'text/csv' });
                
                try {
                    await navigator.share({
                        files: [file],
                        title: fileData.exam.subject,
                        text: `${fileData.exam.subject} - ${fileData.exam.class}`
                    });
                    
                    // Small delay between shares
                    if (i < filesToShare.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (shareError) {
                    if (shareError.name === 'AbortError') {
                        // User cancelled
                        const continueSharing = confirm(
                            `Share cancelled. ${totalFiles - i - 1} files remaining.\n\nContinue sharing?`
                        );
                        if (!continueSharing) break;
                    } else {
                        throw shareError;
                    }
                }
            }
            
            showAlert(`✅ Export complete!`, 'success', 3000);
            return;
        }
        
    } catch (error) {
        console.error('❌ Sharing failed:', error);
        console.log('💾 Falling back to download...');
    }
    
    // Fallback: Download all files
    console.log('💾 Downloading all files...');
    showAlert(`📥 Downloading ${totalFiles} file(s)...`, 'info', 2000);
    
    for (let i = 0; i < filesToShare.length; i++) {
        const fileData = filesToShare[i];
        
        // Silent download (no alert for each file)
        downloadCSVFallback(fileData.blob, fileData.fileName, true);
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Show summary after all downloads
    showAlert(
        `✅ ${totalFiles} exam(s) downloaded!\n\n` +
        `📂 Check your Downloads folder\n` +
        `📤 You can now share them via any app`,
        'success',
        6000
    );
    
    console.log(`✅ ${totalFiles} files downloaded successfully`);
}


function exportAllExams() {
    if (state.availableExams.length === 0) {
        showAlert('No exams to export', 'error');
        return;
    }
    
    const confirmExport = confirm(
        `📦 Export All Exams?\n\n` +
        `You are about to export ${state.availableExams.length} exam(s).\n\n` +
        `On mobile: Files will be shared via your device's sharing menu\n` +
        `On desktop: Files will be downloaded\n\n` +
        `Continue?`
    );
    
    if (!confirmExport) return;
    
    const examIds = state.availableExams.map(exam => exam.exam_id);
    exportMultipleExams(examIds);
}

// SIMPLIFIED SHARE FUNCTION - ONLY CSV
function shareExamWithOptions(examId) {
    // Directly share as CSV - no modal with options
    shareExamAsCSV(examId);
}

function viewDetailedResult(resultId) {
    const result = state.allResults.find(r => r.result_id === resultId);
    
    if (result) {
        state.lastResult = result;
        state.showResultModal = true;
        state.answersExpanded = false;
        render();
    } else {
        showAlert('Result not found', 'error');
    }
}

function closeResultModal() {
    state.showResultModal = false;
    state.lastResult = null;
    state.answersExpanded = false;
    
    state.studentInfo = { name: '', class: '', arms: '' };
    
    setPage('student-info');
}

function toggleAnswers() {
    state.answersExpanded = !state.answersExpanded;
    render();
}

function toggleFilterModal() {
    state.showFilterModal = !state.showFilterModal;
    render();
}

function clearFilters() {
    state.resultFilter = { subject: '', class: '', arms: '' };
    render();
}

// Helper function to get filtered results
function getFilteredResults() {
    let filtered = [...state.allResults];
    
    console.log('Filtering results:', {
        total: filtered.length,
        filters: state.resultFilter
    });
    
    // Apply subject filter
    if (state.resultFilter.subject && state.resultFilter.subject !== '') {
        filtered = filtered.filter(r => 
            r.exam_subject && 
            r.exam_subject.toLowerCase().includes(state.resultFilter.subject.toLowerCase())
        );
        console.log(`After subject filter: ${filtered.length} results`);
    }
    
    // Apply class filter
    if (state.resultFilter.class && state.resultFilter.class !== '') {
        filtered = filtered.filter(r => 
            r.student_class && 
            r.student_class.toLowerCase().includes(state.resultFilter.class.toLowerCase())
        );
        console.log(`After class filter: ${filtered.length} results`);
    }
    
    // Apply arms filter
    if (state.resultFilter.arms && state.resultFilter.arms !== '') {
        filtered = filtered.filter(r => 
            r.student_arms && 
            r.student_arms.toLowerCase().includes(state.resultFilter.arms.toLowerCase())
        );
        console.log(`After arms filter: ${filtered.length} results`);
    }
    
    console.log(`Final filtered results: ${filtered.length}`);
    return filtered;
}

function applyFilters() {
    const subject = document.getElementById('filter-subject').value;
    const studentClass = document.getElementById('filter-class').value;
    const arms = document.getElementById('filter-arms').value;
    
    state.resultFilter = { subject, class: studentClass, arms };
    toggleFilterModal();
}


async function loadExams() {
    try {
        let exams = [];
        if (state.isAuthenticated && state.isTeacher && state.user?.phone_number) {
            exams = await loadExamsByCreator(state.user.phone_number);
        } else {
            exams = await loadAllExamsFromDB();
        }
        state.availableExams = exams || [];
        console.log('✅ Exams loaded:', state.availableExams.length);
    } catch (err) {
        console.error('Error loading exams:', err);
        state.availableExams = [];
        showAlert('Failed to load exams from database.', 'error');
    }
}

async function loadResults() {
    try {
        const results = await loadResultsFromDB();
        state.allResults = results || [];
        console.log('✅ Results loaded:', state.allResults.length);
    } catch (err) {
        console.error('Error loading results:', err);
        state.allResults = [];
        // showAlert('Failed to load results.', 'error');  // optional
    }
}

// ========================================
// IMAGE UPLOAD SYSTEM FOR QUESTIONS
// Add these functions to your app.js
// ========================================

// Global state for current question image
let currentQuestionImage = null;

// Handle image file selection
function handleQuestionImageUpload(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showAlert('Please select an image file (PNG, JPG, GIF, etc.)', 'error');
        return;
    }
    
    // Validate file size (max 5MB for mobile compatibility)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showAlert('Image is too large. Please use an image under 5MB.', 'error');
        return;
    }
    
    // Read the file as base64
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const base64Image = e.target.result;
        currentQuestionImage = base64Image;
        
        // Show preview
        displayImagePreview(base64Image);
        
        showAlert('Image uploaded successfully!', 'success', 2000);
    };
    
    reader.onerror = function() {
        showAlert('Failed to read image file. Please try again.', 'error');
    };
    
    reader.readAsDataURL(file);
}

// Display image preview
function displayImagePreview(base64Image) {
    const previewContainer = document.getElementById('image-preview-container');
    if (!previewContainer) return;
    
    previewContainer.innerHTML = `
        <div class="relative inline-block">
            <img src="${base64Image}" 
                 alt="Question Image" 
                 class="max-w-full max-h-64 rounded-lg border-2 border-gray-300 shadow-md" />
            <button type="button" 
                    onclick="removeQuestionImage()" 
                    class="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 shadow-lg transition-colors"
                    title="Remove image">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>
    `;
    
    // Re-create Lucide icons
    if (window.lucide) lucide.createIcons();
}

// Remove question image
function removeQuestionImage() {
    currentQuestionImage = null;
    const previewContainer = document.getElementById('image-preview-container');
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
    
    // Clear file input
    const fileInput = document.getElementById('question-image-input');
    if (fileInput) {
        fileInput.value = '';
    }
    
    showAlert('Image removed', 'info', 2000);
}

// Trigger file input click
function triggerImageUpload() {
    const fileInput = document.getElementById('question-image-input');
    if (fileInput) {
        fileInput.click();
    }
}


// Handle paste event for images
function handlePasteImage(event) {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            event.preventDefault(); // Prevent default paste behavior
            
            const blob = items[i].getAsFile();
            
            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024;
            if (blob.size > maxSize) {
                showAlert('Image is too large. Please use an image under 5MB.', 'error');
                return;
            }
            
            // Convert to base64
            const reader = new FileReader();
            reader.onload = function(e) {
                currentQuestionImage = e.target.result;
                displayImagePreview(e.target.result);
                showAlert('Image pasted successfully!', 'success', 2000);
            };
            reader.onerror = function() {
                showAlert('Failed to read pasted image. Please try again.', 'error');
            };
            reader.readAsDataURL(blob);
            
            break; // Only handle first image
        }
    }
}

// Initialize paste listener when on Create Exam page
function initPasteListener() {
    // Remove existing listener if any
    document.removeEventListener('paste', handlePasteImage);
    
    // Add paste listener
    document.addEventListener('paste', handlePasteImage);
    
    console.log('✅ Paste listener initialized for images');
}

// Clean up paste listener when leaving Create Exam page
function cleanupPasteListener() {
    document.removeEventListener('paste', handlePasteImage);
    console.log('🧹 Paste listener removed');
}


// ========================================
// RENDERING IMAGES IN EXAM INTERFACE
// Add this helper function
// ========================================

function renderQuestionImage(question) {
    if (!question.image) return '';
    
    return `
        <div class="mb-6 flex justify-center">
            <img src="${question.image}" 
                 alt="Question diagram" 
                 class="max-w-full max-h-96 rounded-lg border-2 border-gray-300 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                 onclick="openImageModal('${question.image}')" />
        </div>
    `;
}

// Image modal for full-screen view
function openImageModal(imageSrc) {
    const modal = document.createElement('div');
    modal.id = 'image-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="relative max-w-7xl max-h-full">
            <img src="${imageSrc}" 
                 alt="Full size image" 
                 class="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
            <button onclick="closeImageModal()" 
                    class="absolute top-4 right-4 bg-white text-gray-800 rounded-full p-3 hover:bg-gray-200 shadow-lg transition-colors">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    if (window.lucide) lucide.createIcons();
    
    // Close on click outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeImageModal();
        }
    });
}

function closeImageModal() {
    const modal = document.getElementById('image-modal');
    if (modal) {
        modal.remove();
    }
}

function setPage(page) {
    // ONLY reset when LEAVING exam page
    if (state.currentPage === 'exam' && page !== 'exam') {
        state.selectedExam = null;
        state.shuffledExam = null;
        state.studentAnswers = {};
        state.currentQuestionIndex = 0;
        state.timeRemaining = 0;
        
        if (state.examTimer) {
            clearInterval(state.examTimer);
            state.examTimer = null;
        }
    }
    
    state.currentPage = page;
    render();
}


// Add these functions to your main JavaScript file

// Change question page and re-render
function changeQuestionPage(page) {
    state.currentQuestionPage = page;
    render(); // Your main render function
    
    // Scroll to questions list smoothly
    setTimeout(() => {
        const questionsList = document.getElementById('questions-list');
        if (questionsList) {
            questionsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}



// Optional: Reset to page 1 when adding/deleting questions
function resetQuestionPagination() {
    state.currentQuestionPage = 1;
}

// =======================================================
// ========== GLOBAL FUNCTION DEFINITIONS (END) ==========
// =======================================================

// Expose only necessary functions globally
window.state = state;
window.setPage = setPage;
window.handleTeacherLogin = handleTeacherLogin;
window.handleTeacherRegistration = handleTeacherRegistration;
window.submitStudentInfo = submitStudentInfo;
window.startExam = startExam;
window.startExamSafe = startExamSafe;
window.handleImportExam = handleImportExam;
window.updateAnswer = updateAnswer;
window.nextQuestion = nextQuestion;
window.previousQuestion = previousQuestion;
window.goToQuestion = goToQuestion;
window.submitExam = submitExam;
window.toggleSymbolBank = toggleSymbolBank;
window.insertSymbol = insertSymbol;
window.addQuestion = addQuestion;
window.deleteQuestion = deleteQuestion;
window.saveExam = saveExam;
window.editExam = editExam;
window.deleteExam = deleteExam;
window.toggleFilterModal = toggleFilterModal;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.viewDetailedResult = viewDetailedResult;
window.closeResultModal = closeResultModal;
window.toggleAnswers = toggleAnswers;
window.hideAlert = hideAlert;
window.toggleQuestionOptions = toggleQuestionOptions;
window.changeQuestion = changeQuestion;
window.changeQuestionPage = changeQuestionPage;
window.editQuestion = editQuestion;
window.logout = logout;
 window.shareExamWithOptions = shareExamWithOptions;
 window.importMultipleExams = importMultipleExams;
 window.importMultipleExamsWithPrompts = importMultipleExamsWithPrompts;
 window.exportMultipleExams = exportMultipleExams;
 window.handleSmartImport = handleSmartImport;
 window.importMultipleExams = importMultipleExams;
 window.exportAllExams = exportAllExams;
 window.toggleSymbolBank = toggleSymbolBank;
 window.insertSymbol = insertSymbol;
 window.insertCustomSubscript = insertCustomSubscript;
 window.insertCustomSuperscript = insertCustomSuperscript;  
 window.renderQuestionImage = renderQuestionImage;
 window.openImageModal = openImageModal;
 window.closeImageModal = closeImageModal;
 window.handleExamOfficeLogin = handleExamOfficeLogin;
 window.handleExamOfficeRegistration = handleExamOfficeRegistration;
 window.toggleExamSchedule = toggleExamSchedule;
window.handleQuestionImageUpload = handleQuestionImageUpload;
window.removeQuestionImage = removeQuestionImage;
window.triggerImageUpload = triggerImageUpload;
window.handlePasteImage = handlePasteImage;
window.initPasteListener = initPasteListener;
window.cleanupPasteListener = cleanupPasteListener;
window.shareExamWithOptions = shareExamWithOptions;
window.shareMultipleFiles = shareMultipleFiles;
window.importMultipleExams = importMultipleExams;
window.importMultipleExamsWithPrompts = importMultipleExamsWithPrompts;
window.exportMultipleExams = exportMultipleExams;
window.handleSmartImport = handleSmartImport;
window.shareMultipleFiles = shareMultipleFiles;
window.getFilteredResults = getFilteredResults;
// Use the primary logout function — save original and wrap with confirmation
window._logoutOriginal = logout;
window.logout = () => {
    if (!confirm("Are you sure you want to log out?")) return;
    if (typeof window._logoutOriginal === 'function') {
        window._logoutOriginal();
    }
};



// =======================================================
// ========== INITIALIZATION ==========
// =======================================================

function init() {
    console.log('🚀 Starting initialization...');
    updateLoadingStatus('Starting app...');
    
    try {
        if (!window.indexedDB) {
            throw new Error('IndexedDB is not supported');
        }
        
        initDB().then(() => {
            return loadExams();
        }).then(() => {
            return loadResults();
        }).then(() => {
            console.log('🎨 Rendering app...');
            
            // 1. First, render the HTML to the screen
            render(); 
            
            // 2. NOW attach the Electron listeners because the buttons exist
            handleElectronButtons(); 

            console.log('✅ App initialized successfully');
            updateLoadingStatus('Ready!');
            
        }).catch(error => {
            console.error('❌ Initialization error:', error);
            showErrorPage(error);
        });
        
    } catch (error) {
        showErrorPage(error);
    }

    // Move the function definition here (or keep it outside)
    function handleElectronButtons() {
        const closeBtn = document.getElementById('close-app-btn');
        const minBtn = document.getElementById('minimize-app-btn');

        // Added a check to see if we are actually in Electron
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (window.electronAPI) {
                    window.electronAPI.closeApp();
                } else {
                    console.warn('Running in web mode - close disabled');
                }
            });
        }
        
        if (minBtn) {
            minBtn.addEventListener('click', () => {
                if (window.electronAPI && window.electronAPI.minimizeApp) {
                    window.electronAPI.minimizeApp();
                } else {
                    console.warn('Running in web mode - minimize disabled');
                }
            });
        }
    }
}

function updateLoadingStatus(message) {
    const statusElement = document.getElementById('loading-status');
    if (statusElement) {
        statusElement.textContent = message;
    }
    console.log('📝 Status:', message);
}

function showErrorPage(error) {
    const app = document.getElementById('app');
    if (!app) {
        console.error('App container not found!');
        return;
    }
    
    app.innerHTML = `
        <div class="min-h-screen bg-red-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="alert-triangle" class="w-8 h-8 text-red-600"></i>
                </div>
                <h2 class="text-xl font-bold text-gray-800 mb-2">Initialization Error</h2>
                <p class="text-gray-600 mb-4">${error.message || 'Failed to initialize the application'}</p>
                <details class="text-left mb-4">
                    <summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                        Technical Details
                    </summary>
                    <pre class="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">${error.stack || error.toString()}</pre>
                </details>
                <button onclick="location.reload()" class="bg-[#B80236] text-white px-6 py-2 rounded-lg hover:bg-[#900028] transition-colors">
                    Refresh Page
                </button>
            </div>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

// Make init available globally
window.init = init;

if (typeof window !== 'undefined') {
    window.submitExam = submitExam;
    
    window.setPage = (page) => {
        state.currentPage = page;
        render();
    };
}

init();