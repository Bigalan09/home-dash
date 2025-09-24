/**
 * 3-Finger Swipe Navigation for Pi Touch Display 2
 * Handles navigation between calendar.html and tasks.html
 */

class SwipeNavigationManager {
  constructor() {
    this.touches = new Map();
    this.swipeThreshold = 100; // Minimum distance for swipe
    this.maxSwipeTime = 500; // Maximum time for swipe gesture
    this.requiredFingers = 3; // Require exactly 3 fingers
    this.isNavigating = false;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Use passive listeners where possible, non-passive only when preventDefault needed
    document.addEventListener("touchstart", this.handleTouchStart.bind(this), {
      passive: false,
    });
    document.addEventListener("touchmove", this.handleTouchMove.bind(this), {
      passive: false,
    });
    document.addEventListener("touchend", this.handleTouchEnd.bind(this), {
      passive: true,
    });
    document.addEventListener(
      "touchcancel",
      this.handleTouchCancel.bind(this),
      { passive: true },
    );
  }

  handleTouchStart(event) {
    // Only process if we have exactly 3 touches
    if (event.touches.length !== this.requiredFingers) {
      this.touches.clear();
      return;
    }

    // Prevent default behavior for 3-finger gestures
    event.preventDefault();

    const now = Date.now();
    this.touches.clear();

    // Store initial touch positions
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      this.touches.set(touch.identifier, {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: now,
        currentX: touch.clientX,
        currentY: touch.clientY,
      });
    }
  }

  handleTouchMove(event) {
    // Only process if we have exactly 3 touches
    if (
      event.touches.length !== this.requiredFingers ||
      this.touches.size !== this.requiredFingers
    ) {
      return;
    }

    // Prevent default scrolling during 3-finger gesture
    event.preventDefault();

    // Update current positions
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      const touchData = this.touches.get(touch.identifier);
      if (touchData) {
        touchData.currentX = touch.clientX;
        touchData.currentY = touch.clientY;
      }
    }
  }

  handleTouchEnd(event) {
    // Check if this was a 3-finger gesture
    if (this.touches.size !== this.requiredFingers) {
      this.touches.clear();
      return;
    }

    // Prevent navigation if already in progress
    if (this.isNavigating) {
      return;
    }

    const now = Date.now();
    const touchArray = Array.from(this.touches.values());

    // Check if all touches ended within time threshold
    const maxDuration = Math.max(...touchArray.map((t) => now - t.startTime));
    if (maxDuration > this.maxSwipeTime) {
      this.touches.clear();
      return;
    }

    // Calculate average swipe distance and direction
    const avgDeltaX =
      touchArray.reduce((sum, t) => sum + (t.currentX - t.startX), 0) /
      touchArray.length;
    const avgDeltaY =
      touchArray.reduce((sum, t) => sum + Math.abs(t.currentY - t.startY), 0) /
      touchArray.length;

    // Check if it's primarily a horizontal swipe with sufficient distance
    if (
      Math.abs(avgDeltaX) > this.swipeThreshold &&
      Math.abs(avgDeltaX) > avgDeltaY * 2
    ) {
      this.handleSwipe(avgDeltaX > 0 ? "right" : "left");
    }

    this.touches.clear();
  }

  handleTouchCancel(event) {
    this.touches.clear();
  }

  handleSwipe(direction) {
    if (this.isNavigating) return;

    const currentPage = window.location.pathname.split("/").pop();
    const pages = ["calendar.html", "tasks.html"];
    let currentIndex = pages.indexOf(currentPage);

    // If current page is not in our pages array, default to first page
    if (currentIndex === -1) {
      currentIndex = 0;
    }

    let targetIndex;

    // Navigation logic with carousel looping:
    // Swipe left = go forward (calendar → tasks → calendar)
    // Swipe right = go back (tasks → calendar → tasks)
    if (direction === "left") {
      // Forward navigation with loop
      targetIndex = (currentIndex + 1) % pages.length;
    } else if (direction === "right") {
      // Back navigation with loop
      targetIndex = (currentIndex - 1 + pages.length) % pages.length;
    }

    const targetPage = pages[targetIndex];
    this.navigateToPage(targetPage, direction);
  }

  navigateToPage(targetPage, direction) {
    this.isNavigating = true;

    // Add visual feedback for the swipe
    this.showSwipeIndicator(direction);

    // Navigate after a brief delay for visual feedback
    setTimeout(() => {
      // Listen for page unload to reset navigation flag
      window.addEventListener(
        "beforeunload",
        () => {
          this.isNavigating = false;
        },
        { once: true },
      );

      window.location.href = targetPage;
    }, 150);

    // Fallback reset after 2 seconds in case navigation fails
    setTimeout(() => {
      this.isNavigating = false;
    }, 2000);
  }

  showSwipeIndicator(direction) {
    // Create a temporary visual indicator
    const indicator = document.createElement("div");
    indicator.className = "swipe-indicator";
    indicator.innerHTML =
      direction === "left"
        ? '<i class="ti ti-arrow-right"></i>'
        : '<i class="ti ti-arrow-left"></i>';

    // Add styles
    indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--accent, #e91e63);
            color: white;
            padding: 20px;
            border-radius: 50%;
            font-size: 24px;
            z-index: 10000;
            pointer-events: none;
            animation: swipeIndicatorPulse 0.3s ease-out forwards;
        `;

    // Add animation keyframes if not already present
    if (!document.querySelector("#swipeIndicatorStyle")) {
      const style = document.createElement("style");
      style.id = "swipeIndicatorStyle";
      style.textContent = `
                @keyframes swipeIndicatorPulse {
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
            `;
      document.head.appendChild(style);
    }

    document.body.appendChild(indicator);

    // Remove indicator after animation
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 400);
  }
}

// Initialize swipe navigation when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new SwipeNavigationManager();
  });
} else {
  new SwipeNavigationManager();
}

// Debug helper (remove in production)
window.SwipeNavigationManager = SwipeNavigationManager;
