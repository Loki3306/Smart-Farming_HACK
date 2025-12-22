/**
 * Quick Test Script for Session Persistence Fix
 * 
 * Run this in the browser console (F12) to verify the fix
 */

// 1. Check if localStorage has all required data
function checkStorageStatus() {
  console.log('=== CHECKING LOCALSTORAGE STATUS ===');
  const token = localStorage.getItem('auth_token');
  const userId = localStorage.getItem('user_id');
  const userStr = localStorage.getItem('current_user');
  const onboardingFlag = localStorage.getItem('onboarding_completed');
  
  console.log({
    'auth_token': token ? '✅ EXISTS' : '❌ MISSING',
    'user_id': userId || '❌ MISSING',
    'current_user': userStr ? '✅ EXISTS' : '❌ MISSING',
    'onboarding_completed': onboardingFlag || '❌ NOT SET'
  });
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log('User object:', {
        id: user.id,
        fullName: user.fullName,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        phone: user.phone
      });
    } catch (e) {
      console.error('Failed to parse current_user:', e);
    }
  }
  
  return {
    token: !!token,
    userId: !!userId,
    user: !!userStr,
    onboarding: onboardingFlag === 'true'
  };
}

// 2. Simulate what happens on page refresh
function simulatePageRefresh() {
  console.log('=== SIMULATING PAGE REFRESH ===');
  const status = checkStorageStatus();
  
  if (status.onboarding && status.user) {
    console.log('✅ GOOD: User has completed onboarding AND data is cached');
    console.log('→ Should redirect to /dashboard (NOT /onboarding)');
  } else if (!status.onboarding && status.user) {
    console.log('❌ BAD: User NOT marked as completed onboarding');
    console.log('→ This will redirect back to /onboarding');
  } else if (!status.user) {
    console.log('❌ BAD: No cached user data');
    console.log('→ This will redirect to /login');
  }
}

// 3. Clear all session data (for fresh start)
function clearSession() {
  console.log('Clearing all session data...');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('current_user');
  localStorage.removeItem('onboarding_completed');
  console.log('✅ Session cleared. Please refresh page and sign up again.');
}

// 4. Test the fix end-to-end
function testFix() {
  console.log('=== RUNNING SESSION PERSISTENCE TEST ===');
  
  const status = checkStorageStatus();
  
  console.log('\nTest Results:');
  console.log(`1. Auth token exists: ${status.token ? '✅' : '❌'}`);
  console.log(`2. User ID exists: ${status.userId ? '✅' : '❌'}`);
  console.log(`3. User object cached: ${status.user ? '✅' : '❌'}`);
  console.log(`4. Onboarding completed: ${status.onboarding ? '✅' : '❌'}`);
  
  const allGood = status.token && status.userId && status.user && status.onboarding;
  
  console.log(`\nOverall: ${allGood ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allGood) {
    console.log('\n✅ Fix is working! Try:');
    console.log('1. Refresh the page (F5)');
    console.log('2. You should stay on /dashboard (not redirect to /onboarding)');
  } else {
    console.log('\n❌ Fix is not working. Debug:');
    if (!status.token) console.log('- Auth token missing - login might have failed');
    if (!status.user) console.log('- User not cached - page cache issue');
    if (!status.onboarding) console.log('- Onboarding flag not set - markOnboardingComplete() not called?');
  }
  
  return allGood;
}

// Make functions available globally
window.checkStorageStatus = checkStorageStatus;
window.simulatePageRefresh = simulatePageRefresh;
window.clearSession = clearSession;
window.testFix = testFix;

console.log('=== SESSION TEST FUNCTIONS LOADED ===');
console.log('Available commands:');
console.log('- checkStorageStatus()      : Check what\'s in localStorage');
console.log('- simulatePageRefresh()     : See if page refresh would work');
console.log('- testFix()                 : Run complete test');
console.log('- clearSession()            : Clear all session data');
