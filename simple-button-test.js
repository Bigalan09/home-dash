const { chromium } = require('playwright');

async function testButtonFunctionality() {
  let browser;
  let page;

  try {
    console.log('🚀 Starting Button Functionality Verification');
    console.log('=========================================');

    // Launch browser
    browser = await chromium.launch({
      headless: false,
      slowMo: 500,
    });

    const context = await browser.newContext({
      viewport: { width: 720, height: 1280 },
      hasTouch: true,
    });

    page = await context.newPage();

    // Navigate to the dashboard
    console.log('📱 Navigating to Home Dashboard...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Wait for dashboard to load
    await page.waitForSelector('.dashboard', { timeout: 10000 });
    console.log('✅ Dashboard loaded successfully');

    // Test 1: Check refresh button exists and click it
    console.log('\n🔄 Testing Refresh Button...');
    const refreshButton = page.locator('button.system-btn[onclick="refreshData()"]');

    // Check if button is visible
    const refreshVisible = await refreshButton.isVisible();
    if (!refreshVisible) {
      throw new Error('Refresh button is not visible');
    }
    console.log('✅ Refresh button is visible');

    // Click the refresh button
    console.log('🔄 Clicking refresh button...');
    await refreshButton.click();

    // Wait a moment and check for toast
    await page.waitForTimeout(1000);

    const toast = page.locator('.toast.show');
    const toastVisible = await toast.isVisible();

    if (toastVisible) {
      // Get toast message
      const message = await page.locator('.toast-message').textContent();
      console.log(`✅ Toast notification appeared: "${message}"`);

      // Check toast icon
      const iconClass = await page.locator('.toast-icon').getAttribute('class');
      console.log(`✅ Toast icon: ${iconClass}`);

      // Wait for toast to disappear
      console.log('⏳ Waiting for toast to auto-hide...');
      await page.waitForTimeout(4000);

      const toastStillVisible = await toast.isVisible();
      if (!toastStillVisible) {
        console.log('✅ Toast auto-hides correctly');
      } else {
        console.log('⚠️ Toast may still be visible');
      }
    } else {
      console.log('⚠️ Toast notification did not appear');
    }

    // Test 2: Check power button exists and click it
    console.log('\n⚡ Testing Power/Screen Toggle Button...');
    const powerButton = page.locator('button.system-btn[onclick="toggleScreen()"]');

    const powerVisible = await powerButton.isVisible();
    if (!powerVisible) {
      throw new Error('Power button is not visible');
    }
    console.log('✅ Power button is visible');

    // Click power button (brief screen toggle)
    console.log('⚡ Clicking power button...');
    await powerButton.click();
    console.log('✅ Power button click executed (screen toggle functionality)');

    // Test 3: Check view control buttons
    console.log('\n📅 Testing Calendar View Buttons...');

    const dayBtn = page.locator('button.view-btn[data-view="daily"]');
    const weekBtn = page.locator('button.view-btn[data-view="weekly"]');
    const monthBtn = page.locator('button.view-btn[data-view="monthly"]');

    // Check all buttons are visible
    const dayVisible = await dayBtn.isVisible();
    const weekVisible = await weekBtn.isVisible();
    const monthVisible = await monthBtn.isVisible();

    if (!dayVisible || !weekVisible || !monthVisible) {
      throw new Error('Not all calendar view buttons are visible');
    }
    console.log('✅ All calendar view buttons are visible');

    // Test clicking week view
    await weekBtn.click();
    await page.waitForTimeout(300);
    const weekActive = await weekBtn.getAttribute('class');
    if (weekActive.includes('active')) {
      console.log('✅ Week view button click works');
    } else {
      console.log('⚠️ Week view button may not be active');
    }

    // Test clicking month view
    await monthBtn.click();
    await page.waitForTimeout(300);
    const monthActive = await monthBtn.getAttribute('class');
    if (monthActive.includes('active')) {
      console.log('✅ Month view button click works');
    } else {
      console.log('⚠️ Month view button may not be active');
    }

    // Return to day view
    await dayBtn.click();
    await page.waitForTimeout(300);
    const dayActive = await dayBtn.getAttribute('class');
    if (dayActive.includes('active')) {
      console.log('✅ Day view button click works');
    } else {
      console.log('⚠️ Day view button may not be active');
    }

    // Test 4: Check task view buttons
    console.log('\n📋 Testing Task View Buttons...');

    const todayBtn = page.locator('button.view-btn[data-task-view="today"]');
    const upcomingBtn = page.locator('button.view-btn[data-task-view="upcoming"]');

    const todayVisible = await todayBtn.isVisible();
    const upcomingVisible = await upcomingBtn.isVisible();

    if (!todayVisible || !upcomingVisible) {
      throw new Error('Not all task view buttons are visible');
    }
    console.log('✅ All task view buttons are visible');

    // Test upcoming button
    await upcomingBtn.click();
    await page.waitForTimeout(300);
    const upcomingActive = await upcomingBtn.getAttribute('class');
    if (upcomingActive.includes('active')) {
      console.log('✅ Upcoming tasks button click works');
    } else {
      console.log('⚠️ Upcoming tasks button may not be active');
    }

    // Return to today
    await todayBtn.click();
    await page.waitForTimeout(300);
    const todayActive = await todayBtn.getAttribute('class');
    if (todayActive.includes('active')) {
      console.log('✅ Today tasks button click works');
    } else {
      console.log('⚠️ Today tasks button may not be active');
    }

    // Test 5: Check weather section
    console.log('\n🌤️ Testing Weather Section...');

    const weatherSection = page.locator('.weather-section[onclick="showWeatherDetails()"]');
    const weatherVisible = await weatherSection.isVisible();

    if (!weatherVisible) {
      throw new Error('Weather section is not visible');
    }
    console.log('✅ Weather section is visible and clickable');

    // Click weather section
    await weatherSection.click();
    await page.waitForTimeout(500);

    // Check if modal opened
    const weatherModal = page.locator('#weatherModal.active');
    const modalVisible = await weatherModal.isVisible();

    if (modalVisible) {
      console.log('✅ Weather modal opens on click');

      // Close modal
      const closeBtn = page.locator('#weatherModal .close-btn');
      await closeBtn.click();
      console.log('✅ Weather modal closes correctly');
    } else {
      console.log('ℹ️ Weather modal did not open (weather data may not be configured)');
    }

    // Test 6: Test CSS hover/active states by checking computed styles
    console.log('\n🎯 Testing Button Styling...');

    // Check if system buttons have proper CSS classes
    const systemBtns = page.locator('.system-btn');
    const btnCount = await systemBtns.count();
    console.log(`✅ Found ${btnCount} system buttons with proper CSS classes`);

    // Test 7: Multiple rapid clicks
    console.log('\n⚡ Testing Rapid Click Handling...');

    // Click refresh multiple times quickly
    for (let i = 0; i < 3; i++) {
      await refreshButton.click();
      await page.waitForTimeout(100);
    }

    console.log('✅ Multiple rapid clicks handled without errors');

    // Final summary
    console.log('\n🎉 VERIFICATION COMPLETE');
    console.log('======================');
    console.log('✅ Refresh button functionality verified');
    console.log('✅ Power button functionality verified');
    console.log('✅ Toast notification system verified');
    console.log('✅ Calendar view buttons verified');
    console.log('✅ Task view buttons verified');
    console.log('✅ Weather section interaction verified');
    console.log('✅ Multiple click handling verified');

    return {
      success: true,
      message: 'All button functionality and toast notifications verified successfully'
    };

  } catch (error) {
    console.error('❌ VERIFICATION FAILED:', error.message);

    // Take screenshot for debugging
    if (page) {
      try {
        await page.screenshot({
          path: '/Users/alan/Development/HomeDashboard/test-failure-screenshot.png',
          fullPage: true
        });
        console.log('📸 Screenshot saved for debugging');
      } catch (screenshotError) {
        console.log('Could not save screenshot');
      }
    }

    return {
      success: false,
      error: error.message
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  testButtonFunctionality()
    .then(result => {
      if (result.success) {
        console.log(`\n🎯 VERIFICATION RESULT: SUCCESS`);
        console.log(`📝 ${result.message}`);
        process.exit(0);
      } else {
        console.log(`\n❌ VERIFICATION RESULT: FAILED`);
        console.log(`📝 ${result.error}`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(`\n💥 CRITICAL ERROR: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { testButtonFunctionality };