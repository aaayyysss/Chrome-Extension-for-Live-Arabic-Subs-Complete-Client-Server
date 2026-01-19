# 🔧 Emergency Fix Guide - Rolling Back to Working Version

## Current Status
The recent enhancements broke the core functionality. Here's how to restore working functionality:

## 🔴 Critical Issues Identified
1. **Overlay not showing** - Content script changes broke overlay creation
2. **No translations** - Message passing between components failing
3. **Audio not preserved** - Offscreen document changes affected audio capture

## 🛠️ Fix Instructions

### Step 1: Test Current State
1. Open `debug_diagnostics.html` in Chrome
2. Run all diagnostic tests
3. Note which components are failing

### Step 2: Replace Problematic Files

**Replace `extension/content/content.js` with `minimal_content.js`:**
```bash
cp minimal_content.js extension/content/content.js
```

**Replace `extension/offscreen/offscreen.js` with `rollback_offscreen.js`:**
```bash
cp rollback_offscreen.js extension/offscreen/offscreen.js
```

### Step 3: Reload Extension
1. Go to `chrome://extensions/`
2. Find "Live Arabic Subs"
3. Click the reload icon
4. Test basic functionality

### Step 4: Verify Working State
1. Open any webpage with video
2. Click extension icon
3. Click "Start Capture"
4. Verify:
   - ✅ Overlay appears at bottom center
   - ✅ Shows "Recording started..." text
   - ✅ Video audio continues playing
   - ✅ Can stop capture successfully

## 📋 Testing Checklist

### Basic Functionality
- [ ] Extension installs without errors
- [ ] Overlay appears when capture starts
- [ ] Overlay disappears when capture stops
- [ ] Video audio plays normally during capture
- [ ] Extension icon shows recording state

### Advanced Testing
- [ ] Backend API receives audio chunks
- [ ] Translations appear in overlay
- [ ] Settings persist between sessions
- [ ] Works on YouTube/Netflix/etc.

## ⚠️ Known Limitations of Rollback Version
- No enhanced dragging features
- No visual feedback notifications
- Basic styling only
- No double-click reset functionality

## 🎯 Next Steps After Restoration
Once basic functionality is restored:
1. Gradually reintroduce enhanced features
2. Test each enhancement individually
3. Monitor console logs for errors
4. Ensure backward compatibility

## 🆘 Emergency Contact
If issues persist:
1. Check browser console for errors (F12)
2. Check background script console in extensions page
3. Verify backend API is accessible
4. Test with minimal HTML page first

## Files Backup Location
All original files backed up in: `backup_fix_attempt/`

---

**Important:** This rollback prioritizes restoring basic functionality over advanced features. We can rebuild the enhancements once the core system is stable.