import './style.css';
import { supabase } from './supabaseClient.js';
import { applyI18nAttributes, updateLanguage } from './i18n.js';

// ==================== INTERNATIONALIZATION ====================

// Detect browser language or use saved preference
const savedLang = localStorage.getItem('language');
const browserLang = navigator.language || navigator.userLanguage;
let currentLang = savedLang || (browserLang.startsWith('pt') ? 'pt-BR' : browserLang.startsWith('es') ? 'es-ES' : 'en-US');

// Apply language when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    // Apply data-i18n attributes first
    applyI18nAttributes();

    // Then translate
    updateLanguage(currentLang);

    // Language Dropdown Logic
    const langToggle = document.getElementById('btn-lang-toggle');
    const langMenu = document.getElementById('lang-menu');
    const langOptions = document.querySelectorAll('.lang-option');
    const currentFlag = document.getElementById('current-lang-flag');

    // Toggle Menu
    if (langToggle && langMenu) {
        langToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            langMenu.classList.toggle('hidden');
        });

        // Close menu when clicking outside
        document.addEventListener('click', () => {
            langMenu.classList.add('hidden');
        });

        // Prevent menu closing when clicking inside
        langMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    function updateActiveLangOption(lang) {
        // Update Flag in Toggle Button
        const flags = {
            'pt-BR': '🇧🇷',
            'es-ES': '🇪🇸',
            'en-US': '🇺🇸'
        };
        if (currentFlag) currentFlag.textContent = flags[lang] || '🇧🇷';

        // Update Active Class in Menu
        langOptions.forEach(btn => {
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Set initial state
    updateActiveLangOption(currentLang);

    // Handle Language Selection
    langOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            updateLanguage(lang);
            currentLang = lang;
            updateActiveLangOption(lang);
            if (langMenu) langMenu.classList.add('hidden'); // Close menu after selection
        });
    });
});

// Expose for external use if needed (debugging)
window.updateLanguage = updateLanguage;
window.currentLang = currentLang;


// State Management
const state = {
    user: {
        name: null,
        avatar: null,
        weight: null,
        height: null,
        credits: 10, // Default trial credits
        plan: 'free', // 'free', 'amateur', 'pro'
    },
    bike: {
        type: 'road',
        crankLength: 172.5,
    },
    ride: {
        active: false,
        startTime: null,
        dataPoints: [], // Store metrics to calculate average
        intervalId: null,
        slope: 0, // Grade %
    },
    history: [],
    customWorkouts: [],
    achievements: [], // IDs of unlocked achievements
    stats: {
        totalDistance: 0,
        totalDuration: 0,
        maxPower: 0,
        totalRides: 0
    },
    session: null
};

// DOM Elements
const views = {
    welcome: document.getElementById('view-welcome'),
    setupProfile: document.getElementById('view-setup-profile'),
    setupBike: document.getElementById('view-setup-bike'),
    dashboard: document.getElementById('view-dashboard'),
    history: document.getElementById('view-ride-history'),
    sessionDetails: document.getElementById('view-session-details'),
    workouts: document.getElementById('view-workouts'),
    createWorkout: document.getElementById('view-create-workout'),
    achievements: document.getElementById('view-achievements'),
    workoutOverlay: document.getElementById('workout-overlay'),
    auth: document.getElementById('view-auth'),
    profile: document.getElementById('view-profile'),
    plans: document.getElementById('view-plans'),
};

const forms = {
    profile: document.getElementById('form-profile'),
    bike: document.getElementById('form-bike'),
    createWorkout: document.getElementById('form-create-workout'),
    auth: document.getElementById('form-auth'),
    editProfile: document.getElementById('form-edit-profile'),
};

const displays = {
    power: document.getElementById('val-power'),
    cadence: document.getElementById('val-cadence'),
    speed: document.getElementById('val-speed'),
    slope: document.getElementById('val-slope'),
    calories: document.getElementById('val-calories'),
    // Workout Displays
    intervalName: document.getElementById('interval-name'),
    intervalTimer: document.getElementById('interval-timer'),
    targetPower: document.getElementById('target-power'),
    powerBar: document.getElementById('power-bar-fill'),
};

// --- GPS / Outdoor Mode State ---
let isOutdoorMode = false;
let watchId = null;
let lastPosition = null;
let gpsSpeed = 0;
let gpsSlope = 0;

document.getElementById('toggle-outdoor-mode')?.addEventListener('change', (e) => {
    isOutdoorMode = e.target.checked;
    const statusText = document.getElementById('mode-status-text');
    const slopeSlider = document.getElementById('slope-slider');

    if (isOutdoorMode) {
        statusText.textContent = 'Modo Outdoor (GPS) 🛰️';
        if (slopeSlider) slopeSlider.disabled = true;
        enableGPS();
    } else {
        statusText.textContent = 'Modo Indoor 🏠';
        if (slopeSlider) slopeSlider.disabled = false;
        disableGPS();
        gpsSpeed = 0;
        gpsSlope = 0;
    }
});

// --- Core Helper Functions ---

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(frequency, duration) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    oscillator.stop(audioCtx.currentTime + duration);
}

function navigateTo(viewName) {
    console.log('Navigating to:', viewName);
    // Hide all views
    Object.values(views).forEach(view => {
        if (view) {
            view.classList.add('hidden');
            view.classList.remove('active');
        }
    });

    // Show target view
    const target = views[viewName];
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
        window.scrollTo(0, 0);
    } else {
        console.error('View not found:', viewName);
    }
}
window.navigateTo = navigateTo; // Expose for debugging

function calculatePower(speedKmh, weightKg, bikeType, slope) {
    // Basic Physics Model
    const g = 9.81;
    const speedMs = speedKmh / 3.6;
    const mass = parseFloat(weightKg) + 10; // Rider + Bike (10kg approx)
    const grade = slope / 100;

    // Coefficients
    let cr = 0.004; // Rolling resistance
    let cd = 0.6;   // Drag coefficient
    let area = 0.5; // Frontal area (m2)

    if (bikeType === 'mtb') {
        cr = 0.008;
        cd = 0.8;
        area = 0.6;
    } else if (bikeType === 'tt') {
        cd = 0.5;
        area = 0.4;
    }

    // Forces
    const fGravity = mass * g * Math.sin(Math.atan(grade));
    const fRolling = mass * g * Math.cos(Math.atan(grade)) * cr;
    const fDrag = 0.5 * 1.225 * cd * area * Math.pow(speedMs, 2);

    const totalForce = fGravity + fRolling + fDrag;
    const power = totalForce * speedMs; // Watts

    // Drivetrain loss (~3%)
    return Math.max(0, power / 0.97);
}

const sensors = {
    device: null,
    server: null,
    cscService: null,
    powerService: null,
    cscCharacteristic: null,
    powerCharacteristic: null,
    connected: false,
    sensorType: null, // 'csc', 'power', or 'both'

    // Real-time sensor data
    data: {
        speed: 0,
        cadence: 0,
        power: 0,
        lastCrankTime: 0,
        lastCrankRevs: 0,
        lastWheelTime: 0,
        lastWheelRevs: 0,
        wheelCircumference: 2.105 // meters (700x25c tire, adjustable)
    },

    async connect() {
        // Check for Web Bluetooth support
        if (!navigator.bluetooth) {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            if (isIOS) {
                alert('O Safari no iOS não suporta Bluetooth Web.\n\nPara conectar seus sensores no iPhone, instale o navegador "Bluefy" na App Store e abra este site por lá.');
            } else {
                alert('Seu navegador ou dispositivo não suporta Bluetooth Web.\n\nTente usar o Chrome no Android ou Desktop.');
            }
            return;
        }

        try {
            // Request Bluetooth Device - accept both CSC and Power sensors
            this.device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: ['cycling_speed_and_cadence'] },
                    { services: ['cycling_power'] }
                ],
                optionalServices: ['cycling_speed_and_cadence', 'cycling_power']
            });

            this.server = await this.device.gatt.connect();

            // Try to connect to Power Meter first (priority)
            try {
                this.powerService = await this.server.getPrimaryService('cycling_power');
                this.powerCharacteristic = await this.powerService.getCharacteristic('cycling_power_measurement');
                await this.powerCharacteristic.startNotifications();
                this.powerCharacteristic.addEventListener('characteristicvaluechanged',
                    this.handlePowerValueChanged.bind(this));
                this.sensorType = 'power';
                console.log('✅ Power Meter conectado');
            } catch (e) {
                console.log('Nenhum Power Meter encontrado');
            }

            // Try to connect to CSC sensor
            try {
                this.cscService = await this.server.getPrimaryService('cycling_speed_and_cadence');
                this.cscCharacteristic = await this.cscService.getCharacteristic('csc_measurement');
                await this.cscCharacteristic.startNotifications();
                this.cscCharacteristic.addEventListener('characteristicvaluechanged',
                    this.handleCSCValueChanged.bind(this));

                if (this.sensorType === 'power') {
                    this.sensorType = 'both';
                } else {
                    this.sensorType = 'csc';
                }
                console.log('✅ Sensor CSC conectado');
            } catch (e) {
                console.log('Nenhum sensor CSC encontrado');
            }

            if (this.sensorType) {
                this.connected = true;
                const sensorNames = {
                    'power': 'Medidor de Potência',
                    'csc': 'Sensor de Cadência/Velocidade',
                    'both': 'Power Meter + Sensor CSC'
                };
                alert(`✅ ${sensorNames[this.sensorType]} conectado com sucesso!`);
                document.getElementById('btn-connect-bluetooth').textContent = '✅';
            } else {
                alert('❌ Nenhum sensor compatível encontrado no dispositivo.');
            }

        } catch (error) {
            console.error('Bluetooth Error:', error);
            alert('Erro ao conectar Bluetooth: ' + error.message);
        }
    },

    handlePowerValueChanged(event) {
        const value = event.target.value;
        const flags = value.getUint8(0);

        // Bit 0: Pedal Power Balance Present
        // Bit 1: Pedal Power Balance Reference
        // Bit 2: Accumulated Torque Present
        // Bit 3: Accumulated Torque Source
        // Bit 4-5: Reserved

        let offset = 1;

        // Instantaneous Power (always present) - Int16
        const instantPower = value.getInt16(offset, true);
        this.data.power = instantPower;
        offset += 2;

        console.log(`💪 Potência: ${instantPower}W`);

        // Optional: Parse other fields if needed (torque, balance, etc.)
    },

    handleCSCValueChanged(event) {
        const value = event.target.value;
        const flags = value.getUint8(0);

        // Bit 0: Wheel Revolution Data Present
        // Bit 1: Crank Revolution Data Present
        const wheelDataPresent = flags & 0x01;
        const crankDataPresent = flags & 0x02;

        let offset = 1;

        // Parse Wheel Revolution Data
        if (wheelDataPresent) {
            const wheelRevs = value.getUint32(offset, true);
            offset += 4;
            const wheelTime = value.getUint16(offset, true); // 1/1024 seconds
            offset += 2;

            if (this.data.lastWheelRevs > 0) {
                const revDiff = wheelRevs - this.data.lastWheelRevs;
                const timeDiff = (wheelTime - this.data.lastWheelTime) / 1024; // seconds

                if (timeDiff > 0 && revDiff > 0) {
                    // Speed = (revolutions * circumference) / time
                    const speedMs = (revDiff * this.data.wheelCircumference) / timeDiff;
                    this.data.speed = speedMs * 3.6; // Convert m/s to km/h
                    console.log(`🚴 Velocidade: ${this.data.speed.toFixed(1)} km/h`);
                }
            }

            this.data.lastWheelRevs = wheelRevs;
            this.data.lastWheelTime = wheelTime;
        }

        // Parse Crank Revolution Data
        if (crankDataPresent) {
            const crankRevs = value.getUint16(offset, true);
            offset += 2;
            const crankTime = value.getUint16(offset, true); // 1/1024 seconds
            offset += 2;

            if (this.data.lastCrankRevs > 0) {
                const revDiff = crankRevs - this.data.lastCrankRevs;
                const timeDiff = (crankTime - this.data.lastCrankTime) / 1024; // seconds

                if (timeDiff > 0 && revDiff > 0) {
                    // Cadence = (revolutions / time) * 60
                    this.data.cadence = (revDiff / timeDiff) * 60;
                    console.log(`⚙️ Cadência: ${this.data.cadence.toFixed(0)} RPM`);
                }
            }

            this.data.lastCrankRevs = crankRevs;
            this.data.lastCrankTime = crankTime;
        }
    },

    getReading(currentSpeed) {
        if (!this.connected) {
            // Return zeros when not connected - NO SIMULATION
            return {
                speed: 0,
                cadence: 0,
                power: 0
            };
        }

        // Return ONLY real sensor data
        return {
            speed: this.data.speed || 0,
            cadence: this.data.cadence || 0,
            power: this.data.power || 0
        };
    },

    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
            this.connected = false;
            this.sensorType = null;
            this.data = {
                speed: 0,
                cadence: 0,
                power: 0,
                lastCrankTime: 0,
                lastCrankRevs: 0,
                lastWheelTime: 0,
                lastWheelRevs: 0,
                wheelCircumference: 2.105
            };
            document.getElementById('btn-connect-bluetooth').textContent = '📡';
            console.log('Sensor desconectado');
        }
    }
};

function init() {
    initAuth();
}

// --- Achievements Data ---
const ACHIEVEMENTS = [
    { id: 'first_ride', title: 'Primeiro Pedal', desc: 'Complete sua primeira sessão.', icon: '🚴' },
    { id: 'power_100', title: 'Clube dos 100', desc: 'Atingiu 100 Watts.', icon: '⚡' },
    { id: 'power_200', title: 'Potência Pura', desc: 'Atingiu 200 Watts.', icon: '🔥' },
    { id: 'power_300', title: 'Nível Pro', desc: 'Atingiu 300 Watts.', icon: '🚀' },
    { id: 'dist_10', title: 'Explorador', desc: 'Pedalou 10km no total.', icon: '🗺️' },
    { id: 'climber', title: 'Bode da Montanha', desc: 'Pedalou em inclinação >5%.', icon: '🐐' },
];

function checkAchievements(currentPower, currentSlope) {
    const unlocked = [];

    // Real-time checks
    if (currentPower >= 100 && !hasAchievement('power_100')) unlocked.push('power_100');
    if (currentPower >= 200 && !hasAchievement('power_200')) unlocked.push('power_200');
    if (currentPower >= 300 && !hasAchievement('power_300')) unlocked.push('power_300');
    if (currentSlope >= 5 && !hasAchievement('climber')) unlocked.push('climber');

    if (unlocked.length > 0) {
        unlocked.forEach(id => {
            state.achievements.push(id);
            showToast(ACHIEVEMENTS.find(a => a.id === id));
        });
        saveState();
    }
}

function checkPostRideAchievements() {
    const unlocked = [];
    if (state.stats.totalRides >= 1 && !hasAchievement('first_ride')) unlocked.push('first_ride');
    if (state.stats.totalDistance >= 10 && !hasAchievement('dist_10')) unlocked.push('dist_10');

    if (unlocked.length > 0) {
        unlocked.forEach(id => {
            state.achievements.push(id);
            showToast(ACHIEVEMENTS.find(a => a.id === id));
        });
        saveState();
    }
}

function hasAchievement(id) {
    return state.achievements.includes(id);
}

function showToast(achievement) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-icon">${achievement.icon}</div>
        <div class="toast-content">
            <div class="toast-title">Desbloqueado: ${achievement.title}</div>
            <div class="toast-message">${achievement.desc}</div>
        </div>
    `;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('visible'), 100);

    // Remove
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 500);
    }, 4000);

    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

function renderAchievements() {
    const grid = document.getElementById('achievements-grid');
    grid.innerHTML = '';

    ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = hasAchievement(ach.id);
        const card = document.createElement('div');
        card.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;
        card.innerHTML = `
            <div class="achievement-icon">${ach.icon}</div>
            <div class="achievement-title">${ach.title}</div>
            <div class="achievement-desc">${ach.desc}</div>
        `;
        grid.appendChild(card);
    });
}

function saveCustomWorkout(e) {
    e.preventDefault();
    const title = document.getElementById('workout-title').value;
    const desc = document.getElementById('workout-desc').value;
    const jsonStr = document.getElementById('workout-json').value;

    try {
        const intervals = JSON.parse(jsonStr);
        if (!Array.isArray(intervals)) throw new Error("Intervalos devem ser um array");

        const newWorkout = {
            id: 'custom-' + Date.now(),
            title: title,
            description: desc,
            intervals: intervals
        };

        state.customWorkouts.push(newWorkout);

        // Save to Supabase if logged in
        if (state.session) {
            supabase.from('custom_workouts').insert({
                user_id: state.session.user.id,
                title: title,
                description: desc,
                intervals: intervals
            }).then(({ error }) => {
                if (error) console.error('Error saving workout to Supabase:', error);
            });
        }

        saveState();

        // Reset form
        forms.createWorkout.reset();

        renderWorkouts();
        navigateTo('workouts');
    } catch (err) {
        alert('Formato JSON inválido: ' + err.message);
    }
}

// Predefined Workouts
const PREDEFINED_WORKOUTS = [
    {
        id: 'sweet-spot',
        title: 'Sweet Spot 60min',
        description: 'Treino de resistência na zona Sweet Spot',
        intervals: [
            { name: 'Aquecimento', duration: 600, target: 100 },
            { name: 'Sweet Spot 1', duration: 1200, target: 200 },
            { name: 'Recuperação', duration: 300, target: 80 },
            { name: 'Sweet Spot 2', duration: 1200, target: 200 },
            { name: 'Desaquecimento', duration: 300, target: 80 }
        ]
    },
    {
        id: 'intervals',
        title: 'Intervalos 4x4',
        description: 'Intervalos de alta intensidade',
        intervals: [
            { name: 'Aquecimento', duration: 600, target: 100 },
            { name: 'Intervalo 1', duration: 240, target: 250 },
            { name: 'Recuperação', duration: 240, target: 80 },
            { name: 'Intervalo 2', duration: 240, target: 250 },
            { name: 'Recuperação', duration: 240, target: 80 },
            { name: 'Intervalo 3', duration: 240, target: 250 },
            { name: 'Recuperação', duration: 240, target: 80 },
            { name: 'Intervalo 4', duration: 240, target: 250 },
            { name: 'Desaquecimento', duration: 300, target: 80 }
        ]
    },
    {
        id: 'endurance',
        title: 'Resistência Base',
        description: 'Treino longo de resistência aeróbica',
        intervals: [
            { name: 'Aquecimento', duration: 600, target: 100 },
            { name: 'Zona 2', duration: 3600, target: 150 },
            { name: 'Desaquecimento', duration: 300, target: 80 }
        ]
    }
];

function renderWorkouts() {
    const listContainer = document.getElementById('workout-list');
    listContainer.innerHTML = '';

    // Combine predefined and custom workouts
    const allWorkouts = [...PREDEFINED_WORKOUTS, ...state.customWorkouts];

    if (allWorkouts.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">Nenhum treino disponível.</p>';
        return;
    }

    allWorkouts.forEach(workout => {
        const item = document.createElement('div');
        item.className = 'workout-item';
        item.style.cursor = 'pointer';
        item.style.padding = '1rem';
        item.style.marginBottom = '0.5rem';
        item.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        item.style.borderRadius = '8px';
        item.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        item.style.transition = 'all 0.2s ease';

        item.onmouseover = () => {
            item.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            item.style.borderColor = 'var(--primary)';
        };
        item.onmouseout = () => {
            item.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            item.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        };

        item.onclick = () => {
            startRide(true, workout);
        };

        const totalDuration = workout.intervals.reduce((sum, interval) => sum + interval.duration, 0);
        const durationText = formatDuration(totalDuration);

        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.25rem;">${workout.title}</div>
                    <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.9rem;">${workout.description || ''}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.2rem; font-weight: 600; color: var(--primary);">${durationText}</div>
                    <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem;">${workout.intervals.length} intervalos</div>
                </div>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

// Ride Logic
let activeWorkout = null;
let currentIntervalIndex = 0;
let intervalTimeRemaining = 0;

function startRide(isWorkout = false, workoutData = null) {
    // Check if sensors are connected
    if (!sensors.connected) {
        alert('⚠️ ATENÇÃO: Nenhum sensor Bluetooth conectado!\n\nPara usar dados reais, conecte seus sensores antes de iniciar o pedal.\n\nClique no botão 📡 para conectar.');
        return;
    }

    state.ride.active = true;
    state.ride.startTime = Date.now();
    state.ride.dataPoints = []; // Reset data points

    // Resume Audio Context if needed (browser policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    document.getElementById('btn-start-ride').classList.add('hidden');
    document.getElementById('btn-select-workout').classList.add('hidden');
    document.getElementById('btn-stop-ride').classList.remove('hidden');
    document.getElementById('btn-view-history').classList.add('hidden');

    if (isWorkout && workoutData) {
        activeWorkout = workoutData;
        currentIntervalIndex = 0;
        intervalTimeRemaining = activeWorkout.intervals[0].duration;
        views.workoutOverlay.classList.remove('hidden');
        navigateTo('dashboard');
    } else {
        activeWorkout = null;
        views.workoutOverlay.classList.add('hidden');
    }

    // Start Loop
    state.ride.intervalId = setInterval(() => {
        updateRideMetrics();
    }, 1000);
}

function stopRide() {
    state.ride.active = false;
    clearInterval(state.ride.intervalId);

    const endTime = Date.now();
    const durationSeconds = (endTime - state.ride.startTime) / 1000;

    // Calculate Averages
    const points = state.ride.dataPoints;
    let avgPower = 0, avgSpeed = 0;

    if (points.length > 0) {
        const sumPower = points.reduce((a, b) => a + b.power, 0);
        const sumSpeed = points.reduce((a, b) => a + b.speed, 0);
        avgPower = Math.round(sumPower / points.length);
        avgSpeed = (sumSpeed / points.length).toFixed(1);
    }

    // Save Session
    const session = {
        id: Date.now(),
        date: new Date().toISOString(),
        duration: durationSeconds,
        avgPower: avgPower,
        avgSpeed: avgSpeed,
        dataPoints: points,
        workoutName: activeWorkout ? activeWorkout.title : 'Free Ride'
    };

    state.history.unshift(session);

    // Save to Supabase if logged in
    if (state.session) {
        const userId = state.session.user.id;
        supabase.from('rides').insert({
            user_id: userId,
            date: session.date,
            duration: session.duration,
            avg_power: session.avgPower,
            avg_speed: session.avgSpeed,
            data_points: session.dataPoints,
            workout_name: session.workoutName
        }).then(({ error }) => {
            if (error) console.error('Error saving ride to Supabase:', error);
        });
    }

    saveState();
    consumeCredit();

    document.getElementById('btn-start-ride').classList.remove('hidden');
    document.getElementById('btn-select-workout').classList.remove('hidden');
    document.getElementById('btn-stop-ride').classList.add('hidden');
    document.getElementById('btn-view-history').classList.remove('hidden');
    views.workoutOverlay.classList.add('hidden');

    // Reset display
    displays.power.textContent = '0';
    displays.cadence.textContent = '0';
    displays.speed.textContent = '0';
}

function updateRideMetrics() {
    // Get Data (Simulated or Real)
    let currentSpeedVal;
    let currentSlope;

    if (isOutdoorMode) {
        currentSpeedVal = gpsSpeed;
        currentSlope = gpsSlope;
        // Update displays
        displays.speed.textContent = currentSpeedVal.toFixed(1);
        // Slope display is updated in GPS callback
    } else {
        currentSpeedVal = parseFloat(displays.speed.textContent) || 30; // From sensor or simulation
        currentSlope = state.ride.slope || 0;
    }

    const reading = sensors.getReading(currentSpeedVal);

    // Use ONLY real sensor data - NO CALCULATIONS
    const currentPower = Math.round(reading.power);
    const currentSpeed = parseFloat(reading.speed.toFixed(1));
    const currentCadence = Math.round(reading.cadence);

    // Store for average calculation
    state.ride.dataPoints.push({
        timestamp: Date.now(),
        power: currentPower,
        speed: currentSpeed,
        cadence: currentCadence
    });

    displays.power.textContent = currentPower;
    displays.cadence.textContent = currentCadence;
    displays.speed.textContent = currentSpeed;

    // Workout Logic
    if (activeWorkout) {
        updateWorkoutState(currentPower);
    }
}

function updateWorkoutState(currentPower) {
    const interval = activeWorkout.intervals[currentIntervalIndex];

    // Audio Feedback
    if (intervalTimeRemaining <= 3 && intervalTimeRemaining > 0) {
        playBeep(880, 0.1); // High pitch beep for countdown
    }

    // Update Timer
    intervalTimeRemaining--;
    const mins = Math.floor(intervalTimeRemaining / 60).toString().padStart(2, '0');
    const secs = (intervalTimeRemaining % 60).toString().padStart(2, '0');
    displays.intervalTimer.textContent = `${mins}:${secs}`;
    displays.intervalName.textContent = interval.name;
    displays.targetPower.textContent = interval.target;

    // Update Power Bar
    // Bar Range: 0 to Target * 2. Target is center (50%)
    const percentage = (currentPower / (interval.target * 2)) * 100;
    const clamped = Math.min(Math.max(percentage, 0), 100);
    displays.powerBar.style.width = `${clamped}%`;

    // Color Feedback
    const diff = Math.abs(currentPower - interval.target);
    const tolerance = 10; // +/- 10 Watts

    if (diff <= tolerance) {
        displays.powerBar.style.backgroundColor = 'var(--success)'; // Green
    } else if (currentPower < interval.target) {
        displays.powerBar.style.backgroundColor = '#3b82f6'; // Blue (Too low)
    } else {
        displays.powerBar.style.backgroundColor = 'var(--danger)'; // Red (Too high)
    }

    // Next Interval
    if (intervalTimeRemaining <= 0) {
        currentIntervalIndex++;
        if (currentIntervalIndex < activeWorkout.intervals.length) {
            intervalTimeRemaining = activeWorkout.intervals[currentIntervalIndex].duration;
            playBeep(1200, 0.3); // Longer, higher beep for new interval
            if (navigator.vibrate) navigator.vibrate(200);
        } else {
            // Workout Complete
            playBeep(1500, 0.5); // Victory beep
            stopRide();
            alert('Treino Completo!');
        }
    }
}

// History & Charts
let currentSession = null;

function renderHistory() {
    const listContainer = document.getElementById('history-list');
    listContainer.innerHTML = '';

    if (state.history.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">Nenhum pedal gravado ainda.</p>';
        return;
    }

    state.history.forEach(session => {
        const date = new Date(session.date).toLocaleDateString() + ' ' + new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const duration = formatDuration(session.duration);

        const item = document.createElement('div');
        item.className = 'history-item';
        item.style.cursor = 'pointer';
        item.onclick = () => openSessionDetails(session); // Click to open details

        item.innerHTML = `
            <div>
                <div class="history-date">${date}</div>
                <div class="history-stats">
                    ${duration} • <span>${session.avgPower}W</span> avg
                </div>
            </div>
            <div class="history-speed">
                ${session.avgSpeed} km/h
            </div>
        `;
        listContainer.appendChild(item);
    });
}

function openSessionDetails(session) {
    currentSession = session;

    document.getElementById('detail-avg-power').textContent = session.avgPower + ' W';
    document.getElementById('detail-avg-speed').textContent = session.avgSpeed + ' km/h';
    document.getElementById('detail-duration').textContent = formatDuration(session.duration);

    navigateTo('sessionDetails');

    // Wait for view to be visible before drawing canvas
    setTimeout(() => {
        drawChart(session.dataPoints);
    }, 100);
}

function drawChart(dataPoints) {
    const canvas = document.getElementById('session-chart');
    const ctx = canvas.getContext('2d');

    // Resize canvas
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!dataPoints || dataPoints.length === 0) return;

    // Scales
    const padding = 20;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;

    const maxPower = Math.max(...dataPoints.map(p => p.power)) || 100;
    const maxLen = dataPoints.length;

    // Draw Power Line
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8'; // Primary Color
    ctx.lineWidth = 2;

    dataPoints.forEach((point, index) => {
        const x = padding + (index / (maxLen - 1)) * width;
        const y = padding + height - (point.power / maxPower) * height;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Gradient Area
    ctx.lineTo(padding + width, padding + height);
    ctx.lineTo(padding, padding + height);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.fill();
}

function exportGPX() {
    if (!currentSession) return;

    const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="WattFlow" version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd">
 <metadata>
  <time>${new Date(currentSession.date).toISOString()}</time>
 </metadata>
 <trk>
  <name>WattFlow Ride - ${new Date(currentSession.date).toLocaleDateString()}</name>
  <trkseg>`;

    const gpxFooter = `
  </trkseg>
 </trk>
</gpx>`;

    const gpxPoints = currentSession.dataPoints.map(p => {
        // Simulating a stationary ride (0,0) as standard for indoor trainers without virtual GPS
        return `
   <trkpt lat="0" lon="0">
    <time>${new Date(p.timestamp).toISOString()}</time>
    <extensions>
     <gpxtpx:TrackPointExtension xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
      <gpxtpx:atemp>25</gpxtpx:atemp>
      <gpxtpx:cad>${Math.round(p.cadence)}</gpxtpx:cad>
      <gpxtpx:watts>${Math.round(p.power)}</gpxtpx:watts>
     </gpxtpx:TrackPointExtension>
    </extensions>
   </trkpt>`;
    }).join('');

    const gpxContent = gpxHeader + gpxPoints + gpxFooter;

    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wattflow_${currentSession.id}.gpx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportCSV() {
    if (!currentSession) return;

    const headers = ['Timestamp,Power(W),Speed(km/h),Cadence(rpm)\n'];
    const rows = currentSession.dataPoints.map(p => {
        return `${new Date(p.timestamp).toISOString()
            },${p.power},${p.speed},${p.cadence} `;
    });

    const csvContent = headers.concat(rows).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `wattflow_session_${currentSession.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s} s`;
}

// --- Data Persistence ---
async function saveState() {
    // Always save to LocalStorage as backup/offline
    localStorage.setItem('wattflow_user', JSON.stringify(state.user));
    localStorage.setItem('wattflow_bike', JSON.stringify(state.bike));
    localStorage.setItem('wattflow_history', JSON.stringify(state.history));
    localStorage.setItem('wattflow_workouts', JSON.stringify(state.customWorkouts));
    localStorage.setItem('wattflow_achievements', JSON.stringify(state.achievements));
    localStorage.setItem('wattflow_stats', JSON.stringify(state.stats));

    // If logged in, sync with Supabase
    if (state.session) {
        const userId = state.session.user.id;

        // Sync Profile
        await supabase.from('profiles').upsert({
            id: userId,
            name: state.user.name,
            weight: state.user.weight,
            height: state.user.height,
            bike_type: state.bike.type,
            crank_length: state.bike.crankLength,
            avatar_url: state.user.avatar
        });

        // Sync Achievements (Only new ones ideally, but upsert works)
        for (const achId of state.achievements) {
            const { data } = await supabase.from('user_achievements').select('id').eq('user_id', userId).eq('achievement_id', achId);
            if (!data || data.length === 0) {
                await supabase.from('user_achievements').insert({ user_id: userId, achievement_id: achId });
            }
        }

        // Note: Rides and Workouts are complex arrays. 
        // For MVP, we'll just ensure the latest ride is pushed if it's new.
    }
}

async function loadState() {
    console.log('loadState: starting...');
    try {
        // Load from LocalStorage first (fast)
        const user = JSON.parse(localStorage.getItem('wattflow_user'));
        const bike = JSON.parse(localStorage.getItem('wattflow_bike'));
        const history = JSON.parse(localStorage.getItem('wattflow_history'));
        const workouts = JSON.parse(localStorage.getItem('wattflow_workouts'));
        const achievements = JSON.parse(localStorage.getItem('wattflow_achievements'));
        const stats = JSON.parse(localStorage.getItem('wattflow_stats'));

        if (user) state.user = user;
        if (bike) state.bike = bike;
        if (history) state.history = history;
        if (workouts) state.customWorkouts = workouts;
        if (achievements) state.achievements = achievements;
        if (stats) state.stats = stats;

        // If logged in, fetch from Supabase and merge/override
        if (state.session) {
            console.log('loadState: session found, fetching from Supabase...');
            const userId = state.session.user.id;

            // Fetch Profile - Handle 406/Null gracefully
            try {
                console.log('loadState: fetching profile...');
                const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

                if (error && error.code !== 'PGRST116') {
                    console.warn('Error fetching profile:', error);
                }

                if (profile) {
                    console.log('loadState: profile found', profile);
                    if (profile.name) state.user.name = profile.name;
                    if (profile.weight) state.user.weight = profile.weight;
                    if (profile.height) state.user.height = profile.height;
                    state.bike.type = profile.bike_type;
                    state.bike.crankLength = profile.crank_length;
                    if (profile.avatar_url) state.user.avatar = profile.avatar_url;

                    // Load Credits and Plan
                    if (profile.credits !== undefined && profile.credits !== null) state.user.credits = profile.credits;
                    if (profile.subscription_plan) state.user.plan = profile.subscription_plan;
                    updateCreditsUI();
                } else {
                    console.log('loadState: no profile found');
                }
            } catch (err) {
                console.warn('Profile fetch failed:', err);
            }

            // Fetch History (Rides)
            const { data: rides } = await supabase.from('rides').select('*').eq('user_id', userId).order('date', { ascending: false });
            if (rides) {
                const mappedRides = rides.map(r => ({
                    id: r.id,
                    date: r.date,
                    duration: r.duration,
                    avgPower: r.avg_power,
                    avgSpeed: r.avg_speed,
                    dataPoints: r.data_points,
                    workoutName: r.workout_name
                }));
                state.history = mappedRides;
            }

            // Fetch Achievements
            const { data: dbAchievements } = await supabase.from('user_achievements').select('achievement_id').eq('user_id', userId);
            if (dbAchievements) {
                const dbIds = dbAchievements.map(a => a.achievement_id);
                state.achievements = [...new Set([...state.achievements, ...dbIds])];
            }

            // Fetch Custom Workouts
            const { data: dbWorkouts } = await supabase.from('custom_workouts').select('*').eq('user_id', userId);
            if (dbWorkouts) {
                state.customWorkouts = dbWorkouts;
            }
        }
        console.log('loadState: finished successfully');
    } catch (error) {
        console.error('Critical error in loadState:', error);
    } finally {
        updateCreditsUI(); // Force UI update
        renderHistory();
        renderWorkouts();
        renderAchievements();
    }
}

// --- Auth Logic ---
let isLoginMode = true;

async function initAuth() {
    console.log('initAuth: starting...');
    const { data: { session } } = await supabase.auth.getSession();
    state.session = session;
    console.log('initAuth: session retrieved', session);
    updateAuthUI();

    if (state.session) {
        console.log('initAuth: user logged in, loading state...');
        await loadState();
        console.log('initAuth: state loaded. Weight:', state.user.weight);
        if (state.user.weight) {
            console.log('initAuth: navigating to dashboard');
            navigateTo('dashboard');
        } else {
            console.log('initAuth: navigating to setupProfile');
            navigateTo('setupProfile');
        }
    } else {
        console.log('initAuth: no session');
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
        console.log('Auth state changed:', _event);
        state.session = session;
        updateAuthUI();
        if (session) {
            await loadState();
            if (state.user.weight) {
                navigateTo('dashboard');
            } else {
                navigateTo('setupProfile');
            }
        }
    });
}

function updateAuthUI() {
    const userAvatarWrapper = document.getElementById('userAvatarWrapper');
    const btnLoginView = document.getElementById('btn-login-view');

    if (state.session) {
        if (userAvatarWrapper) userAvatarWrapper.style.display = 'block';
        if (btnLoginView) btnLoginView.style.display = 'none';
    } else {
        if (userAvatarWrapper) userAvatarWrapper.style.display = 'none';
        if (btnLoginView) btnLoginView.style.display = 'block';
    }
}

async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btnSubmit = document.getElementById('btn-submit-login');

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Carregando...';

    try {
        if (isLoginMode) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            // Redirect handled by onAuthStateChange
        } else {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;

            const msgEl = document.getElementById('auth-message');
            msgEl.textContent = 'E-mail de confirmação enviado! Verifique sua caixa de entrada.';
            msgEl.style.display = 'block';
            msgEl.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
            msgEl.style.color = '#ef4444';
            msgEl.style.border = '1px solid #ef4444';
        }
    } catch (error) {
        alert(error.message);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = isLoginMode ? 'Entrar' : 'Cadastrar';
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    navigateTo('welcome');
}

// Start App
init();
initAuth();

// Event Listeners
document.getElementById('btn-connect-bluetooth').addEventListener('click', () => {
    sensors.connect();
});

// Auth Listeners
function updateAuthModeUI() {
    const title = document.getElementById('auth-title');
    const btnSwitch = document.getElementById('btn-switch-auth-mode');
    const btnSubmit = document.getElementById('btn-submit-login');
    const msgEl = document.getElementById('auth-message');

    msgEl.style.display = 'none';

    if (isLoginMode) {
        title.textContent = 'Bem-vindo de Volta';
        btnSwitch.textContent = 'Precisa de uma conta? Cadastre-se';
        btnSubmit.textContent = 'Entrar';
    } else {
        title.textContent = 'Criar Conta';
        btnSwitch.textContent = 'Já tem uma conta? Entre';
        btnSubmit.textContent = 'Cadastrar';
    }
}

document.getElementById('btn-welcome-login')?.addEventListener('click', () => {
    isLoginMode = true;
    updateAuthModeUI();
    navigateTo('auth');
});

document.getElementById('btn-welcome-signup')?.addEventListener('click', () => {
    isLoginMode = false;
    updateAuthModeUI();
    navigateTo('auth');
});

document.getElementById('btn-back-auth')?.addEventListener('click', () => navigateTo('welcome'));
document.getElementById('btn-logout')?.addEventListener('click', handleLogout);
document.getElementById('form-auth')?.addEventListener('submit', handleAuth);

document.getElementById('btn-switch-auth-mode')?.addEventListener('click', (e) => {
    isLoginMode = !isLoginMode;
    updateAuthModeUI();
});

// Profile and Bike Setup Listeners
forms.profile?.addEventListener('submit', (e) => {
    e.preventDefault();
    state.user.name = document.getElementById('rider-name').value;
    state.user.weight = parseFloat(document.getElementById('rider-weight').value);
    state.user.height = parseFloat(document.getElementById('rider-height').value);
    saveState();
    updateAuthUI();
    navigateTo('setupBike');
});

forms.bike?.addEventListener('submit', (e) => {
    e.preventDefault();
    state.bike.type = document.getElementById('bike-type').value;
    state.bike.crankLength = parseFloat(document.getElementById('crank-length').value);
    saveState();
    navigateTo('dashboard');
});

// Dashboard Controls
document.getElementById('btn-start-ride')?.addEventListener('click', () => {
    if (state.user.credits <= 0) {
        alert('Você não tem créditos suficientes. Assine um plano para continuar treinando!');
        navigateTo('plans');
        return;
    }
    startRide(false);
});

document.getElementById('btn-stop-ride')?.addEventListener('click', () => {
    stopRide();
    checkPostRideAchievements();
});

document.getElementById('slope-slider')?.addEventListener('input', (e) => {
    state.ride.slope = parseFloat(e.target.value);
    displays.slope.textContent = e.target.value;
});

// Speed Control (for simulation)
document.getElementById('val-speed')?.addEventListener('click', () => {
    const newSpeed = prompt('Digite a velocidade simulada (km/h):', displays.speed.textContent);
    if (newSpeed && !isNaN(newSpeed)) {
        displays.speed.textContent = parseFloat(newSpeed);
    }
});

// Navigation Buttons
document.getElementById('btn-select-workout')?.addEventListener('click', () => {
    renderWorkouts();
    navigateTo('workouts');
});

document.getElementById('btn-view-history')?.addEventListener('click', () => {
    renderHistory();
    navigateTo('history');
});

document.getElementById('btn-view-achievements')?.addEventListener('click', () => {
    if (state.user.plan !== 'pro') {
        alert('Conquistas são exclusivas do Plano PRO!');
        navigateTo('plans');
        return;
    }
    renderAchievements();
    navigateTo('achievements');
});

document.getElementById('btn-back-history')?.addEventListener('click', () => {
    navigateTo('dashboard');
});

document.getElementById('btn-back-workouts')?.addEventListener('click', () => {
    navigateTo('dashboard');
});

document.getElementById('btn-back-achievements')?.addEventListener('click', () => {
    navigateTo('dashboard');
});

document.getElementById('btn-close-details')?.addEventListener('click', () => {
    navigateTo('history');
});

document.getElementById('btn-export-csv')?.addEventListener('click', exportCSV);
document.getElementById('btn-export-gpx')?.addEventListener('click', exportGPX);

// Workout Creation
document.getElementById('btn-create-workout')?.addEventListener('click', () => {
    if (state.user.plan !== 'pro') {
        alert('Criador de Treinos é exclusivo do Plano PRO!');
        navigateTo('plans');
        return;
    }
    navigateTo('createWorkout');
});

document.getElementById('btn-cancel-create')?.addEventListener('click', () => {
    navigateTo('workouts');
});

forms.createWorkout?.addEventListener('submit', saveCustomWorkout);

// Profile Functions
function openProfile() {
    // Populate form with current values
    document.getElementById('edit-name').value = state.user.name || '';
    document.getElementById('edit-weight').value = state.user.weight || '';
    document.getElementById('edit-height').value = state.user.height || '';
    document.getElementById('edit-bike-type').value = state.bike.type || 'road';
    document.getElementById('edit-crank-length').value = state.bike.crankLength || 172.5;

    // Load avatar if exists
    if (state.user.avatar) {
        const avatarPreview = document.getElementById('avatarPreviewImage');
        if (avatarPreview) avatarPreview.src = state.user.avatar;
    }

    navigateTo('profile');
}

async function uploadAvatar(file) {
    if (!state.session || !state.session.user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${state.session.user.id} -${Date.now()}.${fileExt} `;
    const filePath = `${fileName} `;

    try {
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading avatar:', error);
        alert('Erro ao fazer upload da imagem: ' + error.message);
        return null;
    }
}

async function saveProfileChanges(e) {
    e.preventDefault();

    const btnSave = e.target.querySelector('button[type="submit"]');
    const originalText = btnSave.textContent;
    btnSave.disabled = true;
    btnSave.textContent = 'Salvando...';

    try {
        // Upload avatar if selected
        if (selectedAvatarFile) {
            const publicUrl = await uploadAvatar(selectedAvatarFile);
            if (publicUrl) {
                state.user.avatar = publicUrl;
            }
        }

        // Update state
        const nameInput = document.getElementById('edit-name');
        if (nameInput && nameInput.value) {
            state.user.name = nameInput.value;
        }
        state.user.weight = parseFloat(document.getElementById('edit-weight').value);
        state.user.height = parseFloat(document.getElementById('edit-height').value);
        state.bike.type = document.getElementById('edit-bike-type').value;
        state.bike.crankLength = parseFloat(document.getElementById('edit-crank-length').value);

        // Save to storage and Supabase
        await saveState();

        // Update display
        updateAuthUI();

        // Update avatar in navbar if changed
        if (state.user.avatar) {
            const navAvatar = document.getElementById('avatarImage');
            if (navAvatar) navAvatar.src = state.user.avatar;
        }

        // Show success message
        alert('Perfil atualizado com sucesso!');

        // Return to dashboard
        navigateTo('dashboard');
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Erro ao salvar perfil.');
    } finally {
        btnSave.disabled = false;
        btnSave.textContent = originalText;
        selectedAvatarFile = null; // Reset
    }
}

// Profile Event Listeners
document.getElementById('btn-profile')?.addEventListener('click', openProfile);
document.getElementById('btn-back-profile')?.addEventListener('click', () => {
    navigateTo('dashboard');
});
forms.editProfile?.addEventListener('submit', saveProfileChanges);

// Avatar Dropdown Listeners
const userAvatar = document.getElementById('userAvatar');
const userDropdown = document.getElementById('userDropdown');

// Toggle dropdown ao clicar no avatar
userAvatar?.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown?.classList.toggle('show');
});

// Fechar dropdown ao clicar fora
document.addEventListener('click', (e) => {
    if (userDropdown && !userAvatar?.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('show');
    }
});

// Botão Editar Perfil no dropdown
document.getElementById('btn-dropdown-profile')?.addEventListener('click', () => {
    userDropdown?.classList.remove('show');
    openProfile();
});

// Botão Sair no dropdown
document.getElementById('btn-dropdown-logout')?.addEventListener('click', () => {
    userDropdown?.classList.remove('show');
    handleLogout();
});

// Avatar Upload
let selectedAvatarFile = null;

document.getElementById('avatar-upload')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        selectedAvatarFile = file;
        const reader = new FileReader();
        reader.onload = (event) => {
            const avatarUrl = event.target.result;
            // Update preview in profile edit
            document.getElementById('avatarPreviewImage').src = avatarUrl;
        };
        reader.readAsDataURL(file);
    }
});


// Theme Toggle
document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const btn = document.getElementById('btn-theme-toggle');
    btn.textContent = document.body.classList.contains('light-mode') ? '☀️' : '🌙';
});

// Unregister Service Worker to clear cache issues
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
            registration.unregister();
            console.log('Service Worker unregistered');
        }
    });
}

// --- GPS Functions ---
function enableGPS() {
    if (!navigator.geolocation) {
        alert('Geolocalização não suportada neste navegador.');
        document.getElementById('toggle-outdoor-mode').checked = false;
        return;
    }

    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, altitude, speed } = position.coords;
            const timestamp = position.timestamp;

            // Speed from GPS (m/s to km/h)
            if (speed !== null) {
                gpsSpeed = speed * 3.6;
            }

            // Calculate Slope
            if (lastPosition && altitude !== null && lastPosition.altitude !== null) {
                const dist = calculateDistance(
                    lastPosition.latitude, lastPosition.longitude,
                    latitude, longitude
                );
                const altDiff = altitude - lastPosition.altitude;

                if (dist > 10) { // Only update slope if moved > 10m to avoid noise
                    gpsSlope = (altDiff / dist) * 100;
                    // Clamp slope reasonable values (-20% to 30%)
                    gpsSlope = Math.max(-20, Math.min(30, gpsSlope));
                    const slopeDisplay = document.getElementById('val-slope');
                    if (slopeDisplay) slopeDisplay.textContent = gpsSlope.toFixed(1);
                }
            }

            lastPosition = { latitude, longitude, altitude, timestamp };
        },
        (error) => {
            console.error('GPS Error:', error);
            // alert('Erro no GPS: ' + error.message); // Optional: alert user
        },
        { enableHighAccuracy: true, maximumAge: 1000 }
    );
}

function disableGPS() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    lastPosition = null;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// --- Plans & Credits Logic ---

function updateCreditsUI() {
    const creditsEl = document.getElementById('user-credits');
    const navCreditsCount = document.getElementById('nav-credits-count');
    const navCreditsContainer = document.getElementById('nav-credits-container');

    const credits = state.user.credits !== undefined ? state.user.credits : 0;

    if (creditsEl) creditsEl.textContent = credits;

    if (navCreditsCount) navCreditsCount.textContent = credits;

    if (navCreditsContainer) {
        navCreditsContainer.style.display = state.session ? 'flex' : 'none';
    }
}

async function consumeCredit() {
    if (state.user.credits > 0) {
        state.user.credits--;
        updateCreditsUI();

        // Update Supabase
        if (state.session) {
            const { error } = await supabase
                .from('profiles')
                .update({ credits: state.user.credits })
                .eq('id', state.session.user.id);

            if (error) console.error('Error updating credits:', error);
        }
    }
}

async function handleSubscription(planType) {
    if (!state.session) {
        alert('Faça login para assinar um plano.');
        return;
    }

    let creditsToAdd = 0;
    if (planType === 'amateur') creditsToAdd = 30;
    if (planType === 'pro') creditsToAdd = 60;

    // Simulate Payment Success
    const confirmMsg = `Confirmar assinatura do Plano ${planType.toUpperCase()}?`;
    if (!confirm(confirmMsg)) return;

    // Update State
    state.user.plan = planType;
    state.user.credits = creditsToAdd;
    updateCreditsUI();

    alert(`Assinatura realizada com sucesso! Seu saldo agora é de ${creditsToAdd} créditos.`);

    // Update Supabase
    const { error } = await supabase
        .from('profiles')
        .update({
            subscription_plan: planType,
            credits: state.user.credits,
            subscription_status: 'active'
        })
        .eq('id', state.session.user.id);

    if (error) {
        console.error('Error updating subscription:', error);
        alert('Erro ao salvar assinatura. Entre em contato com o suporte.');
    } else {
        navigateTo('dashboard');
    }
}

// Plans Listeners
document.getElementById('btn-back-plans')?.addEventListener('click', () => {
    navigateTo('dashboard');
});

document.getElementById('nav-credits-container')?.addEventListener('click', () => {
    navigateTo('plans');
});

document.querySelectorAll('.btn-subscribe').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const plan = e.target.dataset.plan;
        handleSubscription(plan);
    });
});
