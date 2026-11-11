// app_config.js - Application Configuration
// Application-wide configuration settings

const APP_CONFIG = {
    // App Metadata
    appName: 'GSS GWAGWALADA CBT',
    version: '1.0.0',

    // Feature Flags
    enableOfflineMode: true,
    enableImageUpload: true,
    maxImageSizeMB: 5,
    enableExamScheduling: true,

    // Default Values
    defaultExamDuration: 30,
    defaultQuestionsPerPage: 20,

    // Storage Settings
    dbName: 'GssgcbtDB',
    dbVersion: 11,

    // UI Settings
    animationDuration: 300,
    alertDuration: 4000,
};

// Export to global scope
window.APP_CONFIG = APP_CONFIG;