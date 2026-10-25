// exam-officer.actions.js - Exam Officer Actions
// Handles exam uploads, imports, exports, and scheduling

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
    pendingUploadFiles = [];
    const statusEl = document.getElementById('upload-status');
    const fileListEl = document.getElementById('file-list');
    const filesInfoEl = document.getElementById('files-selected-info');
    if (fileListEl) fileListEl.innerHTML = '';

    const nonCsvFiles = files.filter(file => {
        const name = file.name.toLowerCase();
        return !name.endsWith('.csv') && !file.type.includes('csv');
    });

    if (nonCsvFiles.length > 0) {
        if (statusEl) statusEl.classList.add('hidden');
        const uploadZone = document.getElementById('upload-zone');
        if (uploadZone) uploadZone.classList.remove('has-file');
        showAlert(`❌ Non-CSV files detected:\n${nonCsvFiles.map(f => f.name).join('\n')}\n\nOnly CSV files are accepted.`, 'error', 5000);
        return;
    }

    if (files.length === 0) {
        if (statusEl) statusEl.classList.add('hidden');
        return;
    }

    pendingUploadFiles = files;

    if (statusEl) statusEl.classList.remove('hidden');
    if (filesInfoEl) filesInfoEl.textContent = `${files.length} file(s) selected • Reading...`;
    const uploadZone = document.getElementById('upload-zone');
    if (uploadZone) uploadZone.classList.add('has-file');

    let totalQuestions = 0;
    const fileRows = files.map(file => {
        const item = document.createElement('div');
        item.className = 'file-list-item';

        const details = document.createElement('div');
        details.className = 'min-w-0';
        const name = document.createElement('p');
        name.className = 'text-sm font-medium text-gray-800 truncate';
        name.textContent = file.name;
        const summary = document.createElement('p');
        summary.className = 'text-xs text-gray-500';
        summary.textContent = 'Reading CSV...';
        details.append(name, summary);

        const status = document.createElement('span');
        status.className = 'text-xs text-gray-500 font-semibold';
        status.textContent = 'Reading';
        item.append(details, status);
        if (fileListEl) fileListEl.appendChild(item);
        return { summary, status };
    });

    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const exam = parseCSVWithBetterHandling(e.target.result);
                totalQuestions += exam.questions?.length || 0;
                fileRows[index].summary.textContent =
                    `${exam.subject || 'Unknown'} • ${exam.class || 'N/A'} • ${exam.questions?.length || 0} questions${exam.duration ? ' • ' + exam.duration + ' min' : ''}`;
                fileRows[index].status.className = 'text-xs text-green-600 font-semibold';
                fileRows[index].status.textContent = '✓ Valid';
                if (filesInfoEl) {
                    filesInfoEl.textContent = `${files.length} file(s) selected • ${totalQuestions} total questions`;
                }
            } catch (err) {
                fileRows[index].summary.className = 'text-xs text-red-500';
                fileRows[index].summary.textContent = err.message || 'Invalid CSV format';
                fileRows[index].status.className = 'text-xs text-red-600 font-semibold';
                fileRows[index].status.textContent = '✗ Error';
            }
        };
        reader.onerror = function() {
            fileRows[index].summary.className = 'text-xs text-red-500';
            fileRows[index].summary.textContent = 'Failed to read file';
            fileRows[index].status.className = 'text-xs text-red-600 font-semibold';
            fileRows[index].status.textContent = '✗ Error';
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
    const fileListEl = document.getElementById('file-list');
    if (fileListEl) fileListEl.innerHTML = '';
    const filesInfoEl = document.getElementById('files-selected-info');
    if (filesInfoEl) filesInfoEl.textContent = '';
    const progressText = document.getElementById('upload-progress-text');
    if (progressText) progressText.textContent = '';

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
            
            // ─── SMART DETECTION ───
            // Check if the file has multiple rows (Package file) or is a single exam
            const lineCount = content.split('\n').filter(l => l.trim().length > 0).length;
            let examsToSave = [];

            if (lineCount > 2) {
                // It's a multi-row package file!
                console.log(`📦 Detected multi-exam package (${lineCount} rows)`);
                examsToSave = parsePackageCSV(content);
            } else {
                // It's a single exam file
                console.log(`📄 Detected single-exam file`);
                const singleExam = parseCSVWithBetterHandling(content);
                examsToSave = [singleExam];
            }

            // Loop through whatever exams we found in this file
            for (const rawExam of examsToSave) {
                let exam = normalizeExamData(rawExam);
                const validationError = validateExamStructure(exam);

                if (validationError) {
                    throw new Error(`Validation failed: ${validationError.substring(0, 100)}`);
                }

                totalQuestionsUploaded += exam.questions?.length || 0;

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

                exam.created_by = state.user?.phone_number || state.user?.name || 'exam_office';
                exam.created_date = new Date().toISOString().split('T')[0];

                await saveExamToDB(exam);
                successful++;
            }
            
            showAlert(`✅ "${file.name}" processed successfully!`, 'success', 2000);

        } catch (error) {
            console.error(`❌ Upload failed for ${file.name}:`, error);
            failed++;
            failedDetails.push(`${file.name}: ${error.message}`);
        }

        const progressText = document.getElementById('upload-progress-text');
        if (progressText) {
            progressText.textContent = `Processed ${i + 1} of ${pendingUploadFiles.length}`;
        }
    }

    await loadExams();

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="upload" class="w-4 h-4"></i> Upload & Save All';
    }

    let summary = `📊 Upload Complete!\n\n`;
    if (successful > 0) summary += `✅ ${successful} exam(s) uploaded successfully\n`;
    if (skipped > 0) summary += `⏭️ ${skipped} exam(s) skipped (already exist)\n`;
    if (failed > 0) {
        summary += `❌ ${failed} file(s) failed to process:\n`;
        failedDetails.forEach(d => summary += `   • ${d}\n`);
    }

    const alertType = failed > 0 ? (successful > 0 ? 'info' : 'error') : 'success';
    showAlert(summary, alertType, failed > 0 ? 12000 : 6000);

    if (successful > 0) {
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

        if (state.recentUploads.length > 10) state.recentUploads = state.recentUploads.slice(0, 10);
    }

    clearFileList();

    setTimeout(() => {
        if (state.currentPage === 'exam-office-upload') {
            setPage('exam-office-dashboard');
        }
    }, 1500);
}

async function importMultipleExams(files) {
    const results = {
        total: files.length,
        successful: [],
        failed: [],
        skipped: []
    };
    
    showAlert(`📚 Importing ${files.length} file(s)...`, 'info', 3000);
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            console.log(`\n📖 [${i + 1}/${files.length}] Processing: ${file.name}`);
            showAlert(`📖 Importing ${i + 1}/${files.length}: ${file.name}...`, 'info', 2000);
            
            const content = await readFileAsText(file);
            
            // SMART DETECTION: Handle both single exams and multi-exam packages
            const lineCount = content.split('\n').filter(l => l.trim().length > 0).length;
            let examsToSave = [];

            if (lineCount > 2) {
                console.log(`📦 Detected multi-exam package (${lineCount} rows)`);
                examsToSave = parsePackageCSV(content);
            } else {
                console.log(`📄 Detected single-exam file`);
                const singleExam = parseCSVWithBetterHandling(content);
                examsToSave = [singleExam];
            }

            // Loop through and save each exam found in this file
            for (const rawExam of examsToSave) {
                let exam = normalizeExamData(rawExam);
                const validationError = validateExamStructure(exam);
                
                if (validationError) {
                    throw new Error(`Validation failed: ${validationError.substring(0, 100)}...`);
                }
                
                const existing = state.availableExams.find(e => e.exam_id === exam.exam_id);
                if (existing) {
                    // If it already exists, skip it during batch imports to be safe
                    results.skipped.push({
                        file: file.name,
                        examId: exam.exam_id,
                        reason: 'Already exists (skipped)'
                    });
                    continue;
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
            }
            
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
    
    if (state.currentPage === 'teacher' || state.currentPage === 'exam-office-upload') {
        render();
    }
}

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
            const fileName = `${exam.subject.replace(/[^a-z0-9]/gi, '_')}_${String(exam.class).replace(/[^a-z0-9]/gi, '_')}_Exam.csv`;
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
    
    await shareMultipleFiles(filesToShare, results);
}

async function shareMultipleFiles(filesToShare, results) {
    const totalFiles = filesToShare.length;
    
    // Check if it's a desktop browser (no touch, large screen)
    const isDesktop = !('ontouchstart' in window) && navigator.maxTouchPoints === 0;

    if (isDesktop) {
        // Desktop fallback: just download all files
        console.log('💻 Desktop detected. Downloading files...');
        for (let i = 0; i < filesToShare.length; i++) {
            downloadCSVFallback(filesToShare[i].blob, filesToShare[i].fileName, true);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        showAlert(`✅ ${totalFiles} exam(s) downloaded!\n\n📂 Check your Downloads folder.`, 'success', 6000);
        return;
    }

    // Mobile: Try Capacitor share
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Share) {
        try {
            const { Filesystem, Share } = window.Capacitor.Plugins;
            const fileUris = [];
            
            for (const fileData of filesToShare) {
                const result = await Filesystem.writeFile({
                    path: fileData.fileName,
                    data: await fileData.blob.text(),
                    directory: Filesystem.Directory?.Cache || 'CACHE',
                    encoding: Filesystem.Encoding?.UTF8 || 'utf8'
                });
                fileUris.push(result.uri);
            }

            await Share.share({
                title: `${totalFiles} Exam Files`,
                text: `Sharing ${totalFiles} exam(s)`,
                files: fileUris
            });
            showAlert(`✅ ${totalFiles} exam(s) shared successfully!`, 'success', 3000);
            return;
        } catch (err) {
            console.error('Capacitor share error:', err);
        }
    }

    // Mobile: Try Web Share API
    if (navigator.share && navigator.canShare) {
        try {
            const files = filesToShare.map(f => new File([f.blob], f.fileName, { type: 'text/csv' }));
            if (navigator.canShare({ files })) {
                await navigator.share({
                    files,
                    title: `${totalFiles} Exam Files`,
                    text: `Sharing ${totalFiles} exam(s)`
                });
                showAlert(`✅ ${totalFiles} exam(s) shared successfully!`, 'success', 3000);
                return;
            }
        } catch (err) {
            if (err.name !== 'AbortError') console.warn('Web Share failed', err);
        }
    }

    // Final fallback: download all
    for (let i = 0; i < filesToShare.length; i++) {
        downloadCSVFallback(filesToShare[i].blob, filesToShare[i].fileName, true);
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    showAlert(`✅ ${totalFiles} exam(s) downloaded!\n\n📂 Check your Downloads folder.`, 'success', 6000);
}

// Helper: escape double quotes in a CSV field value
function escapeCsvField(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/"/g, '""');
}


// ========================================
// MASTER IMPORT — Import All Exams from ONE File
// ========================================

/**
 * Import all exams from a single master file.
 * Replaces all existing exams on this device.
 */
async function importAllExamsSingleFile(file) {
    try {
        console.log('📄 Starting master import:', file.name);
        
        showAlert(`📂 Reading file: ${file.name}...`, 'info', 3000);
        
        const content = await readFileAsText(file);
        console.log('📄 File content loaded, length:', content.length);
        
        // Parse the CSV rows
        const exams = parseMasterCsv(content);
        
        if (exams.length === 0) {
            throw new Error('No exams found in the file');
        }
        
        console.log(`📊 Parsed ${exams.length} exams from master file`);
        
        // Show summary
        const caCount = exams.filter(e => e.assessmentType === 'CA').length;
        const examCount = exams.length - caCount;
        const scheduledCount = exams.filter(e => e.scheduledDate).length;
        
        const existingCount = state.availableExams.length;
        
        // Confirm replacement
        const confirmed = confirm(
            `📥 IMPORT ALL EXAMS?\n\n` +
            `Incoming file: ${file.name}\n\n` +
            `📊 New batch:\n` +
            `  • ${exams.length} total exams\n` +
            `  • ${caCount} CA (no schedule)\n` +
            `  • ${examCount} Exam\n` +
            `  • ${scheduledCount} with scheduled dates\n\n` +
            `⚠️ THIS WILL REPLACE ALL ${existingCount} EXISTING EXAM${existingCount !== 1 ? 'S' : ''} ON THIS DEVICE.\n\n` +
            `Results will NOT be affected.\n\n` +
            `Continue?`
        );
        
        if (!confirmed) {
            showAlert('Import cancelled', 'info');
            return;
        }
        
        // Delete all existing exams
        showAlert(`🗑️ Clearing ${existingCount} existing exam(s)...`, 'info', 2000);
        
        for (const existing of state.availableExams) {
            try {
                await deleteExamFromDB(existing.exam_id);
            } catch (err) {
                console.warn(`Could not delete ${existing.exam_id}:`, err);
            }
        }
        
        // Save new exams
        showAlert(`💾 Importing ${exams.length} exam(s)...`, 'info', 3000);
        
        let saved = 0;
        let failed = 0;
        
        for (const exam of exams) {
            try {
                await saveExamToDB(exam);
                saved++;
            } catch (err) {
                console.error(`Failed to save ${exam.exam_id}:`, err);
                failed++;
            }
        }
        
        // Reload
        await loadExams();
        
        // Summary
        if (failed === 0) {
            showAlert(
                `✅ Import Complete!\n\n` +
                `📚 ${saved} exam(s) loaded\n` +
                `  • ${caCount} CA (always visible)\n` +
                `  • ${examCount} Exam${scheduledCount > 0 ? ` (${scheduledCount} scheduled)` : ''}\n\n` +
                `Students will now see scheduled exams on their dates.`,
                'success',
                8000
            );
        } else {
            showAlert(
                `⚠️ Import partially completed.\n\n` +
                `✅ ${saved} exam(s) imported\n` +
                `❌ ${failed} failed\n\n` +
                `Check console for details.`,
                'error',
                8000
            );
        }
        
        // Re-render if on a teacher/dashboard page
        setTimeout(() => {
            if (state.currentPage === 'exam-office-dashboard' || 
                state.currentPage === 'exam-office-upload' ||
                state.currentPage === 'teacher') {
                render();
            }
        }, 500);
        
    } catch (error) {
        console.error('❌ Master import error:', error);
        showAlert('Import failed: ' + error.message, 'error', 8000);
    }
}


/**
 * Parse the master CSV file.
 * Format: exam_id,subject,class,duration,assessment_type,scheduled_date,created_by,questions_json
 */
function parseMasterCsv(csvText) {
    const rows = [];
    let currentLine = '';
    let inQuotes = false;
    
    // Split into logical rows (respecting quoted fields with newlines)
    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        
        if (char === '"') {
            // Check for escaped quotes ("")
            if (inQuotes && csvText[i + 1] === '"') {
                currentLine += '"';
                i++; // Skip the escaped quote
            } else {
                inQuotes = !inQuotes;
                currentLine += char;
            }
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (currentLine.trim()) {
                rows.push(currentLine.trim());
            }
            currentLine = '';
            // Skip \r\n combinations
            if (char === '\r' && csvText[i + 1] === '\n') i++;
        } else {
            currentLine += char;
        }
    }
    
    if (currentLine.trim()) rows.push(currentLine.trim());
    
    if (rows.length < 2) {
        throw new Error('File appears to be empty or invalid');
    }
    
    // Skip header, parse each data row
    const exams = [];
    
    for (let i = 1; i < rows.length; i++) {
        try {
            const fields = parseMasterCsvLine(rows[i]);
            
            // Expect at least 8 columns
            if (fields.length < 8) {
                console.warn(`Row ${i} has ${fields.length} columns, expected 8 — skipping`);
                continue;
            }
            
            const exam = {
                exam_id: fields[0],
                subject: fields[1],
                class: fields[2],
                duration: parseInt(fields[3]) || 30,
                assessmentType: fields[4] || 'EXAM',
                scheduledDate: fields[5] || null,
                created_by: fields[6] || '',
                questions: []
            };
            
            // Parse the questions JSON
            try {
                exam.questions = JSON.parse(fields[7]);
            } catch (jsonErr) {
                console.error(`Could not parse questions JSON for ${exam.exam_id}:`, jsonErr);
                throw new Error(`Question data corrupted for ${exam.exam_id}`);
            }
            
            if (!Array.isArray(exam.questions) || exam.questions.length === 0) {
                throw new Error(`No questions for ${exam.exam_id}`);
            }
            
            exams.push(exam);
            
        } catch (rowErr) {
            console.error(`Error parsing row ${i}:`, rowErr);
            // Continue with other rows
        }
    }
    
    return exams;
}

/**
 * Parse a single CSV line into fields.
 * Handles escaped quotes and quoted fields.
 */
function parseMasterCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
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


// ========================================
// FILE INPUT FOR MASTER IMPORT
// ========================================

function handleMasterImport() {
    try {
        console.log('📥 Master import triggered');
        
        const existingInput = document.getElementById('master-file-input');
        if (existingInput) existingInput.remove();
        
        const fileInput = document.createElement('input');
        fileInput.id = 'master-file-input';
        fileInput.type = 'file';
        fileInput.accept = '.csv,text/csv,application/csv';
        fileInput.style.cssText = 'position: absolute; left: -9999px;';
        
        fileInput.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            
            // Validate it's a CSV
            if (!file.name.toLowerCase().endsWith('.csv') && !file.type.includes('csv')) {
                showAlert('❌ Please select a CSV file', 'error', 5000);
                fileInput.remove();
                return;
            }
            
            await importAllExamsSingleFile(file);
            
            setTimeout(() => fileInput.remove(), 100);
        };
        
        document.body.appendChild(fileInput);
        
        setTimeout(() => {
            try {
                fileInput.click();
            } catch (err) {
                console.error('Error opening file picker:', err);
                showAlert('Cannot open file picker', 'error', 5000);
                fileInput.remove();
            }
        }, 150);
        
    } catch (error) {
        console.error('❌ Error in handleMasterImport:', error);
        showAlert('Error: ' + error.message, 'error', 5000);
    }
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

function createSmartFileInput() {
    try {
        const existingInput = document.getElementById('hidden-file-input-smart');
        if (existingInput) {
            existingInput.remove();
        }

        const fileInput = document.createElement('input');
        fileInput.id = 'hidden-file-input-smart';
        fileInput.type = 'file';
        fileInput.multiple = true;
        
        fileInput.accept = '.csv,text/csv,application/csv,text/comma-separated-values,application/vnd.ms-excel';
        
        fileInput.style.cssText = 'position: absolute; top: 0; left: 0; opacity: 0; width: 1px; height: 1px; z-index: -1; pointer-events: auto;';
        
        fileInput.onchange = async (e) => {
            console.log('📄 File(s) selected');
            const files = Array.from(e.target.files || []);
            
            if (files.length === 0) {
                console.log('❌ No files selected');
                return;
            }
            
            console.log(`📚 Selected ${files.length} file(s):`, files.map(f => f.name));
            
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
            
            if (files.length === 1) {
                console.log('📖 Single file mode');
                await handleExamImport(files[0]);
            } else {
                console.log(`📚 Multiple files mode: ${files.length} files`);
                await importMultipleExams(files);
            }
            
            setTimeout(() => {
                if (fileInput && fileInput.parentNode) {
                    fileInput.remove();
                }
            }, 100);
        };
        
        document.body.appendChild(fileInput);
        
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

function createMultipleFileInput() {
    try {
        const existingInput = document.getElementById('hidden-file-input-multiple');
        if (existingInput) {
            existingInput.remove();
        }

        const fileInput = document.createElement('input');
        fileInput.id = 'hidden-file-input-multiple';
        fileInput.type = 'file';
        fileInput.multiple = true;
        
        fileInput.accept = '.csv,text/csv,application/csv,text/comma-separated-values,application/vnd.ms-excel';
        
        fileInput.style.cssText = 'position: absolute; top: 0; left: 0; opacity: 0; width: 1px; height: 1px; z-index: -1; pointer-events: auto;';
        
        fileInput.onchange = async (e) => {
            console.log('📄 Files selected');
            const files = Array.from(e.target.files || []);
            
            if (files.length === 0) {
                console.log('❌ No files selected');
                return;
            }
            
            console.log(`📚 Selected ${files.length} file(s):`, files.map(f => f.name));
            
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
            
            await importMultipleExams(files);
            
            setTimeout(() => {
                if (fileInput && fileInput.parentNode) {
                    fileInput.remove();
                }
            }, 100);
        };
        
        document.body.appendChild(fileInput);
        
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

// ========================================
// EXPORT WITH SCHEDULED DATES
// ========================================

/**
 * Export a single exam with its scheduled date included
 * @param {string} examId - The exam ID to export
 */
async function shareExamWithDate(examId) {
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
        console.log(`📤 Exporting exam with date: ${exam.exam_id}`);
        
        // Create a copy with the scheduled date included
        const exportData = {
            ...exam,
            // Ensure scheduledDate is included (even if null)
            scheduledDate: exam.scheduledDate || null
        };
        
        // Generate CSV with date included
        const csvContent = jsonToCsvWithDate(exportData);
        const fileName = `${exam.subject.replace(/[^a-z0-9]/gi, '_')}_${exam.class}_Exam.csv`;
        
        // Use the existing share/export logic
        await downloadOrShareCSV(csvContent, fileName, `Exam: ${exam.subject} (${exam.class})`);
        
    } catch (error) {
        console.error('❌ Export error:', error);
        showAlert('Failed to export exam.', 'error');
    }
}

/**
 * Export all exams with their scheduled dates
 * Exports each exam individually (not zipped) for mobile compatibility
 */
async function exportAllExamsWithDates() {
    const exams = state.availableExams;
    
    if (exams.length === 0) {
        showAlert('No exams to export', 'error');
        return;
    }
    
    const totalExams = exams.length;
    
    // Show progress
    showAlert(`📤 Exporting ${totalExams} exam(s) with schedules...`, 'info', 3000);
    
    let successful = 0;
    let failed = 0;
    
    // Export each exam individually (not zipped)
    for (let i = 0; i < exams.length; i++) {
        const exam = exams[i];
        
        try {
            // Create export data with scheduled date
            const exportData = {
                ...exam,
                scheduledDate: exam.scheduledDate || null
            };
            
            const csvContent = jsonToCsvWithDate(exportData);
            const fileName = `${exam.subject.replace(/[^a-z0-9]/gi, '_')}_${exam.class}_Exam.csv`;
            
            // Download each file - use silent mode for batch
            downloadCSVFallback(csvContent, fileName, true);
            
            successful++;
            
            // Update progress every 5 exams
            if ((i + 1) % 5 === 0 || i === totalExams - 1) {
                showAlert(`📤 Exported ${i + 1}/${totalExams} exam(s)...`, 'info', 2000);
            }
            
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 300));
            
        } catch (error) {
            console.error(`❌ Failed to export ${exam.subject}:`, error);
            failed++;
        }
    }
    
    // Show summary
    if (failed === 0) {
        showAlert(`✅ All ${successful} exam(s) exported successfully!\n\n📂 Check your Downloads folder.\n📤 Share each file via Bluetooth, WhatsApp, etc.`, 'success', 8000);
    } else {
        showAlert(`⚠️ ${successful} exported, ${failed} failed.\nCheck console for details.`, 'error', 6000);
    }
}

/**
 * Generate CSV with scheduled date included
 */
function jsonToCsvWithDate(exam) {
    return jsonToCsv(exam);
}

/**
 * Download or share a CSV file with progress indicator
 */
/**
 * Download or share a CSV file — Capacitor native share first, then Web Share, then download
 */
async function downloadOrShareCSV(csvContent, fileName, title) {
    // Exam Office: Always download directly to device storage
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Call the helper function that triggers the download
    downloadCSVFallback(blob, fileName, false); // 'false' shows the success alert
}

/**
 * Parse CSV with scheduled date support (updated from original)
 */
function parseCSVWithBetterHandlingAndDate(csvText) {
    const rows = [];
    let currentLine = "";
    let inQuotes = false;

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
    
    // Check if this is the new format with scheduled_date
    const hasScheduledDate = firstDataRow.length >= 5 && firstDataRow[4] && !firstDataRow[4].startsWith('[') && !firstDataRow[4].startsWith('"[');
    
    // The json column is either at index 4 (old format) or index 5 (new format)
    const jsonColumnIndex = hasScheduledDate ? 5 : 4;
    const jsonColumn = firstDataRow[jsonColumnIndex] ? firstDataRow[jsonColumnIndex].trim() : "";
    const isImmortalFormat = jsonColumn.startsWith('[') || jsonColumn.startsWith('"[');

    const exam = {
        exam_id: firstDataRow[0] || 'N/A',
        subject: firstDataRow[1] || 'Unknown Subject',
        class: firstDataRow[2] || 'Unknown Class',
        duration: parseInt(firstDataRow[3]) || 30,
        scheduledDate: hasScheduledDate ? firstDataRow[4] || null : null,
        questions: []
    };

    if (isImmortalFormat) {
        try {
            let cleanJson = jsonColumn;
            if (cleanJson.startsWith('"') && cleanJson.endsWith('"')) {
                cleanJson = cleanJson.substring(1, cleanJson.length - 1).replace(/""/g, '"');
            }
            exam.questions = JSON.parse(cleanJson);
        } catch (e) {
            throw new Error("The immortal JSON data is corrupted.");
        }
    } else {
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

// ========================================
// SINGLE-FILE PACKAGE EXPORT/IMPORT
// ========================================

/**
 * Export ALL exams as a single CSV file with scheduled dates
 * Also saves a copy to the exam archive for future reference
 */
async function exportAllExamsSingleFile() {
    const exams = state.availableExams;
    
    if (!exams || exams.length === 0) {
        showAlert('No exams to export', 'error');
        return;
    }
    
    try {
        console.log(`📦 Exporting ${exams.length} exam(s) as single package...`);
        
        // Build CSV: header + one row per exam
        const headers = ['exam_id', 'subject', 'class', 'duration', 'assessment_type', 'scheduled_date', 'questions_json'];
        const rows = [headers.join(',')];
        
        let caCount = 0;
        let examCount = 0;
        const scheduleSummary = [];
        
        exams.forEach(exam => {
            const assessmentType = exam.assessmentType || 'EXAM';
            const scheduledDate = exam.scheduledDate || '';
            
            // Correctly parse questions array to a JSON string and escape quotes for CSV
            const questionsJson = JSON.stringify(exam.questions || []).replace(/"/g, '""');
            
            if (assessmentType === 'CA') {
                caCount++;
            } else {
                examCount++;
                if (scheduledDate) {
                    scheduleSummary.push({
                        subject: exam.subject,
                        class: exam.class,
                        date: scheduledDate
                    });
                }
            }
            
            // Manually construct the row to ensure NO commas or newlines in the JSON break the CSV
            const row = [
                `"${escapeCsvField(exam.exam_id)}"`,
                `"${escapeCsvField(exam.subject)}"`,
                `"${escapeCsvField(exam.class)}"`,
                `"${exam.duration || 30}"`,
                `"${assessmentType}"`,
                `"${scheduledDate}"`,
                `"${questionsJson}"`
            ];
            rows.push(row.join(','));
        });
        
        const csvContent = rows.join('\n');
        
        // Auto-generate filename
        const schoolShortName = window.SCHOOL_CONFIG?.schoolShortName || 'GSSS';
        const today = new Date().toISOString().split('T')[0];
        const fileName = `${schoolShortName}_AllExams_${today}.csv`;
        
        console.log(`📄 Package created: ${fileName} (${csvContent.length} bytes)`);
        
        // Share/download
        await downloadOrShareCSV(csvContent, fileName, `${exams.length} Exams Package`);
        
        // Summary alert
        let summaryMsg = `✅ Package exported!\n\n📦 ${exams.length} exam(s) total\n`;
        if (caCount > 0) summaryMsg += `📝 ${caCount} CA (always visible)\n`;
        if (examCount > 0) summaryMsg += `📅 ${examCount} Exams (scheduled)\n`;
        if (scheduleSummary.length > 0) {
            summaryMsg += `\nSchedules:\n`;
            scheduleSummary.slice(0, 5).forEach(s => {
                summaryMsg += `• ${s.subject} (${s.class}) → ${new Date(s.date).toLocaleDateString()}\n`;
            });
            if (scheduleSummary.length > 5) {
                summaryMsg += `...and ${scheduleSummary.length - 5} more\n`;
            }
        }
        
        setTimeout(() => showAlert(summaryMsg, 'success', 8000), 1000);
        render();
        
    } catch (error) {
        console.error('❌ Package export error:', error);
        showAlert('Failed to export package: ' + error.message, 'error', 6000);
    }
}

/**
 * Parse a package CSV (multi-row format)
 * Returns array of exam objects
 */
function parsePackageCSV(csvText) {
    const rows = [];
    let currentLine = "";
    let inQuotes = false;
    
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
    
    if (rows.length < 2) {
        throw new Error('File appears to be empty or has no data rows');
    }
    
    // Detect header
    const header = parseCSVLine(rows[0]).map(h => h.trim().toLowerCase());
    const colIndex = {
        exam_id: header.indexOf('exam_id'),
        subject: header.indexOf('subject'),
        class: header.indexOf('class'),
        duration: header.indexOf('duration'),
        assessment_type: header.indexOf('assessment_type'),
        scheduled_date: header.indexOf('scheduled_date'),
        questions_json: header.indexOf('questions_json'),
        created_by: header.indexOf('created_by')
    };
    
    // Validate header
    if (colIndex.exam_id === -1 || colIndex.questions_json === -1) {
        throw new Error('Invalid package format — missing required columns (exam_id, questions_json)');
    }
    
    const exams = [];
    
    for (let i = 1; i < rows.length; i++) {
        const cols = parseCSVLine(rows[i]);
        
        const examId = cols[colIndex.exam_id] || '';
        if (!examId) continue;
        
        const questionsJson = cols[colIndex.questions_json] || '';
        let questions = [];
        
        try {
            questions = JSON.parse(questionsJson);
        } catch (e) {
            console.warn(`⚠️ Could not parse questions for exam ${examId}:`, e);
            continue;
        }
        
        if (!Array.isArray(questions) || questions.length === 0) {
            console.warn(`⚠️ Exam ${examId} has no questions, skipping`);
            continue;
        }
        
        const assessmentType = (cols[colIndex.assessment_type] || 'EXAM').toUpperCase().trim();
        const scheduledDate = cols[colIndex.scheduled_date] || '';
        const createdBy = colIndex.created_by !== -1 ? (cols[colIndex.created_by] || '') : 'package_import';
        
        exams.push({
            exam_id: examId,
            subject: cols[colIndex.subject] || 'Unknown',
            class: cols[colIndex.class] || 'Unknown',
            duration: parseInt(cols[colIndex.duration]) || 30,
            assessmentType: assessmentType === 'CA' ? 'CA' : 'EXAM',
            scheduledDate: scheduledDate || null,
            questions: questions,
            created_date: new Date().toISOString().split('T')[0],
            created_by: createdBy
        });
    }
    
    if (exams.length === 0) {
        throw new Error('No valid exams found in the package');
    }
    
    return exams;
}

/**
 * Import a complete package — REPLACES all existing exams
 */
async function importCompletePackage(file) {
    try {
        console.log('📦 Starting complete package import:', file.name);
        
        showAlert(`📂 Reading package: ${file.name}...`, 'info', 3000);
        
        const content = await readFileAsText(file);
        const exams = parsePackageCSV(content);
        
        console.log(`✅ Parsed ${exams.length} exam(s) from package`);
        
        const caCount = exams.filter(e => e.assessmentType === 'CA').length;
        const examCount = exams.filter(e => e.assessmentType === 'EXAM').length;
        const scheduledCount = exams.filter(e => e.assessmentType === 'EXAM' && e.scheduledDate).length;
        
        // Confirmation dialog
        const currentCount = state.availableExams.length;
        const examWord = exams.length === 1 ? 'exam' : 'exams';
        
        const confirmed = confirm(
            `⚠️ IMPORT COMPLETE PACKAGE\n\n` +
            `File: ${file.name}\n\n` +
            `📦 Package contents:\n` +
            `   • ${exams.length} ${examWord} total\n` +
            `   • ${caCount} Continuous Assessments\n` +
            `   • ${examCount} Examinations (${scheduledCount} scheduled)\n\n` +
            `⚠️ This will REPLACE all exams on this device.\n` +
            `   Current: ${currentCount} exams\n` +
            `   After: ${exams.length} exams\n\n` +
            `ℹ️ Student results are NOT affected.\n\n` +
            `Continue?`
        );
        
        if (!confirmed) {
            showAlert('Import cancelled', 'info');
            return;
        }
        
        showAlert('🗑️ Clearing existing exams...', 'info', 2000);
        
        // Clear all existing exams
        await deleteAllExamsFromDB();
        state.availableExams = [];
        
        showAlert(`💾 Importing ${exams.length} exam(s)...`, 'info', 2000);
        
        // Insert each exam
        let successCount = 0;
        let failCount = 0;
        
        for (const exam of exams) {
            try {
                await saveExamToDB(exam);
                successCount++;
            } catch (err) {
                console.error(`❌ Failed to save ${exam.exam_id}:`, err);
                failCount++;
            }
        }
        
        // Reload from DB
        await loadExams();
        
        console.log(`✅ Import complete: ${successCount} saved, ${failCount} failed`);
        
        // Build summary
        let summaryMsg = `✅ Import Successful!\n\n`;
        summaryMsg += `📦 ${successCount} exam(s) imported\n`;
        if (caCount > 0) summaryMsg += `📝 ${caCount} CA (always visible)\n`;
        if (examCount > 0) summaryMsg += `📅 ${examCount} Exams\n`;
        
        const scheduledExams = exams.filter(e => e.assessmentType === 'EXAM' && e.scheduledDate);
        if (scheduledExams.length > 0) {
            summaryMsg += `\nSchedules applied:\n`;
            scheduledExams.slice(0, 5).forEach(e => {
                summaryMsg += `• ${e.subject} (${e.class}) → ${new Date(e.scheduledDate).toLocaleDateString()}\n`;
            });
            if (scheduledExams.length > 5) {
                summaryMsg += `...and ${scheduledExams.length - 5} more\n`;
            }
        }
        
        if (failCount > 0) {
            summaryMsg += `\n⚠️ ${failCount} exam(s) failed to import`;
        }
        
        showAlert(summaryMsg, failCount > 0 ? 'info' : 'success', 10000);
        
        render();
        
    } catch (error) {
        console.error('❌ Package import failed:', error);
        showAlert('Import failed: ' + error.message, 'error', 8000);
    }
}

/**
 * Trigger file picker for package import
 */
function handleImportPackage() {
    try {
        const existingInput = document.getElementById('hidden-package-input');
        if (existingInput) existingInput.remove();
        
        const fileInput = document.createElement('input');
        fileInput.id = 'hidden-package-input';
        fileInput.type = 'file';
        fileInput.accept = '.csv,text/csv';
        fileInput.style.cssText = 'position: absolute; top: 0; left: 0; opacity: 0; width: 1px; height: 1px; z-index: -1; pointer-events: auto;';
        
        fileInput.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            
            if (!file.name.toLowerCase().endsWith('.csv')) {
                showAlert('Please select a CSV package file', 'error');
                fileInput.remove();
                return;
            }
            
            await importCompletePackage(file);
            setTimeout(() => fileInput.remove(), 100);
        };
        
        document.body.appendChild(fileInput);
        setTimeout(() => fileInput.click(), 150);
        
    } catch (error) {
        console.error('❌ Error in handleImportPackage:', error);
        showAlert('Error preparing package import: ' + error.message, 'error', 5000);
    }
}

// ========================================
// EXAM ARCHIVE FUNCTIONS
// ========================================

async function loadArchives() {
    try {
        const archives = await loadAllArchivesFromDB();
        // Sort by exported_at descending
        archives.sort((a, b) => new Date(b.exported_at) - new Date(a.exported_at));
        state.examArchives = archives || [];
        console.log(`✅ Loaded ${state.examArchives.length} archive(s)`);
    } catch (err) {
        console.error('Error loading archives:', err);
        state.examArchives = [];
    }
}

async function downloadArchive(archiveId) {
    try {
        const archive = await getArchiveById(archiveId);
        if (!archive) {
            showAlert('Archive not found', 'error');
            return;
        }
        
        await downloadOrShareCSV(archive.csv_content, archive.filename, archive.filename);
    } catch (error) {
        console.error('❌ Archive download error:', error);
        showAlert('Failed to download archive', 'error');
    }
}

async function deleteArchive(archiveId) {
    if (!confirm('Delete this archived package? This cannot be undone.')) return;
    
    try {
        await deleteArchiveFromDB(archiveId);
        await loadArchives();
        showAlert('Archive deleted', 'success', 3000);
        render();
    } catch (error) {
        console.error('❌ Archive delete error:', error);
        showAlert('Failed to delete archive', 'error');
    }
}

function toggleArchiveSection() {
    state.showArchiveSection = !state.showArchiveSection;
    render();
}

// ========================================
// ARCHIVE IMPORT FROM FILE
// ========================================

/**
 * Import an archive file into the local archive list.
 * Does NOT touch existing exams — only adds to the archive store.
 */
async function importArchiveFromFile(file) {
    try {
        console.log('📦 Importing archive from file:', file.name);
        
        showAlert(`📂 Reading archive: ${file.name}...`, 'info', 3000);
        
        const content = await readFileAsText(file);
        const exams = parsePackageCSV(content);
        
        if (!exams || exams.length === 0) {
            throw new Error('No exams found in the archive file');
        }
        
        const caCount = exams.filter(e => e.assessmentType === 'CA').length;
        const examCount = exams.filter(e => e.assessmentType === 'EXAM').length;
        const scheduledCount = exams.filter(
            e => e.assessmentType === 'EXAM' && e.scheduledDate
        ).length;
        
        // Build a new archive entry
        const now = new Date();
        const archiveId = `archive_${now.getTime()}_${Math.random().toString(36).substr(2, 6)}`;
        const filename = file.name;
        
        const archive = {
            archive_id: archiveId,
            filename: filename,
            exported_at: now.toISOString(),
            exam_count: exams.length,
            ca_count: caCount,
            exam_count_scheduled: scheduledCount,
            csv_content: content,
            exams_summary: exams.map(e => ({
                exam_id: e.exam_id,
                subject: e.subject,
                class: e.class,
                assessment_type: e.assessmentType || 'EXAM',
                scheduled_date: e.scheduledDate || null
            }))
        };
        
        await saveArchiveToDB(archive);
        await loadArchives();
        
        showAlert(
            `✅ Archive imported!\n\n` +
            `📦 ${exams.length} exam(s)\n` +
            `  • ${caCount} CA\n` +
            `  • ${examCount} Exam (${scheduledCount} scheduled)\n\n` +
            `Saved to your archive list.`,
            'success',
            6000
        );
        
        // Refresh if on schedule page
        if (state.currentPage === 'exam-office-schedule') {
            state.showArchiveSection = true;
            render();
        }
        
    } catch (error) {
        console.error('❌ Archive import error:', error);
        showAlert('Failed to import archive: ' + error.message, 'error', 6000);
    }
}

/**
 * Trigger file picker for archive import.
 */
function handleImportArchive() {
    try {
        const existingInput = document.getElementById('hidden-archive-input');
        if (existingInput) existingInput.remove();
        
        const fileInput = document.createElement('input');
        fileInput.id = 'hidden-archive-input';
        fileInput.type = 'file';
        fileInput.accept = '.csv,text/csv';
        fileInput.style.cssText = 'position: absolute; top: 0; left: 0; opacity: 0; width: 1px; height: 1px; z-index: -1; pointer-events: auto;';
        
        fileInput.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            
            if (!file.name.toLowerCase().endsWith('.csv')) {
                showAlert('Please select a CSV archive file', 'error');
                fileInput.remove();
                return;
            }
            
            await importArchiveFromFile(file);
            setTimeout(() => fileInput.remove(), 100);
        };
        
        document.body.appendChild(fileInput);
        setTimeout(() => fileInput.click(), 150);
        
    } catch (error) {
        console.error('❌ Error in handleImportArchive:', error);
        showAlert('Error preparing archive import: ' + error.message, 'error', 5000);
    }
}

// ========================================
// BULK SCHEDULE & DELETE (EXAM OFFICE)
// ========================================

let selectedScheduleExams = new Set();

function handleScheduleCheckboxChange(checkbox) {
    const examId = checkbox.dataset.examId;
    const card = checkbox.closest('.schedule-exam-item');
    
    if (checkbox.checked) {
        selectedScheduleExams.add(examId);
        if (card) card.classList.add('ring-2', 'ring-purple-500', 'bg-purple-50');
    } else {
        selectedScheduleExams.delete(examId);
        if (card) card.classList.remove('ring-2', 'ring-purple-500', 'bg-purple-50');
    }
    
    updateBulkScheduleUI();
}

function updateBulkScheduleUI() {
    const count = selectedScheduleExams.size;
    const toolbar = document.getElementById('bulk-schedule-toolbar');
    const countBadge = document.getElementById('bulk-schedule-count');
    
    if (toolbar) {
        if (count > 0) {
            toolbar.classList.remove('hidden');
            toolbar.classList.add('flex');
            if (countBadge) countBadge.textContent = `${count} exam(s) selected`;
        } else {
            toolbar.classList.add('hidden');
            toolbar.classList.remove('flex');
        }
    }
}

function openBulkScheduleModal() {
    if (selectedScheduleExams.size === 0) return;
    
    document.getElementById('bulkScheduleModalTitle').textContent = `Schedule ${selectedScheduleExams.size} Exam(s)`;
    document.getElementById('bulk-schedule-date-picker').value = '';
    document.getElementById('bulkScheduleModal').classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeBulkScheduleModal() {
    document.getElementById('bulkScheduleModal').classList.add('hidden');
}

async function saveBulkSchedule(event) {
    event.preventDefault();
    const date = document.getElementById('bulk-schedule-date-picker').value;
    
    if (!date) {
        showAlert('Please select a date', 'error');
        return;
    }
    
    try {
        let scheduledCount = 0;
        
        for (const examId of selectedScheduleExams) {
            const exam = state.availableExams.find(e => e.exam_id === examId);
            if (exam) {
                exam.scheduledDate = date;
                await saveExamToDB(exam);
                scheduledCount++;
            }
        }
        
        await loadExams();
        showAlert(`✅ ${scheduledCount} exam(s) scheduled for ${new Date(date).toLocaleDateString()}`, 'success');
        
        selectedScheduleExams.clear();
        updateBulkScheduleUI();
        closeBulkScheduleModal();
        render(); // Refresh the page
        
    } catch (err) {
        console.error('Bulk schedule error:', err);
        showAlert('Failed to schedule exams', 'error');
    }
}

async function deleteSelectedExamsFromExamOffice() {
    if (selectedScheduleExams.size === 0) return;
    
    const count = selectedScheduleExams.size;
    const examWord = count === 1 ? 'exam' : 'exams';
    
    if (!confirm(`⚠️ Are you sure you want to delete ${count} ${examWord}?\n\nThis will permanently remove them from the system. This action CANNOT be undone.`)) {
        return;
    }
    
    try {
        let deleted = 0;
        for (const examId of selectedScheduleExams) {
            await deleteExamFromDB(examId);
            // Remove from state
            state.availableExams = state.availableExams.filter(e => e.exam_id !== examId);
            deleted++;
        }
        
        showAlert(`✅ Successfully deleted ${deleted} ${examWord}`, 'success', 3000);
        
        // Clear selection and update UI
        selectedScheduleExams.clear();
        updateBulkScheduleUI();
        render();
        
    } catch (err) {
        console.error('Bulk delete error:', err);
        showAlert('Failed to delete exams', 'error');
    }
}

async function deleteExamFromExamOffice(examId, examSubject) {
    if (!confirm(`⚠️ Are you sure you want to delete "${examSubject}"?\n\nThis will remove the exam completely from the system.`)) {
        return;
    }
    
    try {
        await deleteExamFromDB(examId);
        state.availableExams = state.availableExams.filter(e => e.exam_id !== examId);
        selectedScheduleExams.delete(examId);
        
        showAlert(`✅ "${examSubject}" deleted successfully`, 'success');
        render();
    } catch (err) {
        console.error('Delete exam error:', err);
        showAlert('Failed to delete exam', 'error');
    }
}

// Add these to window exports at the bottom of the file:
window.handleScheduleCheckboxChange = handleScheduleCheckboxChange;
window.openBulkScheduleModal = openBulkScheduleModal;
window.closeBulkScheduleModal = closeBulkScheduleModal;
window.saveBulkSchedule = saveBulkSchedule;
window.deleteExamFromExamOffice = deleteExamFromExamOffice;
window.importArchiveFromFile = importArchiveFromFile;
window.handleImportArchive = handleImportArchive;
window.pendingUploadFiles = pendingUploadFiles;
window.handleDragOver = handleDragOver;
window.handleDragLeave = handleDragLeave;
window.handleDrop = handleDrop;
window.handleExamOfficeFileSelect = handleExamOfficeFileSelect;
window.processSelectedFiles = processSelectedFiles;
window.clearFileList = clearFileList;
window.processExamUpload = processExamUpload;
window.importMultipleExams = importMultipleExams;
window.importMultipleExamsWithPrompts = importMultipleExamsWithPrompts;
window.exportMultipleExams = exportMultipleExams;
window.shareMultipleFiles = shareMultipleFiles;
window.exportAllExamsSingleFile = exportAllExamsSingleFile;
window.importAllExamsSingleFile = importAllExamsSingleFile;
window.handleMasterImport = handleMasterImport;
window.exportAllExams = exportAllExams;
window.handleImportMultipleExams = handleImportMultipleExams;
window.handleSmartImport = handleSmartImport;
window.createSmartFileInput = createSmartFileInput;
window.createMultipleFileInput = createMultipleFileInput;
window.showImportResults = showImportResults;
window.toggleExamSchedule = toggleExamSchedule;
window.shareExamWithDate = shareExamWithDate;
window.exportAllExamsWithDates = exportAllExamsWithDates;
window.jsonToCsvWithDate = jsonToCsvWithDate;
window.downloadOrShareCSV = downloadOrShareCSV;
window.parseCSVWithBetterHandlingAndDate = parseCSVWithBetterHandlingAndDate;
// Single-file package
window.importCompletePackage = importCompletePackage;
window.handleImportPackage = handleImportPackage;
window.parsePackageCSV = parsePackageCSV;

// Exam archives
window.loadArchives = loadArchives;
window.downloadArchive = downloadArchive;
window.deleteArchive = deleteArchive;
window.toggleArchiveSection = toggleArchiveSection;

window.deleteSelectedExamsFromExamOffice = deleteSelectedExamsFromExamOffice;