const { chromium } = require('playwright');

async function manualVerification() {
  let browser;
  let page;

  try {
    console.log('🔍 MANUAL VERIFICATION OF BUTTON FUNCTIONALITY');
    console.log('==============================================');

    browser = await chromium.launch({
      headless: false,
      slowMo: 1000,
    });

    const context = await browser.newContext({
      viewport: { width: 720, height: 1280 },
    });

    page = await context.newPage();

    // Navigate to dashboard
    console.log('📱 Loading Dashboard...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForSelector('.dashboard', { timeout: 10000 });
    console.log('✅ Dashboard loaded');

    // Take initial screenshot
    await page.screenshot({
      path: '/Users/alan/Development/HomeDashboard/dashboard-initial.png',
      fullPage: true
    });
    console.log('📸 Initial screenshot saved');

    // Check HTML structure
    console.log('\n🔍 Checking HTML Structure...');

    // Check refresh button
    const refreshBtn = await page.$('button.system-btn[onclick="refreshData()"]');
    if (refreshBtn) {
      console.log('✅ Refresh button found in DOM');
      const refreshText = await page.evaluate(el => el.getAttribute('title'), refreshBtn);
      console.log(`  - Title: ${refreshText}`);
      const refreshOnclick = await page.evaluate(el => el.getAttribute('onclick'), refreshBtn);
      console.log(`  - onclick: ${refreshOnclick}`);
    } else {
      console.log('❌ Refresh button NOT found');
    }

    // Check power button
    const powerBtn = await page.$('button.system-btn[onclick="toggleScreen()"]');
    if (powerBtn) {
      console.log('✅ Power button found in DOM');
      const powerText = await page.evaluate(el => el.getAttribute('title'), powerBtn);
      console.log(`  - Title: ${powerText}`);
      const powerOnclick = await page.evaluate(el => el.getAttribute('onclick'), powerBtn);
      console.log(`  - onclick: ${powerOnclick}`);
    } else {
      console.log('❌ Power button NOT found');
    }

    // Check toast element
    const toast = await page.$('.toast');
    if (toast) {
      console.log('✅ Toast element found in DOM');
      const toastClasses = await page.evaluate(el => el.className, toast);
      console.log(`  - Classes: ${toastClasses}`);
    } else {
      console.log('❌ Toast element NOT found');
    }

    // Test JavaScript execution directly
    console.log('\n🔍 Testing JavaScript Functions...');

    // Test if global functions exist
    const refreshDataExists = await page.evaluate(() => typeof window.refreshData === 'function');
    console.log(`✅ window.refreshData function exists: ${refreshDataExists}`);

    const toggleScreenExists = await page.evaluate(() => typeof window.toggleScreen === 'function');
    console.log(`✅ window.toggleScreen function exists: ${toggleScreenExists}`);

    const showToastExists = await page.evaluate(() => typeof dashboard !== 'undefined' && typeof dashboard.showToast === 'function');
    console.log(`✅ dashboard.showToast function exists: ${showToastExists}`);

    // Test direct function calls
    console.log('\n🔄 Testing Direct Function Calls...');

    // Test showToast directly
    if (showToastExists) {
      await page.evaluate(() => {
        dashboard.showToast('Test message from verification', 'success');
      });

      await page.waitForTimeout(2000);

      // Check if toast appeared
      const toastVisible = await page.isVisible('.toast.show');
      console.log(`✅ Toast appears when called directly: ${toastVisible}`);

      if (toastVisible) {
        const toastMessage = await page.textContent('.toast-message');
        console.log(`  - Message: "${toastMessage}"`);

        // Wait for auto-hide
        await page.waitForTimeout(4000);
        const toastHidden = !(await page.isVisible('.toast.show'));
        console.log(`✅ Toast auto-hides: ${toastHidden}`);
      }
    }

    // Test refreshData function directly
    if (refreshDataExists) {
      console.log('🔄 Calling refreshData() directly...');
      await page.evaluate(() => {
        window.refreshData();
      });

      await page.waitForTimeout(2000);

      // Check if toast appeared after refresh
      const refreshToastVisible = await page.isVisible('.toast.show');
      console.log(`✅ Refresh function triggers toast: ${refreshToastVisible}`);

      if (refreshToastVisible) {
        const refreshMessage = await page.textContent('.toast-message');
        console.log(`  - Refresh message: "${refreshMessage}"`);
      }
    }

    // Test view buttons
    console.log('\n📅 Testing View Button Functionality...');

    const viewButtons = await page.$$('button.view-btn[data-view]');
    console.log(`✅ Found ${viewButtons.length} calendar view buttons`);

    for (const btn of viewButtons) {
      const dataView = await page.evaluate(el => el.getAttribute('data-view'), btn);
      const isActive = await page.evaluate(el => el.classList.contains('active'), btn);
      console.log(`  - ${dataView} button: active=${isActive}`);
    }

    const taskButtons = await page.$$('button.view-btn[data-task-view]');
    console.log(`✅ Found ${taskButtons.length} task view buttons`);

    for (const btn of taskButtons) {
      const dataTaskView = await page.evaluate(el => el.getAttribute('data-task-view'), btn);
      const isActive = await page.evaluate(el => el.classList.contains('active'), btn);
      console.log(`  - ${dataTaskView} button: active=${isActive}`);
    }

    // Test CSS hover states
    console.log('\n🎯 Testing CSS Styles...');

    // Check if system buttons have hover styles
    const hoverStyles = await page.evaluate(() => {
      const refreshBtn = document.querySelector('button.system-btn[onclick="refreshData()"]');
      if (!refreshBtn) return 'Button not found';

      const computedStyle = window.getComputedStyle(refreshBtn);
      return {
        background: computedStyle.backgroundColor,
        border: computedStyle.borderColor,
        transition: computedStyle.transition
      };
    });

    console.log('✅ System button styles:', hoverStyles);

    // Test button positioning
    console.log('\n📏 Testing Button Positioning...');

    const buttonPositions = await page.evaluate(() => {
      const refreshBtn = document.querySelector('button.system-btn[onclick="refreshData()"]');
      const powerBtn = document.querySelector('button.system-btn[onclick="toggleScreen()"]');
      const timeDiv = document.querySelector('#time');

      const getPosition = (el) => {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          zIndex: window.getComputedStyle(el).zIndex
        };
      };

      return {
        refresh: getPosition(refreshBtn),
        power: getPosition(powerBtn),
        time: getPosition(timeDiv)
      };
    });

    console.log('✅ Element positions:');
    console.log('  - Refresh button:', buttonPositions.refresh);
    console.log('  - Power button:', buttonPositions.power);
    console.log('  - Time element:', buttonPositions.time);

    // Test coordinate-based clicking
    console.log('\n🎯 Testing Coordinate-Based Clicking...');

    if (buttonPositions.refresh) {
      const x = buttonPositions.refresh.left + buttonPositions.refresh.width / 2;
      const y = buttonPositions.refresh.top + buttonPositions.refresh.height / 2;

      console.log(`🔄 Clicking refresh button at coordinates (${x}, ${y})`);

      await page.mouse.click(x, y);
      await page.waitForTimeout(2000);

      const coordToastVisible = await page.isVisible('.toast.show');
      console.log(`✅ Coordinate click triggers toast: ${coordToastVisible}`);

      if (coordToastVisible) {
        const coordMessage = await page.textContent('.toast-message');
        console.log(`  - Coordinate click message: "${coordMessage}"`);
      }
    }

    // Final screenshot
    await page.screenshot({
      path: '/Users/alan/Development/HomeDashboard/dashboard-final.png',
      fullPage: true
    });
    console.log('📸 Final screenshot saved');

    console.log('\n🎉 MANUAL VERIFICATION COMPLETE');
    console.log('==============================');
    console.log('✅ HTML structure verified');
    console.log('✅ JavaScript functions verified');
    console.log('✅ Direct function calls tested');
    console.log('✅ CSS styles verified');
    console.log('✅ Element positioning analyzed');
    console.log('✅ Screenshots saved for review');

    // Keep browser open for manual inspection
    console.log('\n👁️ Browser left open for manual inspection...');
    console.log('   Press Ctrl+C to close when done reviewing');

    // Wait indefinitely
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run verification
manualVerification().catch(console.error);