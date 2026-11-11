// utils.js - Utility Functions
// Core utility functions used across the application

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
            const rawStudentAnswer = answers[q.id];
            const studentAnswer = (rawStudentAnswer == null) ? '' : String(rawStudentAnswer);
            const correctAnswerRaw = q.correct_answer == null ? '' : String(q.correct_answer);

            console.log(`📝 Question ${index + 1} (ID: ${q.id}):`, {
                type: q.type,
                studentAnswer: studentAnswer,
                correctAnswer: correctAnswerRaw,
                isEssay: q.type === 'essay'
            });

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

    if (!silent) {
        showAlert(`The file "${filename}" has been saved. Please open your phone's File Manager and find it in the **Download** folder to share it manually via Bluetooth or other apps.`, 'info', 10000);
    }
}

function jsonToCsv(exam) {
    const headers = ['exam_id', 'subject', 'class', 'duration', 'assessment_type', 'scheduled_date', 'questions_json'];

    const questionsSafe = JSON.stringify(exam.questions.map(q => ({
        ...q,
        options: q.options && q.options.length > 0
            ? q.options
            : ["Option A", "Option B", "Option C", "Option D"]
    })));

    const row = [
        exam.exam_id,
        exam.subject,
        exam.class,
        exam.duration || 30,
        exam.assessmentType || 'EXAM',
        exam.scheduledDate || '',
        questionsSafe
    ];

    return headers.join(',') + '\n' + row.map(escapeCSVField).join(',');
}

function parseCSVWithBetterHandling(csvText) {
    const rows = parseCSVRows(csvText);
    if (rows.length < 2) throw new Error('File appears to be empty or invalid.');

    const headers = rows[0].map(header =>
        header.trim().replace(/^\uFEFF/, '').toLowerCase().replace(/[\s-]+/g, '_')
    );
    const columnIndex = (...names) => names
        .map(name => headers.indexOf(name))
        .find(index => index !== -1);
    const getValue = (row, ...names) => {
        const index = columnIndex(...names);
        return index === undefined ? '' : (row[index] || '').trim();
    };

    const exam = {
        exam_id: getValue(rows[1], 'exam_id', 'examid') || rows[1][0] || 'N/A',
        subject: getValue(rows[1], 'subject') || rows[1][1] || 'Unknown Subject',
        class: getValue(rows[1], 'class', 'grade') || rows[1][2] || 'Unknown Class',
        duration: parseInt(getValue(rows[1], 'duration'), 10) || parseInt(rows[1][3], 10) || 30,
        assessmentType: getValue(rows[1], 'assessment_type', 'assessmenttype') || 'EXAM',
        scheduledDate: getValue(rows[1], 'scheduled_date', 'scheduleddate') || null,
        questions: []
    };

    const questionsColumn = columnIndex('questions_json', 'questionsjson', 'question_json');
    if (questionsColumn !== undefined) {
        const questionsJson = rows[1][questionsColumn];
        try {
            exam.questions = JSON.parse(questionsJson);
        } catch (error) {
            throw new Error('The questions_json field contains invalid JSON.');
        }
        if (!Array.isArray(exam.questions)) {
            throw new Error('The questions_json field must contain a JSON array.');
        }
        return exam;
    }

    const questionIdColumn = columnIndex('question_id', 'id');
    const questionTypeColumn = columnIndex('question_type', 'type');
    const questionTextColumn = columnIndex('question', 'question_text');
    const correctAnswerColumn = columnIndex('correct_answer', 'answer');
    const optionsColumn = columnIndex('options', 'options_json');
    const optionColumns = ['option_a', 'option_b', 'option_c', 'option_d'].map(name => headers.indexOf(name));

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row.some(value => value.trim())) continue;

        let options;
        if (optionsColumn !== undefined && row[optionsColumn]) {
            try {
                options = JSON.parse(row[optionsColumn]);
            } catch (error) {
                options = row[optionsColumn].split('|').map(option => option.trim());
            }
        } else if (optionColumns.some(index => index !== -1)) {
            options = optionColumns.map(index => index === -1 ? '' : row[index] || '').filter(Boolean);
        } else {
            options = row.slice(8, 12);
        }

        exam.questions.push({
            id: (questionIdColumn === undefined ? row[5] : row[questionIdColumn]) || Date.now() + i,
            type: (questionTypeColumn === undefined ? row[6] : row[questionTypeColumn]) || 'multiple_choice',
            question: (questionTextColumn === undefined ? row[7] : row[questionTextColumn]) || '',
            options,
            correct_answer: (correctAnswerColumn === undefined ? row[12] : row[correctAnswerColumn]) || ''
        });
    }

    return exam;
}

function parseCSVRows(csvText) {
    const text = String(csvText || '').replace(/^\uFEFF/, '');
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            if (inQuotes && text[i + 1] === '"') {
                field += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            row.push(field);
            field = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            row.push(field);
            if (row.some(value => value.trim())) rows.push(row);
            row = [];
            field = '';
            if (char === '\r' && text[i + 1] === '\n') i++;
        } else {
            field += char;
        }
    }
    if (inQuotes) throw new Error('CSV contains an unterminated quoted field.');
    row.push(field);
    if (row.some(value => value.trim())) rows.push(row);
    return rows;
}

function escapeCSVField(value) {
    return `"${String(value === null || value === undefined ? '' : value).replace(/"/g, '""')}"`;
}

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

function validateImportedExam(exam) {
    const issues = [];
    
    const questionIds = exam.questions.map(q => q.id);
    const duplicateIds = questionIds.filter((id, index) => questionIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
        issues.push(`Duplicate question IDs found: ${[...new Set(duplicateIds)].join(', ')}`);
    }
    
    exam.questions.forEach((q, idx) => {
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

function normalizeExamData(exam) {
    exam.questions = exam.questions.map(q => {
        if (q.type) {
            const normalizedType = q.type.toLowerCase().trim();
            if (normalizedType === 'truefalse' || normalizedType === 'true_false') {
                q.type = 'true_false';
            }
        }
        
        if (q.type === 'multiple_choice' && (!q.options || q.options.length < 4)) {
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

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        console.log('📖 Starting to read file:', file.name);
        
        const maxSize = 10 * 1024 * 1024;
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
        
        const timeout = setTimeout(() => {
            reader.abort();
            reject(new Error('File reading timeout - file may be too large or corrupted'));
        }, 30000);
        
        reader.onloadend = function() {
            clearTimeout(timeout);
        };
        
        console.log('🔄 Reading file as text...');
        reader.readAsText(file, 'UTF-8');
    });
}

function downloadCSVFallback(content, filename, silent = false) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: 'text/csv;charset=utf-8;' });
    
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }, 100);

    console.log(`✅ CSV downloaded: ${filename}`);
    
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

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Export to global scope
window.shuffleArray = shuffleArray;
window.formatTime = formatTime;
window.calculateScore = calculateScore;
window.jsonToCsv = jsonToCsv;
window.parseCSVWithBetterHandling = parseCSVWithBetterHandling;
window.parseCSVLine = parseCSVLine;
window.validateImportedExam = validateImportedExam;
window.validateExamStructure = validateExamStructure;
window.normalizeExamData = normalizeExamData;
window.readFileAsText = readFileAsText;
window.downloadFileFallback = downloadFileFallback;
window.downloadCSVFallback = downloadCSVFallback;
window.fileToBase64 = fileToBase64;