// DEBUG VERSION - Minimal working content script
(function() {
  'use strict';

  // Prevent multiple injections
  if (window.__liveArabicSubsInjected) return;
  window.__liveArabicSubsInjected = true;

  let overlay = null;
  let isCapturing = false;

  // Simple overlay creation
  function createOverlay() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.id = 'live-arabic-subs-overlay';
    overlay.style.cssText = `
      position: fixed;
      bottom: 60px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483647;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(12px);
      border-radius: 12px;
      padding: 16px 24px;
      color: #F5C518;
      font-size: 24px;
      font-family: Arial, sans-serif;
      text-align: center;
      min-width: 300px;
      max-width: 800px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    `;

    overlay.innerHTML = `
      <div style="color: #a1a1aa; font-size: 14px; margin-bottom: 8px;">DEBUG MODE</div>
      <div id="english-text" style="color: #a1a1aa; font-size: 14px; margin-bottom: 8px;"></div>
      <div id="arabic-text" style="direction: rtl;">Click extension to start</div>
    `;

    document.body.appendChild(overlay);
    console.log('[DEBUG] Overlay created');
  }

  function showOverlay() {
    if (!overlay) createOverlay();
    overlay.style.display = 'block';
  }

  function hideOverlay() {
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  function updateSubtitles(english, arabic) {
    if (!overlay) createOverlay();
    
    const englishEl = document.getElementById('english-text');
    const arabicEl = document.getElementById('arabic-text');
    
    if (englishEl) englishEl.textContent = english || '';
    if (arabicEl) arabicEl.textContent = arabic || 'Listening...';
    
    console.log('[DEBUG] Subtitles updated:', { english, arabic });
  }

  function setRecordingState(recording) {
    isCapturing = recording;
    if (recording) {
      showOverlay();
      updateSubtitles('', 'Recording started...');
    } else {
      updateSubtitles('', 'Recording stopped');
    }
  }

  // Message listener
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[DEBUG] Received message:', message);
    
    switch (message.type) {
      case 'UPDATE_SUBTITLES':
        updateSubtitles(message.english, message.arabic);
        sendResponse({ success: true });
        break;
        
      case 'START_CAPTURE':
        setRecordingState(true);
        sendResponse({ success: true });
        break;
        
      case 'STOP_CAPTURE':
        setRecordingState(false);
        sendResponse({ success: true });
        break;
        
      case 'SHOW_OVERLAY':
        showOverlay();
        sendResponse({ success: true });
        break;
        
      case 'HIDE_OVERLAY':
        hideOverlay();
        sendResponse({ success: true });
        break;
    }
    
    return true;
  });

  // Initialize
  createOverlay();
  
  // Test message to background
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
    console.log('[DEBUG] Initial state response:', response);
    if (response && response.isCapturing) {
      setRecordingState(true);
    }
  });

  console.log('[DEBUG] Content script initialized');
})();