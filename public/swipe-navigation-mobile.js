/**
 * Mobile-Optimized Swipe Navigation for Pi Touch Display 2
 * Uses 2-finger swipes to avoid iOS 3-finger system gestures
 * Integrates with Touchy.js for better multi-touch support
 */

class MobileSwipeNavigationManager {
    constructor(options = {}) {
        // Configuration
        this.requiredFingers = options.fingers || 2; // Use 2 fingers by default
        this.swipeThreshold = options.threshold || 50; // Lower threshold for mobile
        this.swipeVelocityThreshold = options.velocity || 0.3; // pixels per ms
        this.maxSwipeTime = options.maxTime || 1000;
        this.preventSystemGestures = options.preventSystem !== false;

        // State
        this.isNavigating = false;
        this.swipeStarted = false;
        this.touchData = {
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            startTime: 0,
            fingerCount: 0
        };

        // Detect iOS/Safari
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        this.init();
    }

    init() {
        // Try to use Touchy.js if available
        if (typeof Touchy !== 'undefined') {
            this.setupTouchyListeners();
        } else {
            this.setupStandardListeners();
        }

        // iOS-specific setup
        if (this.isIOS && this.preventSystemGestures) {
            this.setupIOSGesturePrevention();
        }

        console.log(`MobileSwipeNavigation initialized: ${this.requiredFingers}-finger swipes, Touchy: ${typeof Touchy !== 'undefined'}, iOS: ${this.isIOS}`);
    }

    setupTouchyListeners() {
        const element = document.body;

        // Configure based on required finger count
        const touchyConfig = {};

        if (this.requiredFingers === 1) {
            touchyConfig.one = (hand, finger) => this.handleMultiTouch(hand, [finger]);
        } else if (this.requiredFingers === 2) {
            touchyConfig.two = (hand, finger1, finger2) => this.handleMultiTouch(hand, [finger1, finger2]);
        } else if (this.requiredFingers === 3) {
            touchyConfig.three = (hand, finger1, finger2, finger3) => this.handleMultiTouch(hand, [finger1, finger2, finger3]);
        }

        Touchy(element, touchyConfig);
    }

    handleMultiTouch(hand, fingers) {
        if (fingers.length !== this.requiredFingers) return;

        const firstFinger = fingers[0];
        const startPoint = firstFinger.lastPoint;

        // Initialize swipe tracking
        this.touchData = {
            startX: startPoint.x,
            startY: startPoint.y,
            currentX: startPoint.x,
            currentY: startPoint.y,
            startTime: Date.now(),
            fingerCount: fingers.length
        };

        this.swipeStarted = true;

        // Track movement
        const moveHandler = (point) => {
            if (!this.swipeStarted) return;

            this.touchData.currentX = point.x;
            this.touchData.currentY = point.y;

            // Visual feedback
            this.updateSwipeFeedback();
        };

        // Handle end
        const endHandler = () => {
            if (!this.swipeStarted) return;

            this.processSwipe();
            this.swipeStarted = false;

            // Clean up visual feedback
            this.clearSwipeFeedback();
        };

        // Bind handlers to all fingers
        fingers.forEach(finger => {
            finger.on('move', moveHandler);
            finger.on('end', endHandler);
        });

        // Show initial feedback
        this.showSwipeStartFeedback();
    }

    setupStandardListeners() {
        // Fallback for standard touch events
        let touchStartData = null;

        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === this.requiredFingers) {
                e.preventDefault(); // Prevent scrolling during multi-touch

                const touch = e.touches[0];
                touchStartData = {
                    startX: touch.clientX,
                    startY: touch.clientY,
                    startTime: Date.now()
                };

                this.touchData = {
                    ...touchStartData,
                    currentX: touch.clientX,
                    currentY: touch.clientY,
                    fingerCount: e.touches.length
                };

                this.swipeStarted = true;
                this.showSwipeStartFeedback();
            } else {
                this.swipeStarted = false;
                touchStartData = null;
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!this.swipeStarted || e.touches.length !== this.requiredFingers) return;

            e.preventDefault();
            const touch = e.touches[0];

            this.touchData.currentX = touch.clientX;
            this.touchData.currentY = touch.clientY;

            this.updateSwipeFeedback();
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            if (!this.swipeStarted) return;

            // Process swipe when all fingers are lifted
            if (e.touches.length === 0) {
                this.processSwipe();
                this.swipeStarted = false;
                this.clearSwipeFeedback();
            }
        });

        document.addEventListener('touchcancel', () => {
            this.swipeStarted = false;
            this.clearSwipeFeedback();
        });
    }

    setupIOSGesturePrevention() {
        // Prevent iOS Safari gestures
        const style = document.createElement('style');
        style.textContent = `
            body {
                /* Prevent pinch zoom */
                touch-action: pan-x pan-y;

                /* Prevent text selection during swipe */
                -webkit-user-select: none;
                user-select: none;

                /* Prevent bounce scrolling */
                overscroll-behavior: none;

                /* Prevent callout on long press */
                -webkit-touch-callout: none;
            }

            /* Allow text selection only in specific areas */
            .selectable {
                -webkit-user-select: text;
                user-select: text;
            }
        `;
        document.head.appendChild(style);

        // Prevent default on certain gestures
        document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });
    }

    processSwipe() {
        const deltaX = this.touchData.currentX - this.touchData.startX;
        const deltaY = this.touchData.currentY - this.touchData.startY;
        const duration = Date.now() - this.touchData.startTime;

        // Calculate velocity
        const velocity = Math.abs(deltaX) / duration;

        // Check for valid horizontal swipe
        const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.5;
        const hasMinDistance = Math.abs(deltaX) > this.swipeThreshold;
        const hasMinVelocity = velocity > this.swipeVelocityThreshold;
        const withinTimeLimit = duration < this.maxSwipeTime;

        if (isHorizontal && hasMinDistance && (hasMinVelocity || withinTimeLimit)) {
            const direction = deltaX > 0 ? 'right' : 'left';
            this.handleSwipe(direction);
        }
    }

    handleSwipe(direction) {
        if (this.isNavigating) return;

        // Get current page
        const pathname = window.location.pathname;
        const currentPage = pathname.substring(pathname.lastIndexOf('/') + 1) || 'index.html';

        let targetPage = null;

        // Navigation logic
        if (direction === 'left') {
            // Go forward
            switch(currentPage) {
                case 'index.html':
                case 'calendar.html':
                case '':
                    targetPage = 'tasks.html';
                    break;
            }
        } else if (direction === 'right') {
            // Go back
            switch(currentPage) {
                case 'tasks.html':
                    targetPage = 'calendar.html';
                    break;
            }
        }

        if (targetPage) {
            this.navigateToPage(targetPage, direction);
        } else {
            // Show feedback that we're at the edge
            this.showEdgeFeedback(direction);
        }
    }

    navigateToPage(targetPage, direction) {
        this.isNavigating = true;

        // Show navigation indicator
        this.showNavigationIndicator(direction, targetPage);

        // Add haptic feedback if available
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }

        // Navigate after animation
        setTimeout(() => {
            window.location.href = targetPage;
        }, 200);

        // Reset flag after timeout
        setTimeout(() => {
            this.isNavigating = false;
        }, 2000);
    }

    showSwipeStartFeedback() {
        // Remove any existing feedback
        this.clearSwipeFeedback();

        const feedback = document.createElement('div');
        feedback.id = 'swipe-start-feedback';
        feedback.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: var(--accent, #e91e63);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            z-index: 10001;
            opacity: 0.9;
            animation: fadeIn 0.2s ease;
        `;
        feedback.textContent = `${this.requiredFingers}-finger swipe detected`;

        document.body.appendChild(feedback);
    }

    updateSwipeFeedback() {
        const feedback = document.getElementById('swipe-start-feedback');
        if (!feedback) return;

        const deltaX = this.touchData.currentX - this.touchData.startX;
        const direction = deltaX > 0 ? '→' : '←';
        const distance = Math.abs(deltaX);

        if (distance > this.swipeThreshold) {
            feedback.textContent = `Swiping ${direction} (${Math.round(distance)}px)`;
            feedback.style.background = 'var(--success, #10b981)';
        }
    }

    clearSwipeFeedback() {
        const feedback = document.getElementById('swipe-start-feedback');
        if (feedback) {
            feedback.remove();
        }
    }

    showNavigationIndicator(direction, targetPage) {
        const indicator = document.createElement('div');
        indicator.className = 'swipe-nav-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--accent, #e91e63);
            color: white;
            padding: 30px;
            border-radius: 20px;
            font-size: 16px;
            font-weight: 600;
            z-index: 10002;
            text-align: center;
            animation: slideAndFade 0.4s ease forwards;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;

        const arrow = direction === 'left' ? '→' : '←';
        const pageName = targetPage.replace('.html', '').charAt(0).toUpperCase() +
                         targetPage.replace('.html', '').slice(1);

        indicator.innerHTML = `
            <div style="font-size: 32px; margin-bottom: 10px;">${arrow}</div>
            <div>Navigating to ${pageName}</div>
        `;

        document.body.appendChild(indicator);

        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 500);
    }

    showEdgeFeedback(direction) {
        const edge = document.createElement('div');
        edge.style.cssText = `
            position: fixed;
            top: 0;
            ${direction === 'left' ? 'right: 0' : 'left: 0'};
            width: 20px;
            height: 100%;
            background: linear-gradient(${direction === 'left' ? '90deg' : '270deg'},
                transparent, var(--accent, #e91e63));
            opacity: 0;
            pointer-events: none;
            animation: edgePulse 0.3s ease;
            z-index: 10000;
        `;

        document.body.appendChild(edge);

        // Add haptic feedback for edge
        if ('vibrate' in navigator) {
            navigator.vibrate([25, 50, 25]);
        }

        setTimeout(() => {
            edge.remove();
        }, 300);
    }
}

// Add required CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 0.9; transform: scale(1); }
    }

    @keyframes slideAndFade {
        0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
        }
        50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
        }
    }

    @keyframes edgePulse {
        0% { opacity: 0; }
        50% { opacity: 0.5; }
        100% { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Auto-initialize with different configurations based on context
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Use 2-finger swipes by default (works better on iOS)
        window.swipeNav = new MobileSwipeNavigationManager({
            fingers: 2,
            threshold: 50,
            velocity: 0.3
        });
    });
} else {
    window.swipeNav = new MobileSwipeNavigationManager({
        fingers: 2,
        threshold: 50,
        velocity: 0.3
    });
}

// Export for testing
window.MobileSwipeNavigationManager = MobileSwipeNavigationManager;