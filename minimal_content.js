/**
 * Live Arabic Subs - Content Script (MINIMAL WORKING VERSION)
 * Rollback to basic working functionality
 */

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.__liveArabicSubsInjected) return;
  window.__liveArabicSubsInjected = true;

  // Default settings
  let settings = {
    fontSize: 28,
    fontFamily: 'Arial',
    fontColor: '#F5C518',
    bgOpacity: 0.85,
    showEnglish: true,
    englishFontSize: 14,
    englishColor: '#a1a1aa',
    lineHeight: 1.6,
    maxWidth: 800
  };

  let overlay = null;
  let isCapturing = false;

  // Load settings from storage
  chrome.storage.sync.get(['lasSettings'], (result) => {
    if (result.lasSettings) {
      settings = { ...settings, ...result.lasSettings };
    }
  });

  // Create the overlay element
  function createOverlay() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.id = 'live-arabic-subs-overlay';
    overlay.className = 'hidden';
    overlay.innerHTML = `
      <div style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; margin-bottom: 8px; font-size: 12px;">
        Live Arabic Subs
      </div>
      <div class="las-english-text" style="color: ${settings.englishColor}; font-size: ${settings.englishFontSize}px; margin-bottom: 8px;"></div>
      <div class="las-arabic-text" style="color: ${settings.fontColor}; font-size: ${settings.fontSize}px; direction: rtl;">
        Click extension icon to start
      </div>
    `;

    // Apply basic styles
    Object.assign(overlay.style, {
      position: 'fixed',
      bottom: '60px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '2147483647',
      background: `rgba(0, 0, 0, ${settings.bgOpacity})`,
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
      padding: '16px 24px',
      minWidth: '300px',
      maxWidth: `${settings.maxWidth}px`,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      fontFamily: settings.fontFamily,
      textAlign: 'center'
    });

    document.body.appendChild(overlay);
    console.log('[Content] Overlay created');
  }

  // Show/hide overlay
  function showOverlay() {
    if (!overlay) createOverlay();
    overlay.classList.remove('hidden');
  }

  function hideOverlay() {
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  // Update subtitles
  function updateSubtitles(english, arabic) {
    if (!overlay) createOverlay();

    const englishEl = overlay.querySelector('.las-english-text');
    const arabicEl = overlay.querySelector('.las-arabic-text');

    if (englishEl) {
      englishEl.textContent = english || '';
      englishEl.style.display = settings.showEnglish ? 'block' : 'none';
    }

    if (arabicEl) {
      arabicEl.textContent = arabic || (isCapturing ? 'Listening...' : 'Click extension icon to start');
    }
  }

  // Update recording state
  function setRecordingState(recording) {
    isCapturing = recording;
    if (!overlay) createOverlay();

    if (recording) {
      showOverlay();
      updateSubtitles('', 'Recording started...');
    } else {
      updateSubtitles('', '');
    }
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Content] Received message:', message);
    
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

      case 'UPDATE_SETTINGS':
        settings = { ...settings, ...message.settings };
        // Re-create overlay with new settings
        if (overlay) {
          overlay.remove();
          overlay = null;
          createOverlay();
        }
        sendResponse({ success: true });
        break;
    }
    
    return true;
  });

  // Initialize
  createOverlay();

  // Check if capture is already running
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
    console.log('[Content] Initial state response:', response);
    if (response && response.isCapturing) {
      setRecordingState(true);
    }
  });

  console.log('[Live Arabic Subs] Content script loaded (MINIMAL VERSION)');
})();