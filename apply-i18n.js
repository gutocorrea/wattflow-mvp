// Script para aplicar atributos data-i18n automaticamente
// Execute este script no console do navegador para aplicar as traduções

function applyI18nAttributes() {
    // Navbar
    document.querySelector('#btn-theme-toggle').setAttribute('aria-label', 'Alternar Tema');
    document.querySelector('#btn-dropdown-profile span:last-child').setAttribute('data-i18n', 'nav_profile');
    document.querySelector('#btn-dropdown-logout span:last-child').setAttribute('data-i18n', 'nav_logout');

    // Welcome View
    const welcomeH1 = document.querySelector('#view-welcome h1');
    if (welcomeH1) {
        const textNode = welcomeH1.childNodes[0];
        if (textNode.nodeType === Node.TEXT_NODE) {
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

    document.querySelector('#btn-welcome-login').setAttribute('data-i18n', 'welcome_login');
    document.querySelector('#btn-welcome-signup').setAttribute('data-i18n', 'welcome_signup');

    // Auth View
    document.querySelector('#auth-title').setAttribute('data-i18n', 'auth_welcome_back');
    document.querySelector('#view-auth .subtitle').setAttribute('data-i18n', 'auth_sync_pedals');
    document.querySelectorAll('#view-auth label')[0].setAttribute('data-i18n', 'auth_email_label');
    document.querySelectorAll('#view-auth label')[1].setAttribute('data-i18n', 'auth_password_label');
    document.querySelector('#btn-submit-login').setAttribute('data-i18n', 'auth_btn_login');
    document.querySelector('#btn-switch-auth-mode').setAttribute('data-i18n', 'auth_switch_signup');
    document.querySelector('#btn-back-auth').setAttribute('data-i18n', 'auth_back');

    // Dashboard
    document.querySelector('#mode-status-text').setAttribute('data-i18n', 'dash_indoor_mode');
    document.querySelector('#view-dashboard h3').setAttribute('data-i18n', 'dash_slope_title');
    document.querySelectorAll('#view-dashboard .metric-card h3')[1].setAttribute('data-i18n', 'dash_power');
    document.querySelectorAll('#view-dashboard .metric-card h3')[2].setAttribute('data-i18n', 'dash_cadence');
    document.querySelectorAll('#view-dashboard .metric-card h3')[3].setAttribute('data-i18n', 'dash_speed');
    document.querySelectorAll('#view-dashboard .metric-card h3')[4].setAttribute('data-i18n', 'dash_calories');
    document.querySelector('#btn-start-ride').setAttribute('data-i18n', 'dash_start_ride');
    document.querySelector('#btn-stop-ride').setAttribute('data-i18n', 'dash_stop_ride');
    document.querySelector('#btn-select-workout').setAttribute('data-i18n', 'dash_workouts');
    document.querySelector('#btn-view-history').setAttribute('data-i18n', 'dash_history');
    document.querySelector('#btn-view-achievements').setAttribute('data-i18n', 'dash_achievements');

    // History View
    document.querySelector('#view-ride-history h2').setAttribute('data-i18n', 'view_history_title');
    document.querySelector('#btn-back-history').setAttribute('data-i18n', 'view_back');

    // Session Details View
    document.querySelector('#view-session-details h2').setAttribute('data-i18n', 'view_session_title');
    document.querySelector('#btn-close-details').setAttribute('data-i18n', 'view_session_close');
    document.querySelectorAll('#view-session-details .label')[0].setAttribute('data-i18n', 'view_session_avg_power');
    document.querySelectorAll('#view-session-details .label')[1].setAttribute('data-i18n', 'view_session_avg_speed');
    document.querySelectorAll('#view-session-details .label')[2].setAttribute('data-i18n', 'view_session_duration');
    document.querySelector('#btn-export-csv').setAttribute('data-i18n', 'view_session_export_csv');
    document.querySelector('#btn-export-gpx').setAttribute('data-i18n', 'view_session_export_gpx');

    // Workouts View
    document.querySelector('#view-workouts h2').setAttribute('data-i18n', 'view_workouts_title');
    document.querySelector('#btn-back-workouts').setAttribute('data-i18n', 'view_back');
    document.querySelector('#btn-create-workout').setAttribute('data-i18n', 'view_workouts_create_btn');

    // Create Workout View
    document.querySelector('#view-create-workout h2').setAttribute('data-i18n', 'view_create_workout_title');
    document.querySelectorAll('#view-create-workout label')[0].setAttribute('data-i18n', 'view_create_workout_name');
    document.querySelectorAll('#view-create-workout label')[1].setAttribute('data-i18n', 'view_create_workout_desc');
    document.querySelectorAll('#view-create-workout label')[2].setAttribute('data-i18n', 'view_create_workout_json');
    document.querySelector('#btn-cancel-create').setAttribute('data-i18n', 'view_create_workout_cancel');
    document.querySelector('#form-create-workout button[type="submit"]').setAttribute('data-i18n', 'view_create_workout_save');

    // Profile View
    document.querySelector('#view-profile h2').setAttribute('data-i18n', 'view_profile_title');
    document.querySelector('#btn-back-profile').setAttribute('data-i18n', 'view_back');
    document.querySelector('.avatar-upload-btn').setAttribute('data-i18n', 'view_profile_photo');
    document.querySelector('#edit-name').previousElementSibling.setAttribute('data-i18n', 'view_profile_name');
    document.querySelector('#edit-weight').previousElementSibling.setAttribute('data-i18n', 'view_profile_weight');
    document.querySelector('#edit-height').previousElementSibling.setAttribute('data-i18n', 'view_profile_height');
    document.querySelector('#edit-bike-type').previousElementSibling.setAttribute('data-i18n', 'view_profile_bike_type');
    document.querySelector('#edit-crank-length').previousElementSibling.setAttribute('data-i18n', 'view_profile_crank');
    document.querySelector('#form-edit-profile button[type="submit"]').setAttribute('data-i18n', 'view_profile_save');

    // Achievements View
    document.querySelector('#view-achievements h2').setAttribute('data-i18n', 'view_achievements_title');
    document.querySelector('#btn-back-achievements').setAttribute('data-i18n', 'view_back');

    // Plans View
    document.querySelector('#view-plans h2').setAttribute('data-i18n', 'plans_title');
    document.querySelector('#btn-back-plans').setAttribute('data-i18n', 'view_back');
    document.querySelector('.credits-label').setAttribute('data-i18n', 'plans_credits_available');

    console.log('✅ Atributos data-i18n aplicados com sucesso!');
    console.log('Execute: window.updateLanguage("pt-BR") para testar');
}

// Auto-executar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyI18nAttributes);
} else {
    applyI18nAttributes();
}
