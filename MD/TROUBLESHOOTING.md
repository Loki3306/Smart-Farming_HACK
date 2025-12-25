# Smart Farming - Session/Login Troubleshooting Guide

## Issue: Redirected to Onboarding After Login

If you're being redirected to onboarding even though you've already completed it, here are the troubleshooting steps:

### 1. **Check Browser Developer Console**
1. Open DevTools: `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
2. Go to **Console** tab
3. Look for the `=== SESSION DEBUG INFO ===` block after login
4. Check if localStorage is working:
   - `auth_token`: Should show "EXISTS"
   - `user_id`: Should show a UUID
   - `current_user`: Should show "EXISTS"
   - `onboarding_completed`: Should show "true" if you completed onboarding

### 2. **Check localStorage Directly**
In the Console, run:
```javascript
console.log({
  auth_token: localStorage.getItem('auth_token'),
  user_id: localStorage.getItem('user_id'),
  current_user: localStorage.getItem('current_user'),
  onboarding_completed: localStorage.getItem('onboarding_completed')
});
```

### 3. **Common Causes & Solutions**

#### **Problem: All localStorage values are null/missing**
- **Cause**: Browser private/incognito mode disables localStorage
- **Solution**: Use normal browsing mode (not private/incognito)

#### **Problem: localStorage is empty after login**
- **Cause**: Browser cookies/storage disabled
- **Solution**:
  - Chrome: Settings → Privacy & Security → Cookies and other site data → Allow all cookies
  - Firefox: Preferences → Privacy → Cookies and Site Data → Allow all
  - Safari: Preferences → Privacy → Websites → Cookies → Allow from websites you visit

#### **Problem: `onboarding_completed` is not set**
- **Cause**: Farm data not found in database
- **Solution**: 
  1. Re-complete the onboarding flow
  2. Fill in all required farm details in the FarmOnboarding page
  3. Click "Complete Onboarding" button

#### **Problem: Login successful but immediately redirected to login page**
- **Cause**: Session token not being saved correctly
- **Solution**:
  1. Hard refresh page: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
  2. Clear browser cache and cookies for this domain
  3. Try logging in again

### 4. **Clear Browser Cache**
Sometimes stale cache causes issues:

**Chrome:**
1. DevTools → Application → Storage
2. Click "Clear site data"
3. Or: Settings → Privacy & Security → Clear browsing data → Clear data

**Firefox:**
1. DevTools → Storage
2. Click "Delete All" for cookies and cache
3. Or: Preferences → Privacy → Clear Recent History

**Safari:**
1. Preferences → Privacy → Manage Website Data
2. Find the domain and click "Remove"

### 5. **Test the Debug Function**
In the Console, run:
```javascript
// This will log detailed session info
AuthService.debugSessionStatus()
```

### 6. **Check Network Tab**
1. Open DevTools → Network tab
2. Login again
3. Look for the login request
4. Check the Response tab to see what data the server is sending
5. Verify it includes user data with `hasCompletedOnboarding: true`

### 7. **Database Check**
If your farm data isn't found:
1. Log in to Supabase Dashboard
2. Go to SQL Editor
3. Run:
```sql
SELECT * FROM farms WHERE farmer_id = 'YOUR_USER_ID';
```
4. If no results, you need to re-complete onboarding and create a farm

### 8. **Still Not Working?**

Share the following information with the developer:

1. **Browser name and version**: (e.g., Chrome 120.0)
2. **Operating System**: (Windows/Mac/Linux)
3. **Console logs**: Take a screenshot of the SESSION DEBUG INFO
4. **localStorage contents**: Run the command in step 2 above and share output
5. **Are you using**: Private/Incognito mode?

### 9. **Quick Workaround**
If you need immediate access:
1. Click "Skip as Demo User" button on login page
2. You'll get demo account access
3. Once proper session is fixed, log in with your account

---

## Session Persistence Changes (Developer Notes)

### Fixed in Latest Version:
✅ localStorage persistence now more robust  
✅ Fallback if auth_token missing but cache exists  
✅ Onboarding status properly synced  
✅ Better error handling for storage failures  
✅ Debug logging for troubleshooting  

### Key Changes:
- `getCurrentUser()` now prioritizes cached user data
- Login/Signup explicitly stores auth data directly in localStorage
- Logout properly clears all session data
- Better error handling for localStorage unavailable
