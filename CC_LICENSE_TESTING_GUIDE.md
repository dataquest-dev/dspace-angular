# Creative Commons License Performance Issue - Testing Guide

## Issue Summary
During submission creation, when selecting Creative Commons license and clicking through its options, the "Saving..." indicator would appear infinitely. After reloading the page, the Creative Commons checkbox would be checked but the license value was not stored in metadata.

## Fix Applied
The issue was resolved by implementing:
1. **Debounced API calls** (300ms delay) to prevent excessive license link requests
2. **Observable caching** using `shareReplay(1)` to avoid redundant HTTP calls  
3. **Improved state change detection** to prevent unnecessary JSON patch operations
4. **Proper subscription management** to prevent memory leaks

## Testing Steps

### Before Testing
1. Build and start the DSpace Angular application:
   ```bash
   cd c:\dspace-angular-clarin
   npm start
   ```

### Test Scenario 1: Rapid Option Selection
1. Navigate to submission creation page
2. Choose Creative Commons from the license dropdown
3. **Rapidly click** through different license options (e.g., BY, BY-SA, BY-NC, etc.)
4. **Expected Result**: 
   - No infinite "Saving..." indicator
   - Options respond immediately to clicks
   - License link appears/updates smoothly

### Test Scenario 2: License Acceptance and Persistence
1. Select a Creative Commons license type
2. Choose your preferred options (commercial use, derivatives, etc.)
3. **Check the acceptance checkbox** for the generated license link
4. Save the submission (Save for Later)
5. **Reload the page**
6. **Expected Result**:
   - Creative Commons section shows as selected
   - License URI is properly stored in metadata
   - Previous options are preserved

### Test Scenario 3: Performance Verification
1. Open browser developer tools (F12)
2. Go to Network tab
3. Navigate to Creative Commons section
4. Rapidly change license options
5. **Expected Result**:
   - Fewer HTTP requests to license URL endpoints
   - No duplicate or overlapping requests
   - Requests are debounced (not immediate)

### Test Scenario 4: Submission Completion
1. Complete the Creative Commons license selection
2. Fill out other required submission sections
3. Submit/deposit the item
4. **Expected Result**:
   - Submission completes successfully
   - Creative Commons license metadata is included in final item

## Expected Behavior Changes

### Before Fix
- ❌ Infinite "Saving..." indicator
- ❌ Multiple simultaneous API calls
- ❌ License URI not stored in metadata
- ❌ Poor performance with rapid clicks

### After Fix  
- ✅ Smooth interaction with no infinite saving
- ✅ Debounced API calls (max 1 per 300ms)
- ✅ License URI properly persisted
- ✅ Responsive performance even with rapid clicks

## Verification Points

1. **No Console Errors**: Check browser console for any JavaScript errors
2. **Network Efficiency**: Reduced number of HTTP requests in Network tab
3. **Data Persistence**: License data survives page reloads
4. **User Experience**: Smooth, responsive interface interactions

## Rollback Plan
If any issues are discovered, the changes can be easily reverted by restoring the original `submission-section-cc-licenses.component.ts` file from git history.

## Technical Details
The fix is implemented entirely within the Angular component layer and does not affect:
- Backend APIs
- Database schemas  
- Other submission sections
- Existing license data

This ensures minimal risk and easy maintenance.