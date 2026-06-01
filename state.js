/**
 * MathAR Kids - State Management Module
 * "Nguồn sự thật" duy nhất cho toàn bộ dữ liệu ứng dụng
 */

// ========== DEFAULT STATE SCHEMA ==========
const DEFAULT_STATE = {
    // User
    user: null, // { name, age, avatar, createdAt, lastLogin }

    // Progress
    progress: {
        1: { sessions: [], bestScore: 0, totalStars: 0, completedLevels: 0, totalCorrect: 0 },
        2: { sessions: [], bestScore: 0, totalStars: 0, completedLevels: 0 },
        3: { sessions: [], bestScore: 0, totalStars: 0, completedLevels: 0, equationsDiscovered: [] },
    },

    // Gamification
    totalStars: 0,
    level: 1,
    xp: 0,
    streak: 0,
    lastLoginDate: null,
    badges: [],             // array of badge ids
    unlockedAvatars: [],
    unlockedThemes: [],
    activeTheme: 'default',

    // Settings
    settings: {
        soundEnabled: true,
        arEnabled: true,
        difficulty: 'auto',   // 'easy' | 'medium' | 'hard' | 'auto'
        language: 'vi',
        parentalPin: null,
    },

    // Session
    currentExercise: null,
    hintsUsedToday: 0,
    dailyGoalsCompleted: [],
    dailyGoalsBonusClaimed: false,

    // Metadata
    version: '1.0.0',
    lastUpdated: null,
};

// Badge definitions
const BADGES = [
    { id: 'first_step',   emoji: '👶', name: 'Bước đầu tiên',   desc: 'Hoàn thành bài đầu tiên',     condition: (p) => p.totalSessions >= 1 },
    { id: 'counter',      emoji: '🔢', name: 'Thợ đếm số',      desc: 'Đúng 10 câu bài 1',           condition: (p) => p.ex1.totalCorrect >= 10 },
    { id: 'comparator',   emoji: '⚖️', name: 'Nhà phán xét',    desc: 'Hoàn thành bài 2 lần đầu',    condition: (p) => p.ex2.sessions >= 1 },
    { id: 'mathematician',emoji: '🧮', name: 'Toán học gia',    desc: 'Hoàn thành cả 3 bài tập',     condition: (p) => p.ex1.sessions >= 1 && p.ex2.sessions >= 1 && p.ex3.sessions >= 1 },
    { id: 'streak_3',     emoji: '🔥', name: '3 ngày liên tiếp',desc: 'Học 3 ngày liên tiếp',        condition: (p) => p.streak >= 3 },
    { id: 'streak_7',     emoji: '💫', name: 'Tuần học chăm',   desc: 'Học 7 ngày liên tiếp',        condition: (p) => p.streak >= 7 },
    { id: 'perfectionist',emoji: '🌟', name: 'Hoàn hảo!',      desc: 'Đạt 3 sao 1 bài',             condition: (p) => p.anyPerfect },
    { id: 'ar_explorer',  emoji: '🥽', name: 'Nhà thám hiểm AR',desc: 'Dùng AR lần đầu tiên',        condition: (p) => p.usedAR },
    { id: 'star_50',      emoji: '⭐', name: 'Bộ sưu tập sao', desc: 'Thu thập 50 sao',             condition: (p) => p.totalStars >= 50 },
    { id: 'star_100',     emoji: '🌙', name: 'Người hái sao',  desc: 'Thu thập 100 sao',            condition: (p) => p.totalStars >= 100 },
];

// Level definitions
const LEVELS = [
    { level: 1, name: 'Mầm non ⭐',       starsNeeded: 0,  icon: '🌱' },
    { level: 2, name: 'Học sinh giỏi 🌟', starsNeeded: 20, icon: '📚' },
    { level: 3, name: 'Toán thủ 🏅',      starsNeeded: 50, icon: '🧮' },
    { level: 4, name: 'Thiên tài 🧠',     starsNeeded: 100, icon: '🎓' },
    { level: 5, name: 'Huyền thoại 🏆',   starsNeeded: 200, icon: '👑' },
];

// Shop items
const SHOP_ITEMS = [
    { id: 'avatar_lion',   type: 'avatar', emoji: '🦁', name: 'Sư tử',      price: 30 },
    { id: 'avatar_cat',    type: 'avatar', emoji: '🐱', name: 'Mèo con',     price: 20 },
    { id: 'avatar_dog',    type: 'avatar', emoji: '🐶', name: 'Chó con',     price: 20 },
    { id: 'avatar_dragon', type: 'avatar', emoji: '🐉', name: 'Rồng vàng',   price: 50 },
    { id: 'avatar_unicorn',type: 'avatar', emoji: '🦄', name: 'Kỳ lân',      price: 40 },
    { id: 'theme_rainbow', type: 'theme',  emoji: '🌈', name: 'Theme cầu vồng', price: 20 },
];

// ========== STATE MANAGER CLASS ==========
class StateManager {
    constructor() {
        this._state = this._load();
        this._listeners = {};
        this._saveTimer = null;
    }

    // ========== ĐỌC STATE ==========
    get(path) {
        if (!path) return this._state;

        const keys = path.split('.');
        let value = this._state;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }

        return value;
    }

    // ========== CẬP NHẬT STATE ==========
    set(path, value) {
        const keys = path.split('.');
        const oldValue = this.get(path);

        // Create nested structure if needed
        let target = this._state;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in target) || typeof target[keys[i]] !== 'object') {
                target[keys[i]] = {};
            }
            target = target[keys[i]];
        }

        // Set value
        target[keys[keys.length - 1]] = value;
        this._state.lastUpdated = Date.now();

        // Trigger listeners
        this._trigger(path, value, oldValue);

        // Auto save
        this._scheduleSave();

        return value;
    }

    // ========== UPDATE NESTED OBJECT (MERGE) ==========
    update(path, updates) {
        const current = this.get(path) || {};
        const merged = { ...current, ...updates };
        return this.set(path, merged);
    }

    // ========== LẮNG NGHE THAY ĐỔI ==========
    on(path, callback) {
        if (!this._listeners[path]) {
            this._listeners[path] = [];
        }
        this._listeners[path].push(callback);

        // Return unsubscribe function
        return () => this.off(path, callback);
    }

    off(path, callback) {
        if (!this._listeners[path]) return;
        this._listeners[path] = this._listeners[path].filter(cb => cb !== callback);
    }

    _trigger(path, newValue, oldValue) {
        // Trigger exact path listeners
        if (this._listeners[path]) {
            this._listeners[path].forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (e) {
                    console.error('State listener error:', e);
                }
            });
        }

        // Trigger parent path listeners (wildcard)
        const parts = path.split('.');
        for (let i = parts.length - 1; i > 0; i--) {
            const parentPath = parts.slice(0, i).join('.');
            if (this._listeners[parentPath + '.*']) {
                this._listeners[parentPath + '.*'].forEach(callback => {
                    try {
                        callback(newValue, oldValue, path);
                    } catch (e) {
                        console.error('State listener error:', e);
                    }
                });
            }
        }
    }

    // ========== PERSISTENCE ==========
    _load() {
        try {
            const saved = localStorage.getItem('mathAR_state');
            if (!saved) return { ...DEFAULT_STATE };

            const parsed = JSON.parse(saved);
            const migrated = this._migrate(parsed);
            return this._validate(migrated);
        } catch (e) {
            console.error('Error loading state:', e);
            return { ...DEFAULT_STATE };
        }
    }

    _scheduleSave() {
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
        }

        this._saveTimer = setTimeout(() => {
            this._save();
        }, 200);
    }

    _save() {
        try {
            localStorage.setItem('mathAR_state', JSON.stringify(this._state));
        } catch (e) {
            console.error('Error saving state:', e);
        }
    }

    // ========== MIGRATION ==========
    _migrate(savedState) {
        // Handle different version migrations
        const version = savedState.version || '0.0.0';

        // Migration from 0.x to 1.0
        if (version !== DEFAULT_STATE.version) {
            // Ensure all new keys exist
            const migrated = { ...DEFAULT_STATE };

            // Copy over existing data
            if (savedState.user) migrated.user = savedState.user;
            if (savedState.progress) {
                migrated.progress = {
                    1: { ...DEFAULT_STATE.progress[1], ...savedState.progress[1] },
                    2: { ...DEFAULT_STATE.progress[2], ...savedState.progress[2] },
                    3: { ...DEFAULT_STATE.progress[3], ...savedState.progress[3] },
                };
            }
            if (savedState.totalStars) migrated.totalStars = savedState.totalStars;
            if (savedState.level) migrated.level = savedState.level;
            if (savedState.xp) migrated.xp = savedState.xp;
            if (savedState.streak) migrated.streak = savedState.streak;
            if (savedState.badges) migrated.badges = savedState.badges;
            if (savedState.settings) migrated.settings = { ...DEFAULT_STATE.settings, ...savedState.settings };

            migrated.version = DEFAULT_STATE.version;
            return migrated;
        }

        return savedState;
    }

    // ========== VALIDATION ==========
    _validate(state) {
        const validated = { ...DEFAULT_STATE };

        // Validate user
        if (state.user && typeof state.user === 'object') {
            validated.user = {
                name: state.user.name || 'Bé',
                age: state.user.age || 5,
                avatar: state.user.avatar || '🦁',
                createdAt: state.user.createdAt || Date.now(),
                lastLogin: state.user.lastLogin || Date.now()
            };
        }

        // Validate progress
        for (let i = 1; i <= 3; i++) {
            if (state.progress && state.progress[i]) {
                validated.progress[i] = {
                    sessions: Array.isArray(state.progress[i].sessions) ? state.progress[i].sessions : [],
                    bestScore: Math.max(0, Math.min(10, state.progress[i].bestScore || 0)),
                    totalStars: Math.max(0, state.progress[i].totalStars || 0),
                    completedLevels: Math.max(0, Math.min(10, state.progress[i].completedLevels || 0)),
                };
                if (i === 1) {
                    validated.progress[1].totalCorrect = Math.max(0, state.progress[1].totalCorrect || 0);
                }
                if (i === 3) {
                    validated.progress[3].equationsDiscovered = Array.isArray(state.progress[3].equationsDiscovered)
                        ? state.progress[3].equationsDiscovered
                        : [];
                }
            }
        }

        // Validate gamification
        validated.totalStars = Math.max(0, state.totalStars || 0);
        validated.level = Math.max(1, Math.min(5, state.level || 1));
        validated.xp = Math.max(0, state.xp || 0);
        validated.streak = Math.max(0, state.streak || 0);
        validated.lastLoginDate = state.lastLoginDate || null;
        validated.badges = Array.isArray(state.badges) ? state.badges : [];
        validated.unlockedAvatars = Array.isArray(state.unlockedAvatars) ? state.unlockedAvatars : [];
        validated.unlockedThemes = Array.isArray(state.unlockedThemes) ? state.unlockedThemes : [];
        validated.activeTheme = state.activeTheme || 'default';

        // Validate settings
        if (state.settings) {
            validated.settings = {
                soundEnabled: typeof state.settings.soundEnabled === 'boolean' ? state.settings.soundEnabled : true,
                arEnabled: typeof state.settings.arEnabled === 'boolean' ? state.settings.arEnabled : true,
                difficulty: ['easy', 'medium', 'hard', 'auto'].includes(state.settings.difficulty)
                    ? state.settings.difficulty : 'auto',
                language: state.settings.language || 'vi',
                parentalPin: state.settings.parentalPin || null,
            };
        }

        return validated;
    }

    // ========== RESET ==========
    reset() {
        this._state = { ...DEFAULT_STATE };
        this._save();
        Events.emit('state-reset');
    }

    resetProgress() {
        const user = this._state.user;
        const badges = this._state.badges;
        const unlockedAvatars = this._state.unlockedAvatars;
        const unlockedThemes = this._state.unlockedThemes;

        this._state = { ...DEFAULT_STATE };
        this._state.user = user;
        this._state.badges = badges;
        this._state.unlockedAvatars = unlockedAvatars;
        this._state.unlockedThemes = unlockedThemes;

        this._save();
        Events.emit('progress-reset');
    }

    // ========== EXPORT / IMPORT ==========
    exportData() {
        const data = {
            state: this._state,
            exportedAt: Date.now(),
            version: DEFAULT_STATE.version
        };
        return JSON.stringify(data);
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.state) throw new Error('Invalid data format');

            const validated = this._validate(data.state);
            this._state = validated;
            this._save();
            Events.emit('data-imported');
            return true;
        } catch (e) {
            console.error('Import error:', e);
            return false;
        }
    }
}

// ========== GLOBAL STATE INSTANCE ==========
const State = new StateManager();

// ========== EVENT SYSTEM ==========
const Events = {
    emit(event, data) {
        window.dispatchEvent(new CustomEvent(`mathAR:${event}`, { detail: data }));
    },

    on(event, handler) {
        window.addEventListener(`mathAR:${event}`, (e) => handler(e.detail));
    },

    off(event, handler) {
        window.removeEventListener(`mathAR:${event}`, handler);
    },
};

// Event types: 'stars-added', 'badge-earned', 'level-up', 'exercise-complete', 'streak-updated', 'state-reset', 'progress-reset'

// ========== HELPER FUNCTIONS ==========

// Progress calculations
function getExerciseProgress(exerciseId) {
    const p = State.get(`progress.${exerciseId}`) || {
        sessions: [],
        bestScore: 0,
        totalStars: 0,
        completedLevels: 0
    };

    const total = 10; // levels per exercise
    const allStars = p.sessions.map(s => s.stars || 0);
    const bestStars = allStars.length > 0 ? Math.max(...allStars) : 0;

    return {
        percent: Math.round((p.completedLevels / total) * 100),
        completed: p.completedLevels,
        total,
        bestScore: p.bestScore,
        bestStars,
        totalStars: p.totalStars,
        sessions: p.sessions.length,
        lastPlayed: p.sessions[p.sessions.length - 1]?.date || null,
    };
}

function getAllProgress() {
    return {
        1: getExerciseProgress(1),
        2: getExerciseProgress(2),
        3: getExerciseProgress(3),
    };
}

// Star + XP system
function addStars(amount, source = 'unknown') {
    const current = State.get('totalStars') || 0;
    State.set('totalStars', current + amount);
    addXP(amount * 10);
    Events.emit('stars-added', { amount, source, newTotal: current + amount });

    // Trigger badge check
    checkAndAwardBadges();
}

function addXP(amount) {
    const current = State.get('xp') || 0;
    const newXP = current + amount;
    State.set('xp', newXP);

    // Check level up
    const newLevel = calculateLevel(newXP);
    const currentLevel = State.get('level') || 1;

    if (newLevel > currentLevel) {
        State.set('level', newLevel);
        Events.emit('level-up', { from: currentLevel, to: newLevel });
    }
}

function calculateLevel(xp) {
    // 100 XP per level
    return Math.floor(xp / 100) + 1;
}

function calculateLevelProgress() {
    const xp = State.get('xp') || 0;
    const currentLevel = State.get('level') || 1;
    const xpInCurrentLevel = xp % 100;
    return xpInCurrentLevel; // 0-99
}

// Streak system
function updateStreak() {
    const today = new Date().toDateString();
    const lastLogin = State.get('lastLoginDate');

    if (lastLogin === today) return; // already updated today

    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (lastLogin === yesterday) {
        const currentStreak = State.get('streak') || 0;
        State.set('streak', currentStreak + 1);
    } else if (lastLogin !== today) {
        State.set('streak', 1); // reset streak if missed a day
    }

    State.set('lastLoginDate', today);
    Events.emit('streak-updated', { streak: State.get('streak') });

    // Check badge
    checkAndAwardBadges();
}

// Daily goals
function checkDailyGoals() {
    const today = new Date().toDateString();
    const todaySessions = getAllTodaySessions();
    const hintsUsed = State.get('hintsUsedToday') || 0;

    const goals = {
        completedOneExercise: todaySessions.length >= 1,
        achievedTwoStars: todaySessions.some(s => (s.stars || 0) >= 2),
        noHintsUsed: hintsUsed === 0,
    };

    const allComplete = Object.values(goals).every(Boolean);
    const bonusClaimed = State.get('dailyGoalsBonusClaimed') || false;

    if (allComplete && !bonusClaimed) {
        addStars(10, 'daily_goals');
        State.set('dailyGoalsBonusClaimed', true);
        Events.emit('daily-goals-completed');
    } else if (!allComplete && bonusClaimed) {
        // Reset if goals no longer complete (shouldn't happen normally)
        State.set('dailyGoalsBonusClaimed', false);
    }

    return goals;
}

function getAllTodaySessions() {
    const today = new Date().toDateString();
    const allSessions = [];

    for (let i = 1; i <= 3; i++) {
        const progress = State.get(`progress.${i}`) || {};
        if (progress.sessions) {
            progress.sessions.forEach(session => {
                if (new Date(session.date).toDateString() === today) {
                    allSessions.push({ ...session, exerciseId: i });
                }
            });
        }
    }

    return allSessions;
}

// Badge system
function checkAndAwardBadges() {
    const stats = calculateAllStats();
    const ownedBadges = new Set(State.get('badges') || []);
    let newBadgeEarned = false;

    BADGES.forEach(badge => {
        if (!ownedBadges.has(badge.id)) {
            try {
                if (badge.condition(stats)) {
                    ownedBadges.add(badge.id);
                    newBadgeEarned = true;
                    Events.emit('badge-earned', { badgeId: badge.id, badge });
                }
            } catch (e) {
                console.error('Error checking badge condition:', badge.id, e);
            }
        }
    });

    if (newBadgeEarned) {
        State.set('badges', Array.from(ownedBadges));
    }
}

function calculateAllStats() {
    let totalSessions = 0;
    let ex1TotalCorrect = 0;
    let ex1Sessions = 0;
    let ex2Sessions = 0;
    let ex3Sessions = 0;
    let streak = State.get('streak') || 0;
    let totalStars = State.get('totalStars') || 0;
    let anyPerfect = false;
    let usedAR = State.get('settings.arEnabled') || false;

    for (let i = 1; i <= 3; i++) {
        const p = State.get(`progress.${i}`) || {};
        const sessions = p.sessions || [];

        sessions.forEach(session => {
            totalSessions++;
            if (i === 1) {
                ex1TotalCorrect += session.score || 0;
                ex1Sessions++;
            }
            if (i === 2) ex2Sessions++;
            if (i === 3) ex3Sessions++;

            if (session.stars === 3) anyPerfect = true;
        });
    }

    return {
        totalSessions,
        ex1: { totalCorrect: ex1TotalCorrect, sessions: ex1Sessions },
        ex2: { sessions: ex2Sessions },
        ex3: { sessions: ex3Sessions },
        streak,
        totalStars,
        anyPerfect,
        usedAR
    };
}

// Exercise session tracking
function recordExerciseSession(exerciseId, score, stars, usedHints, additionalData = {}) {
    const progress = State.get(`progress.${exerciseId}`) || {
        sessions: [],
        bestScore: 0,
        totalStars: 0,
        completedLevels: 0
    };

    const session = {
        date: Date.now(),
        score,
        stars,
        usedHints,
        ...additionalData
    };

    progress.sessions.push(session);
    progress.totalStars += stars;
    progress.bestScore = Math.max(progress.bestScore, score);

    if (score >= 7) {
        progress.completedLevels = Math.min(10, (progress.completedLevels || 0) + 1);
    }

    // Exercise 3 specific: equations discovered
    if (exerciseId === 3 && additionalData.equation) {
        const equations = progress.equationsDiscovered || [];
        if (!equations.includes(additionalData.equation)) {
            equations.push(additionalData.equation);
            progress.equationsDiscovered = equations;
        }
    }

    State.set(`progress.${exerciseId}`, progress);
    addStars(stars, `exercise-${exerciseId}`);
    Events.emit('exercise-complete', { exerciseId, score, stars });
}

// Shop functions
function buyShopItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return { success: false, error: 'Item not found' };

    const totalStars = State.get('totalStars') || 0;
    if (totalStars < item.price) {
        return { success: false, error: 'Not enough stars' };
    }

    const unlocked = State.get(item.type === 'avatar' ? 'unlockedAvatars' : 'unlockedThemes') || [];
    if (unlocked.includes(itemId)) {
        return { success: false, error: 'Already owned' };
    }

    // Deduct stars
    State.set('totalStars', totalStars - item.price);
    unlocked.push(itemId);
    State.set(item.type === 'avatar' ? 'unlockedAvatars' : 'unlockedThemes', unlocked);

    Events.emit('shop-item-purchased', { itemId, item });
    return { success: true };
}

// Parental controls
function setParentalPin(pin) {
    if (!/^\d{4}$/.test(pin)) {
        return { success: false, error: 'PIN must be 4 digits' };
    }
    State.update('settings', { parentalPin: pin });
    return { success: true };
}

function checkParentalPin(inputPin) {
    const storedPin = State.get('settings.parentalPin');
    if (!storedPin) return true; // No PIN set
    return storedPin === inputPin;
}

function getParentalReport() {
    const allSessions = [];
    for (let i = 1; i <= 3; i++) {
        const p = State.get(`progress.${i}`) || {};
        if (p.sessions) {
            p.sessions.forEach(s => {
                allSessions.push({ ...s, exerciseId: i });
            });
        }
    }

    // Calculate statistics
    const totalSessions = allSessions.length;
    const totalCorrect = allSessions.reduce((sum, s) => sum + (s.score || 0), 0);
    const totalPossible = totalSessions * 10;
    const accuracy = totalPossible > 0 ? Math.round((totalCorrect / totalPossible) * 100) : 0;

    // Get unique learning days
    const uniqueDays = new Set();
    allSessions.forEach(s => {
        uniqueDays.add(new Date(s.date).toDateString());
    });

    // Get weekly activity
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklySessions = allSessions.filter(s => s.date >= weekAgo).length;

    return {
        childName: State.get('user.name') || 'Bé',
        age: State.get('user.age') || 5,
        totalSessions,
        totalStars: State.get('totalStars') || 0,
        level: State.get('level') || 1,
        streak: State.get('streak') || 0,
        accuracy,
        learningDays: uniqueDays.size,
        weeklySessions,
        badges: State.get('badges') || [],
        reportGenerated: new Date().toISOString(),
    };
}

function formatParentalReport(report) {
    return `
BÁO CÁO HỌC TẬP - MATHAR KIDS
================================

Học sinh: ${report.childName} (${report.age} tuổi)
Ngày tạo: ${new Date(report.reportGenerated).toLocaleString('vi-VN')}

TIẾN ĐỘ HỌC TẬP
----------------
• Tổng số bài làm: ${report.totalSessions}
• Số sao thu thập: ${report.totalStars} ⭐
• Level hiện tại: ${report.level}
• Chuỗi ngày học: ${report.streak} ngày
• Độ chính xác trung bình: ${report.accuracy}%
• Số ngày đã học: ${report.learningDays} ngày
• Bài làm trong tuần: ${report.weeklySessions} bài

HUY CHIỆ ĐÃ ĐẠT
----------------
${report.badges.map(badgeId => {
    const badge = BADGES.find(b => b.id === badgeId);
    return badge ? `• ${badge.emoji} ${badge.name}` : '';
}).join('\n')}

Generated by MathAR Kids
`.trim();
}

// Reset hints counter at midnight
function resetDailyHints() {
    const lastReset = State.get('lastHintsReset');
    const today = new Date().toDateString();

    if (lastReset !== today) {
        State.set('hintsUsedToday', 0);
        State.set('lastHintsReset', today);
        State.set('dailyGoalsBonusClaimed', false);
    }
}

// Initialize
resetDailyHints();

// ========== EXPORTS ==========
export {
    State,
    Events,
    BADGES,
    LEVELS,
    SHOP_ITEMS,

    // Helper functions
    getExerciseProgress,
    getAllProgress,
    addStars,
    addXP,
    updateStreak,
    checkDailyGoals,
    getAllTodaySessions,
    checkAndAwardBadges,
    recordExerciseSession,
    buyShopItem,
    setParentalPin,
    checkParentalPin,
    getParentalReport,
    formatParentalReport,
    resetDailyHints,
    calculateLevel,
    calculateLevelProgress,
};

export default State;
