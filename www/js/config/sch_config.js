// sch_config.js - School Configuration
// ═══════════════════════════════════════════════════════════
//  SINGLE SOURCE OF TRUTH
//  Change values here → they apply across the entire app.
// ═══════════════════════════════════════════════════════════

const SCHOOL_CONFIG = {
    // ─── School Identity ─────────────────────────────────
    schoolName: 'Government Science Secondary School, Abuja',
    schoolShortName: 'GSSS',
    tagline: 'Education for Positive Change',
    subtitle: 'Offline Examination Platform',

    // ─── Logo ────────────────────────────────────────────
    // Path is relative to the www/ folder
    logoPath: 'js/icons/128x128.png',
    logoAlt: 'GSSS Logo',   // fallback alt text

    // ─── Contact ─────────────────────────────────────────
    supportEmail: 'support@gsss.edu.ng',
    supportPhone: '+234 800 123 4567',
    addressLine: 'Tungan Maje, Abuja, Nigeria',

    // ─── Branding Colours ────────────────────────────────
    // These drive the home page AND all major UI accents.
    themeColor: '#B80236',       // main brand colour (maroon)
    secondaryColor: '#8a0228',   // darker shade for gradients
    accentColor: '#7e22ce',      // exam-office purple
    neutralDark: '#1f2937',      // text
    neutralLight: '#f9fafb',     // page background

    // ─── Feature Flags ───────────────────────────────────
    enableScheduling: true,

    // ─── Assessment Configuration ────────────────────────
    assessmentTypes: {
        CA: {
            label: 'Continuous Assessment',
            shortLabel: 'CA',
            maxQuestions: 20,
            defaultDuration: 30,
            icon: 'clipboard-check',
            color: '#720316',
            bgColor: 'bg-emerald-100',
            textColor: 'text-emerald-700',
        },
        EXAM: {
            label: 'Examination',
            shortLabel: 'Exam',
            maxQuestions: 100,
            defaultDuration: 120,
            icon: 'graduation-cap',
            color: '#B80236',
            bgColor: 'bg-rose-100',
            textColor: 'text-rose-700',
        }
    }
};

// ─── Convenience Getters ─────────────────────────────────
// Any page can call these directly. They always return
// the current value from SCHOOL_CONFIG (no caching).

window.getSchoolName = () => SCHOOL_CONFIG.schoolName;
window.getSchoolShortName = () => SCHOOL_CONFIG.schoolShortName;
window.getSchoolLogo = () => SCHOOL_CONFIG.logoPath;
window.getSchoolTagline = () => SCHOOL_CONFIG.tagline;
window.getThemeColor = () => SCHOOL_CONFIG.themeColor;
window.getSecondaryColor = () => SCHOOL_CONFIG.secondaryColor;
window.getAccentColor = () => SCHOOL_CONFIG.accentColor;

window.SCHOOL_CONFIG = SCHOOL_CONFIG;