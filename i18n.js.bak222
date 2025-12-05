import { translations } from './translations.js';

export function applyI18nAttributes() {
    // Navbar
    const themeBtn = document.querySelector('#btn-theme-toggle');
    if (themeBtn) themeBtn.setAttribute('aria-label', 'Alternar Tema');

    const profileSpan = document.querySelector('#btn-dropdown-profile span:last-child');
    if (profileSpan) profileSpan.setAttribute('data-i18n', 'nav_profile');

    const logoutSpan = document.querySelector('#btn-dropdown-logout span:last-child');
    if (logoutSpan) logoutSpan.setAttribute('data-i18n', 'nav_logout');

    // Welcome View
    const welcomeH1 = document.querySelector('#view-welcome h1');
    if (welcomeH1) {
        const textNode = welcomeH1.childNodes[0];
        if (textNode && textNode.nodeType === Node.TEXT_NODE && textNode.textContent.trim()) {
            const span = document.createElement('span');
            span.setAttribute('data-i18n', 'welcome_title');
            span.textContent = textNode.textContent.trim();
            welcomeH1.replaceChild(span, textNode);
        }
        const gradientText = welcomeH1.querySelector('.gradient-text');
        if (gradientText) {
            gradientText.setAttribute('data-i18n', 'welcome_title_highlight');
        }
    }

    const welcomeP = document.querySelector('#view-welcome p');
    if (welcomeP) welcomeP.setAttribute('data-i18n', 'welcome_subtitle');

    const loginBtn = document.querySelector('#btn-welcome-login');
    if (loginBtn) loginBtn.setAttribute('data-i18n', 'welcome_login');

    const signupBtn = document.querySelector('#btn-welcome-signup');
    if (signupBtn) signupBtn.setAttribute('data-i18n', 'welcome_signup');

    // Auth View
    const authTitle = document.querySelector('#auth-title');
    if (authTitle) authTitle.setAttribute('data-i18n', 'auth_welcome_back');

    const authSubtitle = document.querySelector('#view-auth .subtitle');
    if (authSubtitle) authSubtitle.setAttribute('data-i18n', 'auth_sync_pedals');

    const authLabels = document.querySelectorAll('#view-auth label');
    if (authLabels.length >= 2) {
        authLabels[0].setAttribute('data-i18n', 'auth_email_label');
        authLabels[1].setAttribute('data-i18n', 'auth_password_label');
    }

    const submitLoginBtn = document.querySelector('#btn-submit-login');
    if (submitLoginBtn) submitLoginBtn.setAttribute('data-i18n', 'auth_btn_login');

    const switchAuthBtn = document.querySelector('#btn-switch-auth-mode');
    if (switchAuthBtn) switchAuthBtn.setAttribute('data-i18n', 'auth_switch_signup');

    const backAuthBtn = document.querySelector('#btn-back-auth');
    if (backAuthBtn) backAuthBtn.setAttribute('data-i18n', 'auth_back');

    // Dashboard
    const modeStatus = document.querySelector('#mode-status-text');
    if (modeStatus) modeStatus.setAttribute('data-i18n', 'dash_indoor_mode');

    const slopeTitle = document.querySelector('#view-dashboard h3');
    if (slopeTitle) slopeTitle.setAttribute('data-i18n', 'dash_slope_title');

    const metricTitles = document.querySelectorAll('#view-dashboard .metric-card h3');
    if (metricTitles.length >= 5) {
        metricTitles[1].setAttribute('data-i18n', 'dash_power');
        metricTitles[2].setAttribute('data-i18n', 'dash_cadence');
        metricTitles[3].setAttribute('data-i18n', 'dash_speed');
        metricTitles[4].setAttribute('data-i18n', 'dash_calories');
    }

    const startRideBtn = document.querySelector('#btn-start-ride');
    if (startRideBtn) startRideBtn.setAttribute('data-i18n', 'dash_start_ride');

    const stopRideBtn = document.querySelector('#btn-stop-ride');
    if (stopRideBtn) stopRideBtn.setAttribute('data-i18n', 'dash_stop_ride');

    const selectWorkoutBtn = document.querySelector('#btn-select-workout');
    if (selectWorkoutBtn) selectWorkoutBtn.setAttribute('data-i18n', 'dash_workouts');

    const viewHistoryBtn = document.querySelector('#btn-view-history');
    if (viewHistoryBtn) viewHistoryBtn.setAttribute('data-i18n', 'dash_history');

    const viewAchievementsBtn = document.querySelector('#btn-view-achievements');
    if (viewAchievementsBtn) viewAchievementsBtn.setAttribute('data-i18n', 'dash_achievements');

    // History View
    const historyTitle = document.querySelector('#view-ride-history h2');
    if (historyTitle) historyTitle.setAttribute('data-i18n', 'view_history_title');

    const backHistoryBtn = document.querySelector('#btn-back-history');
    if (backHistoryBtn) backHistoryBtn.setAttribute('data-i18n', 'view_back');

    // Session Details View
    const sessionTitle = document.querySelector('#view-session-details h2');
    if (sessionTitle) sessionTitle.setAttribute('data-i18n', 'view_session_title');

    const closeDetailsBtn = document.querySelector('#btn-close-details');
    if (closeDetailsBtn) closeDetailsBtn.setAttribute('data-i18n', 'view_session_close');

    const sessionLabels = document.querySelectorAll('#view-session-details .label');
    if (sessionLabels.length >= 3) {
        sessionLabels[0].setAttribute('data-i18n', 'view_session_avg_power');
        sessionLabels[1].setAttribute('data-i18n', 'view_session_avg_speed');
        sessionLabels[2].setAttribute('data-i18n', 'view_session_duration');
    }

    const exportCsvBtn = document.querySelector('#btn-export-csv');
    if (exportCsvBtn) exportCsvBtn.setAttribute('data-i18n', 'view_session_export_csv');

    const exportGpxBtn = document.querySelector('#btn-export-gpx');
    if (exportGpxBtn) exportGpxBtn.setAttribute('data-i18n', 'view_session_export_gpx');

    // Workouts View
    const workoutsTitle = document.querySelector('#view-workouts h2');
    if (workoutsTitle) workoutsTitle.setAttribute('data-i18n', 'view_workouts_title');

    const backWorkoutsBtn = document.querySelector('#btn-back-workouts');
    if (backWorkoutsBtn) backWorkoutsBtn.setAttribute('data-i18n', 'view_back');

    const createWorkoutBtn = document.querySelector('#btn-create-workout');
    if (createWorkoutBtn) createWorkoutBtn.setAttribute('data-i18n', 'view_workouts_create_btn');

    // Create Workout View
    const createWorkoutTitle = document.querySelector('#view-create-workout h2');
    if (createWorkoutTitle) createWorkoutTitle.setAttribute('data-i18n', 'view_create_workout_title');

    const createWorkoutLabels = document.querySelectorAll('#view-create-workout label');
    if (createWorkoutLabels.length >= 3) {
        createWorkoutLabels[0].setAttribute('data-i18n', 'view_create_workout_name');
        createWorkoutLabels[1].setAttribute('data-i18n', 'view_create_workout_desc');
        createWorkoutLabels[2].setAttribute('data-i18n', 'view_create_workout_json');
    }

    const cancelCreateBtn = document.querySelector('#btn-cancel-create');
    if (cancelCreateBtn) cancelCreateBtn.setAttribute('data-i18n', 'view_create_workout_cancel');

    const saveWorkoutBtn = document.querySelector('#form-create-workout button[type="submit"]');
    if (saveWorkoutBtn) saveWorkoutBtn.setAttribute('data-i18n', 'view_create_workout_save');

    // Profile View
    const profileTitle = document.querySelector('#view-profile h2');
    if (profileTitle) profileTitle.setAttribute('data-i18n', 'view_profile_title');

    const backProfileBtn = document.querySelector('#btn-back-profile');
    if (backProfileBtn) backProfileBtn.setAttribute('data-i18n', 'view_back');

    const avatarUploadBtn = document.querySelector('.avatar-upload-btn');
    if (avatarUploadBtn) avatarUploadBtn.setAttribute('data-i18n', 'view_profile_photo');

    const editNameLabel = document.querySelector('#edit-name')?.previousElementSibling;
    if (editNameLabel) editNameLabel.setAttribute('data-i18n', 'view_profile_name');

    const editWeightLabel = document.querySelector('#edit-weight')?.previousElementSibling;
    if (editWeightLabel) editWeightLabel.setAttribute('data-i18n', 'view_profile_weight');

    const editHeightLabel = document.querySelector('#edit-height')?.previousElementSibling;
    if (editHeightLabel) editHeightLabel.setAttribute('data-i18n', 'view_profile_height');

    const editBikeTypeLabel = document.querySelector('#edit-bike-type')?.previousElementSibling;
    if (editBikeTypeLabel) editBikeTypeLabel.setAttribute('data-i18n', 'view_profile_bike_type');

    const editCrankLabel = document.querySelector('#edit-crank-length')?.previousElementSibling;
    if (editCrankLabel) editCrankLabel.setAttribute('data-i18n', 'view_profile_crank');

    const saveProfileBtn = document.querySelector('#form-edit-profile button[type="submit"]');
    if (saveProfileBtn) saveProfileBtn.setAttribute('data-i18n', 'view_profile_save');

    // Achievements View
    const achievementsTitle = document.querySelector('#view-achievements h2');
    if (achievementsTitle) achievementsTitle.setAttribute('data-i18n', 'view_achievements_title');

    const backAchievementsBtn = document.querySelector('#btn-back-achievements');
    if (backAchievementsBtn) backAchievementsBtn.setAttribute('data-i18n', 'view_back');

    // Plans View
    const plansTitle = document.querySelector('#view-plans h2');
    if (plansTitle) plansTitle.setAttribute('data-i18n', 'plans_title');

    const backPlansBtn = document.querySelector('#btn-back-plans');
    if (backPlansBtn) backPlansBtn.setAttribute('data-i18n', 'view_back');

    const creditsLabel = document.querySelector('.credits-label');
    if (creditsLabel) creditsLabel.setAttribute('data-i18n', 'plans_credits_available');
}

export function updateLanguage(lang) {
    const t = translations[lang];
    if (!t) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.textContent = t[key];
        }
    });

    // Save language preference
    localStorage.setItem('language', lang);
}
