/**
 * MathAR Kids - AR Engine Module
 * Xử lý toàn bộ logic AR, camera, và hiển thị đối tượng 3D
 */

// ========== 3D MODELS CDN ==========
const AR_MODELS = {
    // Con vật (dùng models có sẵn, sẽ update với animal models thật sau)
    cat:    'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    dog:    'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
    duck:   'https://modelviewer.dev/shared-assets/models/FlightHelmet.glb',
    rabbit: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
    bear:   'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    panda:  'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb',
    fox:    'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
    penguin: 'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb',
    unicorn: 'https://modelviewer.dev/shared-assets/models/MaterialsVariantsShoe.glb',
    // Trái cây / hoa quả
    apple:  'https://cdn.glitch.global/36cb8393-65c6-408d-a538-055ada20431b/apple.glb',
    banana: 'https://cdn.glitch.global/36cb8393-65c6-408d-a538-055ada20431b/banana.glb',
    orange: 'https://cdn.glitch.global/36cb8393-65c6-408d-a538-055ada20431b/apple.glb',
    grape:  'https://cdn.glitch.global/36cb8393-65c6-408d-a538-055ada20431b/banana.glb',
    // Hình khối đơn giản
    star:   'https://modelviewer.dev/shared-assets/models/reflective-sphere.glb',
    cube:   'https://modelviewer.dev/shared-assets/models/reflective-sphere.glb',
    sphere: 'https://modelviewer.dev/shared-assets/models/reflective-sphere.glb',
    // Numbers (placeholder models)
    number1: 'https://modelviewer.dev/shared-assets/models/reflective-sphere.glb',
    number2: 'https://modelviewer.dev/shared-assets/models/reflective-sphere.glb',
    number3: 'https://modelviewer.dev/shared-assets/models/reflective-sphere.glb',
    number4: 'https://modelviewer.dev/shared-assets/models/reflective-sphere.glb',
    number5: 'https://modelviewer.dev/shared-assets/models/reflective-sphere.glb',
    number6: 'https://modelviewer.dev/shared-assets/models/reflective-sphere.glb',
    number7: 'https://modelviewer.dev/shared-assets/models/reflective-sphere.glb',
    number8: 'https://modelviewer.dev/shared-assets/models/reflective-sphere.glb',
    number9: 'https://modelviewer.dev/shared-assets/models/reflective-sphere.glb',
    number0: 'https://modelviewer.dev/shared-assets/models/reflective-sphere.glb',
};

// Emoji fallback khi không load được 3D model
const EMOJI_FALLBACK = {
    cat: '🐱', dog: '🐶', duck: '🦆', rabbit: '🐰', bear: '🐻',
    panda: '🐼', fox: '🦊', penguin: '🐧', unicorn: '🦄',
    apple: '🍎', banana: '🍌', orange: '🍊', grape: '🍇',
    star: '⭐', cube: '🟦', sphere: '🔮',
    number1: '1️⃣', number2: '2️⃣', number3: '3️⃣', number4: '4️⃣',
    number5: '5️⃣', number6: '6️⃣', number7: '7️⃣', number8: '8️⃣',
    number9: '9️⃣', number0: '0️⃣',
};

// ========== AR SUPPORT DETECTION ==========
function checkARSupport() {
    // WebXR AR support
    if (navigator.xr && typeof navigator.xr.isSessionSupported === 'function') {
        return 'webxr';
    }

    // iOS Quick Look support
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
        return 'quick-look';
    }

    // Android Scene Viewer support
    const isAndroid = /Android/.test(navigator.userAgent);
    if (isAndroid) {
        return 'scene-viewer';
    }

    return 'none';
}

// ========== AUDIO SYSTEM (Web Audio API) ==========
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioContext = null;

function initAudioContext() {
    if (!audioContext) {
        audioContext = new AudioContext();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
}

// Beep âm thanh đúng - cao, vui vẻ
function playCorrectSound() {
    try {
        const ctx = initAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.1); // G5

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
        console.warn('Audio error:', e);
    }
}

// Beep âm thanh sai - thấp, nghiêm túc
function playWrongSound() {
    try {
        const ctx = initAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
        console.warn('Audio error:', e);
    }
}

// Fanfare ngắn khi đạt sao/huy hiệu
function playStarSound() {
    try {
        const ctx = initAudioContext();

        // Play ascending notes
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const now = ctx.currentTime;

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.value = freq;

            const startTime = now + i * 0.08;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

            osc.start(startTime);
            osc.stop(startTime + 0.25);
        });
    } catch (e) {
        console.warn('Audio error:', e);
    }
}

// Click sound nhẹ
function playClickSound() {
    try {
        const ctx = initAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.05);
    } catch (e) {
        console.warn('Audio error:', e);
    }
}

// ========== AR SCENE CLASS ==========
class ARScene {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            arMode: false,
            backgroundColor: '#E8F5E9',
            fallbackToEmoji: true,
            loadingTimeout: 5000,
            ...options
        };

        this.currentModel = null;
        this.viewerElement = null;
        this.usingFallback = false;
        this.arReadyCallback = null;
        this.loadingTimeout = null;
        this.overlayUI = null;

        if (!this.container) {
            console.error(`Container with id "${containerId}" not found`);
            return;
        }

        this.init();
    }

    init() {
        this.container.innerHTML = '';
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.background = this.options.backgroundColor;
        this.container.style.borderRadius = '20px';
        this.container.style.overflow = 'hidden';
    }

    // Tạo model-viewer element hoặc emoji fallback
    createViewer(modelKey, count = 1) {
        this.currentModel = modelKey;
        this.usingFallback = false;

        const modelUrl = AR_MODELS[modelKey];
        const fallbackEmoji = EMOJI_FALLBACK[modelKey] || '📦';

        // Tạo wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'ar-viewer-wrapper';
        wrapper.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        `;

        // Thêm loading state
        const loadingEl = this.createLoadingElement();
        wrapper.appendChild(loadingEl);

        // Tự động fallback sau timeout
        this.loadingTimeout = setTimeout(() => {
            if (wrapper.querySelector('model-viewer')) {
                // model-viewer vẫn đang load, show emoji fallback
                this.replaceWithEmoji(wrapper, modelKey, count);
                this.usingFallback = true;
            }
        }, this.options.loadingTimeout);

        // Kiểm tra support AR
        const arSupport = checkARSupport();
        const arEnable = arSupport === 'webxr' && this.options.arMode;

        // Tạo model-viewer
        if (modelUrl && !this.usingFallback) {
            const viewer = document.createElement('model-viewer');
            viewer.src = modelUrl;
            viewer.alt = fallbackEmoji;
            viewer.style.cssText = `
                width: 100%;
                height: 100%;
                --poster-color: transparent;
            `;

            if (arEnable) {
                viewer.ar = true;
                viewer.arModes = 'scene-viewer webxr quick-look';
            }

            viewer.cameraControls = true;
            viewer.touchAction = 'none';
            viewer.disablePan = true;
            viewer.disableZoom = false;
            viewer.autoRotate = false;
            viewer.style.background = 'transparent';

            // Event listeners
            viewer.addEventListener('load', () => {
                clearTimeout(this.loadingTimeout);
                if (loadingEl.parentNode) {
                    loadingEl.remove();
                }
                if (this.arReadyCallback) {
                    this.arReadyCallback(true);
                }
            });

            viewer.addEventListener('error', () => {
                clearTimeout(this.loadingTimeout);
                this.replaceWithEmoji(wrapper, modelKey, count);
                this.usingFallback = true;
            });

            this.viewerElement = viewer;
            wrapper.appendChild(viewer);
        } else {
            // Fallback to emoji ngay lập tức
            clearTimeout(this.loadingTimeout);
            this.replaceWithEmoji(wrapper, modelKey, count);
            this.usingFallback = true;
        }

        return wrapper;
    }

    // Thay thế bằng emoji fallback
    replaceWithEmoji(wrapper, modelKey, count) {
        wrapper.innerHTML = '';
        const emoji = EMOJI_FALLBACK[modelKey] || '📦';

        const emojiEl = document.createElement('div');
        emojiEl.className = 'ar-emoji-fallback';
        emojiEl.style.cssText = `
            font-size: ${count > 5 ? '48px' : '64px'};
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            flex-wrap: wrap;
            padding: 20px;
            animation: float 3s ease-in-out infinite;
        `;

        for (let i = 0; i < count; i++) {
            const span = document.createElement('span');
            span.textContent = emoji;
            span.style.cssText = `
                animation: float 3s ease-in-out infinite;
                animation-delay: ${i * 0.1}s;
                cursor: pointer;
                transition: transform 0.2s;
            `;
            span.addEventListener('click', () => {
                span.style.transform = 'scale(1.3)';
                playClickSound();
                setTimeout(() => {
                    span.style.transform = '';
                }, 200);
            });
            emojiEl.appendChild(span);
        }

        wrapper.appendChild(emojiEl);

        if (this.arReadyCallback) {
            this.arReadyCallback(false);
        }
    }

    // Hiển thị loading spinner
    createLoadingElement() {
        const loading = document.createElement('div');
        loading.className = 'ar-loading';
        loading.innerHTML = `
            <div class="ar-loading-spinner"></div>
            <div class="ar-loading-text">Đang tải thế giới ảo... 🌍</div>
        `;
        loading.style.cssText = `
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
            z-index: 10;
        `;
        return loading;
    }

    // Hiển thị N bản sao của model
    showObjects(modelKey, count) {
        if (!this.container) return;

        this.container.innerHTML = '';
        this.currentModel = modelKey;

        const grid = document.createElement('div');
        grid.className = 'ar-objects-grid';
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            gap: 16px;
            padding: 20px;
            width: 100%;
            height: 100%;
            align-content: center;
        `;

        const emoji = EMOJI_FALLBACK[modelKey] || '📦';
        const arSupport = checkARSupport();
        const useModelViewer = arSupport === 'webxr' && !this.usingFallback;

        for (let i = 0; i < count; i++) {
            const cell = document.createElement('div');
            cell.className = 'ar-object-cell';
            cell.dataset.index = i;
            cell.style.cssText = `
                aspect-ratio: 1;
                background: white;
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                cursor: pointer;
                transition: all 0.2s;
                animation: float 3s ease-in-out infinite;
                animation-delay: ${i * 0.15}s;
                position: relative;
                overflow: hidden;
            `;

            if (useModelViewer) {
                const viewer = document.createElement('model-viewer');
                viewer.src = AR_MODELS[modelKey];
                viewer.alt = emoji;
                viewer.style.cssText = `
                    width: 100%;
                    height: 100%;
                    --poster-color: transparent;
                `;
                // Enable AR
                viewer.ar = true;
                viewer.arModes = 'scene-viewer webxr quick-look';
                viewer.cameraControls = true;
                viewer.touchAction = 'none';
                viewer.autoRotate = false;
                cell.appendChild(viewer);
                this.viewerElement = viewer; // Store for AR activation
            } else {
                const emojiEl = document.createElement('span');
                emojiEl.textContent = emoji;
                emojiEl.style.fontSize = '40px';
                cell.appendChild(emojiEl);
            }

            // Click handler
            cell.addEventListener('click', () => {
                this.handleObjectClick(cell, i);
            });

            // Touch feedback
            cell.addEventListener('touchstart', () => {
                cell.style.transform = 'scale(0.95)';
            });
            cell.addEventListener('touchend', () => {
                cell.style.transform = '';
            });

            grid.appendChild(cell);
        }

        this.container.appendChild(grid);
    }

    handleObjectClick(element, index) {
        playClickSound();

        // Emit custom event
        const event = new CustomEvent('arObjectClick', {
            detail: { index, element, model: this.currentModel },
            bubbles: true
        });
        this.container.dispatchEvent(event);
    }

    // Bắt đầu AR session
    async startAR() {
        const arSupport = checkARSupport();

        // Check device support
        if (arSupport === 'none') {
            this.showToast('Thiết bị của bạn không hỗ trợ AR. Hiển thị 3D thường.');
            return false;
        }

        if (!this.currentModel) {
            this.showToast('Không có mô hình để hiển thị AR');
            return false;
        }

        this.options.arMode = true;

        try {
            // Create a dedicated AR viewer
            const modelUrl = AR_MODELS[this.currentModel];
            const emoji = EMOJI_FALLBACK[this.currentModel] || '📦';

            // Create fullscreen AR overlay
            const overlay = document.createElement('div');
            overlay.id = 'ar-fullscreen-overlay';
            overlay.style.cssText = `
                position: fixed;
                inset: 0;
                z-index: 9999;
                background: white;
            `;

            const viewer = document.createElement('model-viewer');
            viewer.src = modelUrl;
            viewer.alt = emoji;
            viewer.ar = true;
            viewer.arModes = 'scene-viewer webxr quick-look';
            viewer.cameraControls = true;
            viewer.style.cssText = `
                width: 100%;
                height: 100%;
                --poster-color: transparent;
            `;

            // Add close button
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '✕';
            closeBtn.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: white;
                border: none;
                font-size: 24px;
                cursor: pointer;
                z-index: 10000;
                box-shadow: 0 2px 12px rgba(0,0,0,0.2);
            `;
            closeBtn.onclick = () => {
                document.body.removeChild(overlay);
                this.options.arMode = false;
            };

            // Add instruction
            const instruction = document.createElement('div');
            instruction.innerHTML = '📍 Di chuyển điện thoại để xem model xung quanh bạn';
            instruction.style.cssText = `
                position: absolute;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 12px 20px;
                border-radius: 24px;
                font-size: 14px;
                text-align: center;
                z-index: 10000;
            `;

            overlay.appendChild(viewer);
            overlay.appendChild(closeBtn);
            overlay.appendChild(instruction);
            document.body.appendChild(overlay);

            // Auto-trigger AR button on model-viewer
            viewer.addEventListener('load', () => {
                // Try to activate AR automatically
                setTimeout(() => {
                    const arButton = viewer.shadowRoot?.querySelector('[slot="ar-button"]') ||
                                      viewer.querySelector('[data-variant="ar"]');
                    if (arButton) {
                        arButton.click();
                    }
                }, 500);
            });

            return true;
        } catch (error) {
            console.error('AR start error:', error);
            this.showToast('Không thể bắt đầu AR: ' + error.message);
            return false;
        }
    }

    // Kết thúc AR
    stopAR() {
        this.options.arMode = false;
        this.hideAROverlay();
    }

    // Hiển thị AR Overlay UI
    showAROverlay() {
        if (this.overlayUI) return;

        this.overlayUI = document.createElement('div');
        this.overlayUI.className = 'ar-overlay';
        this.overlayUI.innerHTML = `
            <button class="ar-exit-btn" aria-label="Thoát AR">✕</button>
            <div class="ar-guide">
                <div class="ar-reticle"></div>
                <p class="ar-guide-text">Di chuyển điện thoại để đặt vật lên sàn</p>
            </div>
        `;

        // Inject styles
        if (!document.getElementById('ar-overlay-styles')) {
            const style = document.createElement('style');
            style.id = 'ar-overlay-styles';
            style.textContent = `
                .ar-overlay {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    z-index: 9999;
                }
                .ar-exit-btn {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 44px;
                    height: 44px;
                    background: #E74C3C;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    font-size: 20px;
                    cursor: pointer;
                    pointer-events: auto;
                    box-shadow: 0 4px 12px rgba(231,76,60,0.4);
                    transition: transform 0.2s;
                    z-index: 10000;
                }
                .ar-exit-btn:active {
                    transform: scale(0.9);
                }
                .ar-guide {
                    position: absolute;
                    bottom: 40px;
                    left: 50%;
                    transform: translateX(-50%);
                    text-align: center;
                    pointer-events: auto;
                }
                .ar-reticle {
                    width: 48px;
                    height: 48px;
                    margin: 0 auto 12px;
                    border: 3px solid rgba(255,255,255,0.8);
                    border-radius: 50%;
                    animation: ar-reticle-pulse 2s ease-in-out infinite;
                }
                @keyframes ar-reticle-pulse {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 1;
                        box-shadow: 0 0 0 0 rgba(255,255,255,0.7);
                    }
                    50% {
                        transform: scale(1.2);
                        opacity: 0.8;
                        box-shadow: 0 0 0 10px rgba(255,255,255,0);
                    }
                }
                .ar-guide-text {
                    background: rgba(0,0,0,0.6);
                    color: white;
                    padding: 10px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 600;
                }
            `;
            document.head.appendChild(style);
        }

        // Exit button handler
        this.overlayUI.querySelector('.ar-exit-btn').addEventListener('click', () => {
            this.stopAR();
        });

        document.body.appendChild(this.overlayUI);
    }

    hideAROverlay() {
        if (this.overlayUI) {
            this.overlayUI.remove();
            this.overlayUI = null;
        }
    }

    // Callback khi AR ready
    onARReady(callback) {
        this.arReadyCallback = callback;
    }

    // Animate object với CSS animation
    animateObject(element, type = 'bounce') {
        if (!element) return;

        const animations = {
            bounce: 'ar-bounce 0.5s ease-out',
            spin: 'ar-spin 0.8s ease-out',
            wiggle: 'ar-wiggle 0.5s ease-out',
            pop: 'ar-pop 0.4s ease-out',
            shake: 'ar-shake 0.5s ease-out'
        };

        // Inject animation styles if not present
        if (!document.getElementById('ar-animation-styles')) {
            const style = document.createElement('style');
            style.id = 'ar-animation-styles';
            style.textContent = `
                @keyframes ar-bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                @keyframes ar-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes ar-wiggle {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-10deg); }
                    75% { transform: rotate(10deg); }
                }
                @keyframes ar-pop {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.3); }
                    100% { transform: scale(1); }
                }
                @keyframes ar-shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-10px); }
                    40% { transform: translateX(10px); }
                    60% { transform: translateX(-10px); }
                    80% { transform: translateX(10px); }
                }
            `;
            document.head.appendChild(style);
        }

        element.style.animation = 'none';
        element.offsetHeight; // Trigger reflow
        element.style.animation = animations[type] || animations.bounce;
    }

    // Highlight khi chọn đúng
    highlightCorrect(element) {
        if (!element) return;

        playCorrectSound();

        element.style.background = 'linear-gradient(135deg, #A8E6CF, #81C784)';
        element.style.boxShadow = '0 0 20px rgba(129,199,132,0.6)';
        element.style.transform = 'scale(1.1)';

        this.animateObject(element, 'bounce');

        setTimeout(() => {
            element.style.background = '';
            element.style.boxShadow = '';
            element.style.transform = '';
        }, 1500);
    }

    // Highlight khi chọn sai
    highlightWrong(element) {
        if (!element) return;

        playWrongSound();

        element.style.background = 'linear-gradient(135deg, #FFCDD2, #EF9A9A)';
        element.style.boxShadow = '0 0 20px rgba(239,154,154,0.6)';

        this.animateObject(element, 'shake');

        setTimeout(() => {
            element.style.background = '';
            element.style.boxShadow = '';
            element.style.transform = '';
        }, 1000);
    }

    // Hiển thị toast thông báo
    showToast(message, duration = 3000) {
        const existing = document.querySelector('.ar-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'ar-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 14px;
            font-weight: 600;
            z-index: 10001;
            opacity: 0;
            transition: all 0.3s ease-out;
            max-width: 90%;
            text-align: center;
        `;

        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
            toast.style.opacity = '1';
        });

        // Remove after duration
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Cleanup
    destroy() {
        if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
        }
        if (this.overlayUI) {
            this.overlayUI.remove();
        }
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// ========== AR OBJECT GRID COMPONENT ==========
function createARObjectGrid(container, modelKey, count, onObjectClick) {
    if (!container) {
        console.error('Container element is required');
        return null;
    }

    // Clear container
    container.innerHTML = '';
    container.style.cssText = `
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
        border-radius: 20px;
        overflow: hidden;
    `;

    // Create grid
    const grid = document.createElement('div');
    grid.className = 'ar-object-grid';
    grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
        gap: 16px;
        padding: 20px;
        width: 100%;
        height: 100%;
        align-content: center;
        justify-content: center;
    `;

    const emoji = EMOJI_FALLBACK[modelKey] || '📦';
    const arSupport = checkARSupport();
    const useModelViewer = arSupport === 'webxr';

    // Calculate optimal columns based on count
    const cols = Math.min(Math.ceil(Math.sqrt(count)), 4);
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    for (let i = 0; i < count; i++) {
        const cell = createObjectCell(modelKey, i, useModelViewer, (index, element) => {
            if (onObjectClick) {
                onObjectClick(index, element);
            }
        });
        grid.appendChild(cell);
    }

    container.appendChild(grid);

    return {
        element: grid,
        highlightCorrect: (index) => {
            const cell = grid.children[index];
            if (cell) highlightCellCorrect(cell);
        },
        highlightWrong: (index) => {
            const cell = grid.children[index];
            if (cell) highlightCellWrong(cell);
        },
        animate: (index, type) => {
            const cell = grid.children[index];
            if (cell) animateCell(cell, type);
        }
    };
}

function createObjectCell(modelKey, index, useModelViewer, onClick) {
    const cell = document.createElement('div');
    cell.className = 'ar-object-cell';
    cell.dataset.index = index;
    cell.dataset.model = modelKey;

    cell.style.cssText = `
        aspect-ratio: 1;
        background: white;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
        overflow: hidden;
        animation: float 3s ease-in-out infinite;
        animation-delay: ${index * 0.15}s;
    `;

    const emoji = EMOJI_FALLBACK[modelKey] || '📦';

    if (useModelViewer && AR_MODELS[modelKey]) {
        const viewer = document.createElement('model-viewer');
        viewer.src = AR_MODELS[modelKey];
        viewer.alt = emoji;
        viewer.style.cssText = `
            width: 100%;
            height: 100%;
            --poster-color: transparent;
        `;
        viewer.cameraControls = true;
        viewer.touchAction = 'none';
        cell.appendChild(viewer);
    } else {
        const emojiEl = document.createElement('span');
        emojiEl.textContent = emoji;
        emojiEl.style.fontSize = '40px';
        emojiEl.style.userSelect = 'none';
        cell.appendChild(emojiEl);
    }

    // Event listeners
    const handleInteract = () => {
        playClickSound();
        cell.style.transform = 'scale(0.95)';
        setTimeout(() => {
            cell.style.transform = '';
        }, 100);
        onClick(index, cell);
    };

    cell.addEventListener('click', handleInteract);
    cell.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleInteract();
    });

    return cell;
}

function highlightCellCorrect(cell) {
    playCorrectSound();

    cell.style.background = 'linear-gradient(135deg, #A8E6CF, #81C784)';
    cell.style.boxShadow = '0 0 24px rgba(129,199,132,0.6)';
    cell.style.transform = 'scale(1.15)';

    // Add bounce animation
    cell.style.animation = 'none';
    cell.offsetHeight;
    cell.style.animation = 'ar-bounce 0.5s ease-out';

    setTimeout(() => {
        cell.style.background = 'white';
        cell.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        cell.style.transform = '';
        cell.style.animation = 'float 3s ease-in-out infinite';
    }, 1500);
}

function highlightCellWrong(cell) {
    playWrongSound();

    cell.style.background = 'linear-gradient(135deg, #FFCDD2, #EF9A9A)';
    cell.style.boxShadow = '0 0 24px rgba(239,154,154,0.6)';

    // Add shake animation
    cell.style.animation = 'none';
    cell.offsetHeight;
    cell.style.animation = 'ar-shake 0.5s ease-out';

    setTimeout(() => {
        cell.style.background = 'white';
        cell.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        cell.style.animation = 'float 3s ease-in-out infinite';
    }, 1000);
}

function animateCell(cell, type = 'bounce') {
    const animations = {
        bounce: 'ar-bounce 0.5s ease-out',
        spin: 'ar-spin 0.8s ease-out',
        wiggle: 'ar-wiggle 0.5s ease-out',
        pop: 'ar-pop 0.4s ease-out',
        shake: 'ar-shake 0.5s ease-out'
    };

    cell.style.animation = 'none';
    cell.offsetHeight;
    cell.style.animation = animations[type] || animations.bounce;
}

// ========== TOAST NOTIFICATION ==========
function showARToast(message, duration = 3000) {
    const existing = document.querySelector('.ar-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'ar-toast';
    toast.textContent = message;

    if (!document.getElementById('ar-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'ar-toast-styles';
        style.textContent = `
            .ar-toast {
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 12px 24px;
                border-radius: 24px;
                font-size: 14px;
                font-weight: 600;
                z-index: 10001;
                opacity: 0;
                transition: all 0.3s ease-out;
                max-width: 90%;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.opacity = '1';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ========== AR EXERCISE CLASS ==========
/**
 * ARExercise - Quản lý bài tập AR đầy đủ với camera background
 * Hiển thị 3D models trên nền camera cho người dùng tương tác
 */
class ARExercise {
    constructor(options = {}) {
        this.options = {
            containerId: null,
            onAnswerSelect: null,
            onClose: null,
            ...options
        };

        this.isActive = false;
        this.currentModels = [];
        this.modelCount = 0;
        this.overlay = null;
        this.viewer = null;
    }

    /**
     * Mở AR exercise với camera background
     * @param {string} modelType - Loại model ('apple', 'cat', etc.)
     * @param {number} count - Số lượng model hiển thị
     * @param {Array} choices - Các lựa chọn đáp án
     */
    start(modelType, count, choices = []) {
        const modelUrl = AR_MODELS[modelType];
        const emoji = EMOJI_FALLBACK[modelType] || '📦';

        if (!modelUrl) {
            console.error('Model not found for:', modelType);
            showARToast('Không tìm thấy model 3D', 'error');
            return;
        }

        this.isActive = true;
        this.modelType = modelType;
        this.modelCount = count;
        this.choices = choices;

        // Create fullscreen AR overlay
        this.createAROverlay(modelUrl, emoji, count, choices);
    }

    createAROverlay(modelUrl, emoji, count, choices) {
        // Remove existing overlay
        this.close();

        // Create main overlay
        const overlay = document.createElement('div');
        overlay.id = 'ar-exercise-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: #000;
            display: flex;
            flex-direction: column;
        `;

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: 16px;
            right: 16px;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(255,255,255,0.9);
            border: none;
            font-size: 24px;
            font-weight: bold;
            cursor: pointer;
            z-index: 10002;
            box-shadow: 0 2px 12px rgba(0,0,0,0.3);
        `;
        closeBtn.onclick = () => this.close();

        // Question text
        const questionText = document.createElement('div');
        questionText.id = 'ar-question-text';
        questionText.innerHTML = `Đếm số ${emoji} và chọn đáp án đúng!`;
        questionText.style.cssText = `
            position: absolute;
            top: 16px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255,255,255,0.95);
            color: var(--color-text);
            padding: 12px 24px;
            border-radius: 24px;
            font-family: 'Nunito', sans-serif;
            font-size: 16px;
            font-weight: 700;
            z-index: 10002;
            box-shadow: 0 2px 12px rgba(0,0,0,0.2);
            max-width: 80%;
            text-align: center;
        `;

        // Model viewer with AR
        const viewer = document.createElement('model-viewer');
        viewer.src = modelUrl;
        viewer.alt = emoji;
        viewer.ar = true;
        viewer.arModes = 'scene-viewer webxr quick-look';
        viewer.cameraControls = true;
        viewer.autoRotate = false;
        viewer.style.cssText = `
            width: 100%;
            flex: 1;
            min-height: 50vh;
        `;

        // Instruction overlay
        const instruction = document.createElement('div');
        instruction.id = 'ar-instruction';
        instruction.innerHTML = `
            📱 Di chuyển điện thoại để tìm mặt phẳng<br>
            📍 Model sẽ xuất hiện khi AR bắt đầu
        `;
        instruction.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.75);
            color: white;
            padding: 20px 30px;
            border-radius: 16px;
            font-family: 'Nunito', sans-serif;
            font-size: 14px;
            text-align: center;
            z-index: 10001;
            max-width: 80%;
        `;

        // Model counter display
        const counterDisplay = document.createElement('div');
        counterDisplay.id = 'ar-model-counter';
        counterDisplay.innerHTML = `<span style="font-size: 24px;">${emoji}</span> × ${count}`;
        counterDisplay.style.cssText = `
            position: absolute;
            bottom: 180px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255,255,255,0.95);
            padding: 16px 32px;
            border-radius: 32px;
            font-family: 'Nunito', sans-serif;
            font-size: 20px;
            font-weight: 700;
            z-index: 10002;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        `;

        // Answer choices panel
        const choicesPanel = document.createElement('div');
        choicesPanel.id = 'ar-choices-panel';
        choicesPanel.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            padding: 20px;
            padding-bottom: max(20px, env(safe-area-inset-bottom));
            border-radius: 24px 24px 0 0;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
            z-index: 10002;
        `;

        const choicesTitle = document.createElement('div');
        choicesTitle.innerHTML = 'Chọn số lượng:';
        choicesTitle.style.cssText = `
            font-family: 'Nunito', sans-serif;
            font-size: 16px;
            font-weight: 700;
            color: var(--color-text);
            margin-bottom: 12px;
            text-align: center;
        `;

        const choicesGrid = document.createElement('div');
        choicesGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
        `;

        choices.forEach(choice => {
            const choiceBtn = document.createElement('button');
            choiceBtn.innerHTML = choice;
            choiceBtn.style.cssText = `
                padding: 16px;
                border: 3px solid #E0E0E0;
                border-radius: 16px;
                background: white;
                font-family: 'Nunito', sans-serif;
                font-size: 20px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s;
            `;
            choiceBtn.onclick = () => this.handleAnswer(choice, choiceBtn);
            choicesGrid.appendChild(choiceBtn);
        });

        choicesPanel.appendChild(choicesTitle);
        choicesPanel.appendChild(choicesGrid);

        // Hide instruction when AR starts
        viewer.addEventListener('load', () => {
            setTimeout(() => {
                instruction.style.opacity = '0';
                setTimeout(() => instruction.remove(), 500);
            }, 2000);
        });

        // Assemble overlay
        overlay.appendChild(closeBtn);
        overlay.appendChild(questionText);
        overlay.appendChild(viewer);
        overlay.appendChild(instruction);
        overlay.appendChild(counterDisplay);
        overlay.appendChild(choicesPanel);

        document.body.appendChild(overlay);
        this.overlay = overlay;
        this.viewer = viewer;

        playClickSound();
    }

    handleAnswer(answer, button) {
        // Disable all buttons
        const buttons = this.overlay.querySelectorAll('#ar-choices-panel button');
        buttons.forEach(btn => btn.disabled = true);

        // Highlight selected
        button.style.background = '#FF6B6B';
        button.style.color = 'white';
        button.style.borderColor = '#FF6B6B';

        // Call answer callback
        if (this.options.onAnswerSelect) {
            this.options.onAnswerSelect(answer, this.modelCount);
        }

        // Wait and close
        setTimeout(() => {
            this.close();
        }, 1500);
    }

    close() {
        if (this.overlay && this.overlay.parentNode) {
            document.body.removeChild(this.overlay);
        }
        this.isActive = false;
        this.overlay = null;
        this.viewer = null;

        if (this.options.onClose) {
            this.options.onClose();
        }
    }
}

// ========== AR INFO ==========
function getARDeviceInfo() {
    const support = checkARSupport();
    const info = {
        support,
        userAgent: navigator.userAgent,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
        isAndroid: /Android/.test(navigator.userAgent)
    };
    return info;
}

// ========== EXPORTS ==========
export {
    ARScene,
    ARExercise,
    createARObjectGrid,
    checkARSupport,
    playCorrectSound,
    playWrongSound,
    playStarSound,
    playClickSound,
    showARToast,
    getARDeviceInfo,
    AR_MODELS,
    EMOJI_FALLBACK
};
