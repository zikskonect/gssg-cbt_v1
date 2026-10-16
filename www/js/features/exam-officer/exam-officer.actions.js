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

    const statusEl = document.getElementById('upload-status');
    const fileListEl = document.getElementById('file-list');
    const filesInfoEl = document.getElementById('files-selected-info');

    if (statusEl) statusEl.classList.remove('hidden');

    let totalQuestions = 0;

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

            exam = normalizeExamData(exam);
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
            showAlert(`✅ "${exam.subject}" uploaded successfully!`, 'success', 2000);

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
        summary += `❌ ${failed} exam(s) failed:\n`;
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
    
    showAlert(`📚 Importing ${files.length} exam(s)...`, 'info', 3000);
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            console.log(`\n📖 [${i + 1}/${files.length}] Processing: ${file.name}`);
            showAlert(`📖 Importing ${i + 1}/${files.length}: ${file.name}...`, 'info', 2000);
            
            const content = await readFileAsText(file);
            let exam = parseCSVWithBetterHandling(content);
            
            if (!exam.questions || exam.questions.length === 0) {
                throw new Error('No questions found in file');
            }
            
            exam = normalizeExamData(exam);
            const validationError = validateExamStructure(exam);
            if (validationError) {
                throw new Error(`Validation failed: ${validationError.substring(0, 100)}...`);
            }
            
            const existing = state.availableExams.find(e => e.exam_id === exam.exam_id);
            if (existing) {
                results.skipped.push({
                    file: file.name,
                    examId: exam.exam_id,
                    reason: 'Already exists'
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
    
    await shareMultipleFiles(filesToShare, results);
}

async function shareMultipleFiles(filesToShare, results) {
    const totalFiles = filesToShare.length;

    try {
        if (window.Capacitor && window.Capacitor.Plugins) {
            const Plugins = window.Capacitor.Plugins;
            const Filesystem = Plugins.Filesystem;
            const Share = Plugins.Share;

            if (Filesystem && Share) {
                console.log('📱 Using Capacitor for multiple files');

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
            }
        }

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

                    if (i < filesToShare.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (shareError) {
                    if (shareError.name === 'AbortError') {
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

    console.log('💾 Downloading all files...');
    showAlert(`📥 Downloading ${totalFiles} file(s)...`, 'info', 2000);

    for (let i = 0; i < filesToShare.length; i++) {
        const fileData = filesToShare[i];

        downloadCSVFallback(fileData.blob, fileData.fileName, true);

        await new Promise(resolve => setTimeout(resolve, 300));
    }

    showAlert(
        `✅ ${totalFiles} exam(s) downloaded!\n\n` +
        `📂 Check your Downloads folder\n` +
        `📤 You can now share them via any app`,
        'success',
        6000
    );

    console.log(`✅ ${totalFiles} files downloaded successfully`);
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
    // Add scheduled_date to the headers
    const headers = ['exam_id', 'subject', 'class', 'duration', 'scheduled_date', 'questions_json'];
    
    const questionsSafe = JSON.stringify(exam.questions.map(q => ({
        ...q,
        options: q.options && q.options.length > 0 
            ? q.options 
            : ["Option A", "Option B", "Option C", "Option D"]
    })));
    
    // Include scheduledDate (or empty string if not set)
    const scheduledDate = exam.scheduledDate || '';
    
    const row = [
        `"${exam.exam_id}"`,
        `"${exam.subject}"`,
        `"${exam.class}"`,
        `"${exam.duration || 30}"`,
        `"${scheduledDate}"`,
        `"${questionsSafe.replace(/"/g, '""')}"`
    ];
    
    return headers.join(',') + '\n' + row.join(',');
}

/**
 * Download or share a CSV file with progress indicator
 */
/**
 * Download or share a CSV file — Capacitor native share first, then Web Share, then download
 */
async function downloadOrShareCSV(csvContent, fileName, title) {
    // 1. CAPACITOR NATIVE SHARE (highest priority on mobile)
    if (window.Capacitor && window.Capacitor.Plugins) {
        const Plugins = window.Capacitor.Plugins;
        const Filesystem = Plugins.Filesystem;
        const Share = Plugins.Share;

        if (Filesystem && Share) {
            try {
                console.log('📱 Using Capacitor native share');
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: csvContent,
                    directory: Filesystem.Directory?.Cache || 'CACHE',
                    encoding: Filesystem.Encoding?.UTF8 || 'utf8'
                });

                await Share.share({
                    title: title,
                    text: title,
                    files: [result.uri]
                });

                showAlert('✅ Shared successfully!', 'success', 3000);
                return;
            } catch (err) {
                console.error('Capacitor share error:', err);
                // fall through to web share / download
            }
        }
    }

    // 2. WEB SHARE API (browsers)
    if (navigator.share) {
        try {
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const file = new File([blob], fileName, { type: 'text/csv' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: title,
                    text: title
                });
                showAlert('✅ Shared successfully!', 'success', 3000);
                return;
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.warn('Web Share failed:', err);
            } else {
                return;
            }
        }
    }

    // 3. FALLBACK: DOWNLOAD
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showAlert(`✅ "${fileName}" downloaded!\n\n📂 Check your Downloads folder.`, 'success', 4000);
}

/**
 * Parse CSV with scheduled date support (updated from original)
 */
/**
 * Parse CSV with smart format detection.
 * Handles:
 *   1. Old format:  exam_id,subject,class,duration,questions_json
 *   2. New format:  exam_id,subject,class,duration,assessment_type,questions_json
 *   3. Date format: exam_id,subject,class,duration,scheduled_date,questions_json
 *   4. Master format: exam_id,subject,class,duration,assessment_type,scheduled_date,created_by,questions_json
 */
function parseCSVWithBetterHandling(csvText) {
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

    // ---------- Read header to detect format ----------
    const header = parseCSVLine(rows[0]).map(h => h.trim().toLowerCase());

    const idx = {
        exam_id:          header.indexOf('exam_id'),
        subject:          header.indexOf('subject'),
        class:            header.indexOf('class'),
        duration:         header.indexOf('duration'),
        questions_json:   header.indexOf('questions_json'),
        assessment_type:  header.indexOf('assessment_type'),
        scheduled_date:   header.indexOf('scheduled_date'),
        created_by:       header.indexOf('created_by'),
    };

    // questions_json column MUST exist — otherwise it's not a valid export
    if (idx.questions_json === -1) {
        throw new Error('Missing questions_json column — file was not exported from this app.');
    }

    // ---------- Parse first data row ----------
    const first = parseCSVLine(rows[1]);

    const exam = {
        exam_id:         first[idx.exam_id]   || 'N/A',
        subject:         first[idx.subject]   || 'Unknown Subject',
        class:           first[idx.class]     || 'Unknown Class',
        duration:        parseInt(first[idx.duration]) || 30,
        assessmentType:  idx.assessment_type !== -1
                            ? (first[idx.assessment_type] || 'EXAM').toUpperCase().trim()
                            : 'EXAM',
        scheduledDate:   idx.scheduled_date !== -1
                            ? (first[idx.scheduled_date] || null)
                            : null,
        created_by:      idx.created_by !== -1 ? (first[idx.created_by] || '') : '',
        questions: []
    };

    // ---------- Parse questions_json ----------
    let jsonColumn = first[idx.questions_json] ? first[idx.questions_json].trim() : '';

    // Strip surrounding quotes if any (CSV writers sometimes double-quote)
    if (jsonColumn.startsWith('"') && jsonColumn.endsWith('"')) {
        jsonColumn = jsonColumn.substring(1, jsonColumn.length - 1).replace(/""/g, '"');
    }

    if (jsonColumn.startsWith('[')) {
        // Immortal / JSON-in-one-cell format
        try {
            exam.questions = JSON.parse(jsonColumn);
        } catch (e) {
            throw new Error('The questions JSON data is corrupted.');
        }
    } else {
        // Legacy row-per-question format (no header-based JSON)
        // This is very old — we try our best.
        for (let i = 1; i < rows.length; i++) {
            const row = parseCSVLine(rows[i]);
            if (row.length < 8) continue;
            exam.questions.push({
                id: row[5] || Date.now() + i,
                type: row[6] || 'multiple_choice',
                question: row[7],
                options: [row[8], row[9], row[10], row[11]].filter(Boolean),
                correct_answer: row[12]
            });
        }
    }

    if (!Array.isArray(exam.questions) || exam.questions.length === 0) {
        throw new Error('No questions were found in the file.');
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
            const questionsJson = JSON.stringify(exam.questions).replace(/"/g, '""');
            const assessmentType = exam.assessmentType || 'EXAM';
            const scheduledDate = exam.scheduledDate || '';
            
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
            
            const row = [
                `"${exam.exam_id}"`,
                `"${exam.subject}"`,
                `"${exam.class}"`,
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
        
        // Save to archive BEFORE sharing
        // try {
        //     const archiveId = `archive_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        //     const archive = {
        //         archive_id: archiveId,
        //         filename: fileName,
        //         exported_at: new Date().toISOString(),
        //         exam_count: exams.length,
        //         ca_count: caCount,
        //         exam_count_scheduled: examCount,
        //         csv_content: csvContent,
        //         exams_summary: exams.map(e => ({
        //             exam_id: e.exam_id,
        //             subject: e.subject,
        //             class: e.class,
        //             assessment_type: e.assessmentType || 'EXAM',
        //             scheduled_date: e.scheduledDate || null
        //         }))
        //     };
        //     await saveArchiveToDB(archive);
        //     console.log('✅ Archive saved:', archiveId);
        // } catch (archiveErr) {
        //     console.warn('⚠️ Could not save to archive (continuing with export):', archiveErr);
        // }
        
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
        
        // ⏸️ Archive list refresh DISABLED — to be re-enabled in a later version
        // await loadArchives();
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
        questions_json: header.indexOf('questions_json')
    };
    
    // Validate header
    if (colIndex.exam_id === -1 || colIndex.questions_json === -1) {
        throw new Error('Invalid package format — missing required columns (exam_id, questions_json)');
    }
    
    const exams = [];
    
    for (let i = 1; i < rows.length; i++) {
        const cols = parseCSVLine(rows[i]);
        
        const examId = cols[colIndex.exam_id] || '';
        if (!examId) continue; // Skip empty rows
        
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
        
        exams.push({
            exam_id: examId,
            subject: cols[colIndex.subject] || 'Unknown',
            class: cols[colIndex.class] || 'Unknown',
            duration: parseInt(cols[colIndex.duration]) || 30,
            assessmentType: assessmentType === 'CA' ? 'CA' : 'EXAM',
            scheduledDate: scheduledDate || null,
            questions: questions,
            created_date: new Date().toISOString().split('T')[0],
            created_by: 'package_import'
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

// Add to exports
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