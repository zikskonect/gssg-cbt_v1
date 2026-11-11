// sch_config.js - School Configuration
// ═══════════════════════════════════════════════════════════
//  SINGLE SOURCE OF TRUTH
//  Change values here → they apply across the entire app.
// ═══════════════════════════════════════════════════════════

const SCHOOL_CONFIG = {
    // ─── School Identity ─────────────────────────────────
    schoolName: 'Government Secondary School, Gwagwalada',
    schoolShortName: 'GSS GWAGS',
    tagline: 'Learning for Service',
    subtitle: 'Offline Examination Platform',

    // ─── Logo ────────────────────────────────────────────
    // Path is relative to the www/ folder
    logoPath: 'js/icons/128x128.png',

    // ─── Home Page Background Image ──────────────────────
    // Path is relative to the www/ folder.
    // Leave as '' (empty string) to disable the background image.
    homeBgImage: 'assets/home/gss-app.jpg',
    homeBgOpacity: 0.15,   // 0.0 = invisible, 1.0 = full opacity

    // ─── Contact Information ─────────────────────────────
    supportEmail: 'gssgwagwalada2024@gmail.com',
    supportPhone: '+234 800 123 4567',
    addressLine: 'Gwagwalada, Abuja, Nigeria',

    // ─── Branding Colours ────────────────────────────────
    // These drive the home page AND all major UI accents.
    themeColor: '#0311d8',
    secondaryColor: '#41cffa',
    accentColor: '#7e22ce',
    neutralDark: '#1f2937',
    neutralLight: '#f9fafb',

    // ─── Feature Flags ───────────────────────────────────
    enableScheduling: true,

    // ─── Assessment Configuration ────────────────────────
   assessmentTypes: {
        CA: {
            label: 'Continuous Assessment',
            shortLabel: 'CA',
            maxQuestions: 20,
            defaultDuration: 5,
            icon: 'clipboard-check',
            color: '#720316',
            bgColor: 'bg-emerald-100',
            textColor: 'text-emerald-700',
        },
        EXAM: {
            label: 'Examination',
            shortLabel: 'Exam',
            maxQuestions: 200,
            defaultDuration: 30,
            icon: 'graduation-cap',
            color: '#2563EB',
            bgColor: 'bg-rose-100',
            textColor: 'text-rose-700',
        }
    }
};

// ─── Convenience Getters ─────────────────────────────────
// Any page can call these directly. They always return
// the current value from SCHOOL_CONFIG (no caching).

window.getSchoolName       = () => SCHOOL_CONFIG.schoolName;
window.getSchoolShortName  = () => SCHOOL_CONFIG.schoolShortName;
window.getSchoolCode       = () => SCHOOL_CONFIG.schoolCode;
window.getSchoolLogo       = () => SCHOOL_CONFIG.logoPath;
window.getSchoolTagline    = () => SCHOOL_CONFIG.tagline;
window.getThemeColor       = () => SCHOOL_CONFIG.themeColor;
window.getSecondaryColor   = () => SCHOOL_CONFIG.secondaryColor;
window.getAccentColor      = () => SCHOOL_CONFIG.accentColor;
window.getAcademicYear     = () => SCHOOL_CONFIG.academicYear;

window.SCHOOL_CONFIG = SCHOOL_CONFIG;