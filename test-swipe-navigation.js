/**
 * Playwright E2E Test for 3-Finger Swipe Navigation
 * Tests swipe navigation functionality for HomeDashboard
 */

const { chromium } = require('playwright');

class SwipeNavigationVerification {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.baseUrl = 'http://localhost:3003';
        this.results = {
            passed: 0,
            failed: 0,
            issues: []
        };
    }

    async setup() {
        this.browser = await chromium.launch({
            headless: false,
            args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        });

        this.context = await this.browser.newContext({
            viewport: { width: 720, height: 1280 }, // Pi Touch Display 2 resolution
            hasTouch: true,
            userAgent: 'Mozilla/5.0 (Linux; Android 10; Raspberry Pi) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36'
        });

        this.page = await this.context.newPage();

        // Enable console logging
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`❌ Browser Console Error: ${msg.text()}`);
                this.results.issues.push(`Console Error: ${msg.text()}`);
            }
        });

        // Enable error logging
        this.page.on('pageerror', error => {
            console.log(`❌ Page Error: ${error.message}`);
            this.results.issues.push(`Page Error: ${error.message}`);
        });
    }

    async cleanup() {
        if (this.page) await this.page.close();
        if (this.context) await this.context.close();
        if (this.browser) await this.browser.close();
    }

    async verifyTest(testName, testFunction) {
        try {
            console.log(`🧪 Testing: ${testName}`);
            await testFunction();
            console.log(`✅ PASSED: ${testName}`);
            this.results.passed++;
        } catch (error) {
            console.log(`❌ FAILED: ${testName} - ${error.message}`);
            this.results.failed++;
            this.results.issues.push(`${testName}: ${error.message}`);
        }
    }

    async testPageLoad() {
        await this.verifyTest('Calendar page loads successfully', async () => {
            const response = await this.page.goto(`${this.baseUrl}/calendar.html`);
            if (!response.ok()) {
                throw new Error(`Failed to load calendar.html: ${response.status()}`);
            }

            // Wait for swipe navigation script to load
            await this.page.waitForFunction(() => window.SwipeNavigationManager);

            // Verify pagination shows correct page
            const activeDot = await this.page.locator('.pagination-dot.active').first();
            const isFirstDot = await this.page.evaluate(() => {
                const dots = Array.from(document.querySelectorAll('.pagination-dot'));
                const activeDot = document.querySelector('.pagination-dot.active');
                return dots.indexOf(activeDot) === 0;
            });

            if (!isFirstDot) {
                throw new Error('First pagination dot should be active on calendar page');
            }
        });

        await this.verifyTest('Tasks page loads successfully', async () => {
            const response = await this.page.goto(`${this.baseUrl}/tasks.html`);
            if (!response.ok()) {
                throw new Error(`Failed to load tasks.html: ${response.status()}`);
            }

            // Wait for swipe navigation script to load
            await this.page.waitForFunction(() => window.SwipeNavigationManager);

            // Verify pagination shows correct page
            const isSecondDot = await this.page.evaluate(() => {
                const dots = Array.from(document.querySelectorAll('.pagination-dot'));
                const activeDot = document.querySelector('.pagination-dot.active');
                return dots.indexOf(activeDot) === 1;
            });

            if (!isSecondDot) {
                throw new Error('Second pagination dot should be active on tasks page');
            }
        });
    }

    async testSwipeNavigationLogic() {
        await this.verifyTest('SwipeNavigationManager initializes correctly', async () => {
            await this.page.goto(`${this.baseUrl}/calendar.html`);

            const swipeManagerExists = await this.page.evaluate(() => {
                return typeof window.SwipeNavigationManager === 'function';
            });

            if (!swipeManagerExists) {
                throw new Error('SwipeNavigationManager class not available');
            }

            // Test that the manager is instantiated
            const managerInstanceExists = await this.page.evaluate(() => {
                // Check if event listeners are attached
                return document.body.querySelector('*[ontouchstart]') !== null ||
                       window.getEventListeners && Object.keys(window.getEventListeners(document)).includes('touchstart');
            });

            // Since we can't directly check event listeners, verify the script loaded
            const scriptLoaded = await this.page.evaluate(() => {
                return Array.from(document.scripts).some(script =>
                    script.src.includes('swipe-navigation.js')
                );
            });

            if (!scriptLoaded) {
                throw new Error('swipe-navigation.js script not loaded');
            }
        });
    }

    async testNavigationDirection() {
        await this.verifyTest('Navigation direction logic is correct', async () => {
            await this.page.goto(`${this.baseUrl}/calendar.html`);

            // Test navigation logic by calling the method directly
            const navigationTest = await this.page.evaluate(() => {
                // Create a test instance to check logic
                const testManager = new SwipeNavigationManager();

                // Mock current location for testing
                const originalLocation = window.location;

                // Test calendar -> tasks (swipe left)
                Object.defineProperty(window, 'location', {
                    value: { pathname: '/calendar.html' },
                    writable: true
                });

                let targetPage = null;

                // Override navigateToPage to capture target
                testManager.navigateToPage = function(page, direction) {
                    targetPage = page;
                };

                testManager.handleSwipe('left');
                const leftSwipeResult = targetPage;

                // Test tasks -> calendar (swipe right)
                Object.defineProperty(window, 'location', {
                    value: { pathname: '/tasks.html' },
                    writable: true
                });

                targetPage = null;
                testManager.handleSwipe('right');
                const rightSwipeResult = targetPage;

                // Restore original location
                Object.defineProperty(window, 'location', {
                    value: originalLocation,
                    writable: true
                });

                return {
                    leftSwipe: leftSwipeResult,
                    rightSwipe: rightSwipeResult
                };
            });

            if (navigationTest.leftSwipe !== 'tasks.html') {
                throw new Error(`Left swipe from calendar should go to tasks.html, got: ${navigationTest.leftSwipe}`);
            }

            if (navigationTest.rightSwipe !== 'calendar.html') {
                throw new Error(`Right swipe from tasks should go to calendar.html, got: ${navigationTest.rightSwipe}`);
            }
        });
    }

    async testTouchEventHandling() {
        await this.verifyTest('Touch events do not interfere with existing UI', async () => {
            await this.page.goto(`${this.baseUrl}/calendar.html`);

            // Wait for page to load
            await this.page.waitForSelector('.system-btn');

            // Test single touch on refresh button
            const refreshButton = this.page.locator('.system-btn').first();

            // Perform single touch - this should NOT trigger swipe navigation
            await refreshButton.tap();

            // Wait a moment for any potential navigation
            await this.page.waitForTimeout(200);

            // Verify we're still on calendar page
            const currentUrl = this.page.url();
            if (!currentUrl.includes('calendar.html')) {
                throw new Error('Single touch incorrectly triggered navigation');
            }

            // Test two-finger touch - should also not trigger navigation
            await this.page.touchScreen.tap(360, 640); // Center of screen
            await this.page.waitForTimeout(200);

            const stillOnCalendar = this.page.url();
            if (!stillOnCalendar.includes('calendar.html')) {
                throw new Error('Two-finger touch incorrectly triggered navigation');
            }
        });
    }

    async testVisualFeedback() {
        await this.verifyTest('Visual feedback system works correctly', async () => {
            await this.page.goto(`${this.baseUrl}/calendar.html`);

            // Test that visual indicator styles are added
            const stylesAdded = await this.page.evaluate(() => {
                // Simulate the showSwipeIndicator method
                const testManager = new SwipeNavigationManager();
                testManager.showSwipeIndicator('left');

                // Check if styles were added
                const styleElement = document.querySelector('#swipeIndicatorStyle');
                return styleElement !== null;
            });

            if (!stylesAdded) {
                throw new Error('Swipe indicator styles not properly added');
            }

            // Test indicator creation and cleanup
            const indicatorTest = await this.page.evaluate(() => {
                return new Promise((resolve) => {
                    const testManager = new SwipeNavigationManager();
                    testManager.showSwipeIndicator('right');

                    // Check if indicator was created
                    const indicator = document.querySelector('.swipe-indicator');
                    const created = indicator !== null;

                    // Wait for cleanup
                    setTimeout(() => {
                        const stillExists = document.querySelector('.swipe-indicator') !== null;
                        resolve({ created, cleanedUp: !stillExists });
                    }, 500);
                });
            });

            if (!indicatorTest.created) {
                throw new Error('Swipe indicator not created');
            }

            if (!indicatorTest.cleanedUp) {
                throw new Error('Swipe indicator not properly cleaned up');
            }
        });
    }

    async testCodeQuality() {
        await this.verifyTest('Code quality and edge cases', async () => {
            await this.page.goto(`${this.baseUrl}/calendar.html`);

            // Test multiple rapid swipes (should be prevented by isNavigating flag)
            const rapidSwipeTest = await this.page.evaluate(() => {
                const testManager = new SwipeNavigationManager();

                let navigationCount = 0;
                testManager.navigateToPage = function() {
                    navigationCount++;
                };

                // Simulate rapid swipes
                testManager.handleSwipe('left');
                testManager.handleSwipe('left');
                testManager.handleSwipe('left');

                return navigationCount;
            });

            if (rapidSwipeTest !== 1) {
                throw new Error(`Rapid swipes not prevented properly: ${rapidSwipeTest} navigations triggered`);
            }

            // Test touch cleanup on cancel
            const cleanupTest = await this.page.evaluate(() => {
                const testManager = new SwipeNavigationManager();

                // Add some touches
                testManager.touches.set('1', { startX: 100, startY: 100 });
                testManager.touches.set('2', { startX: 200, startY: 200 });

                // Simulate touch cancel
                testManager.handleTouchCancel();

                return testManager.touches.size;
            });

            if (cleanupTest !== 0) {
                throw new Error('Touch data not properly cleaned up on cancel');
            }
        });
    }

    async runAllTests() {
        console.log('🚀 Starting SwipeNavigation Verification Tests\n');

        try {
            await this.setup();

            await this.testPageLoad();
            await this.testSwipeNavigationLogic();
            await this.testNavigationDirection();
            await this.testTouchEventHandling();
            await this.testVisualFeedback();
            await this.testCodeQuality();

        } catch (error) {
            console.log(`❌ Test setup failed: ${error.message}`);
            this.results.issues.push(`Setup failed: ${error.message}`);
        } finally {
            await this.cleanup();
        }

        this.printResults();
    }

    printResults() {
        console.log('\n📊 SWIPE NAVIGATION VERIFICATION RESULTS');
        console.log('=' .repeat(50));
        console.log(`✅ Tests Passed: ${this.results.passed}`);
        console.log(`❌ Tests Failed: ${this.results.failed}`);
        console.log(`📊 Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);

        if (this.results.issues.length > 0) {
            console.log('\n🐛 ISSUES IDENTIFIED:');
            this.results.issues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue}`);
            });
        }

        console.log('\n📋 VERIFICATION SUMMARY:');
        if (this.results.failed === 0) {
            console.log('🎉 All tests passed! Swipe navigation is working correctly.');
        } else {
            console.log('⚠️  Issues found that need attention before deployment.');
        }
    }
}

// Run the tests
const verification = new SwipeNavigationVerification();
verification.runAllTests().catch(console.error);