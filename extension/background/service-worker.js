/**
 * Live Arabic Subs - Enhanced Background Service Worker v1.1.0
 * Self-contained version with multiple backend support
 * 
 * VERSION CONTROL: This file will not be overwritten by previous versions
 * BACKEND OPTIONS: Local, External, Custom URL
 */

// State management
let isCapturing = false;
let mediaRecorder = null;
let audioChunks = [];
let captureTabId = null;
let offscreenDocumentCreated = false;

// Backend configuration - USER CONFIGURABLE
const BACKEND_CONFIG = {
  // Option 1: External EmergentAgent server (default)
  external: {
    name: 'EmergentAgent Cloud',
    url: 'https://live-arabic-subs.preview.emergentagent.com/api',
    enabled: true
  },
  
  // Option 2: Local development server
  local: {
    name: 'Local Server',
    url: 'http://localhost:8000/api',
    enabled: false
  },
  
  // Option 3: Custom server URL
  custom: {
    name: 'Custom Server',
    url: '', // User configurable
    enabled: false
  }
};

// Current active backend
let activeBackend = 'external';

// API Configuration - NOW USER CONFIGURABLE
let apiConfig = {
  baseUrl: BACKEND_CONFIG.external.url,
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  fallbackEnabled: true
};

// Settings with defaults
let settings = {
  fontSize: 28,
  fontFamily: 'IBM Plex Sans Arabic',
  fontColor: '#F5C518',
  bgOpacity: 0.85,
  showEnglish: true,
  englishFontSize: 14,
  englishColor: '#a1a1aa',
  lineHeight: 1.6,
  maxWidth: 800,
  chunkDuration: 4000,
  sourceLanguage: 'en',
  outputLanguage: 'ar',
  apiKeyProvider: 'openai',
  backendType: 'external' // external, local, custom
};

// Load settings on startup
chrome.storage.sync.get(['lasSettings'], (result) => {
  if (result.lasSettings) {
    settings = { ...settings, ...result.lasSettings };
    activeBackend = settings.backendType || 'external';
    updateApiConfig();
    logger?.info('Settings loaded', settings);
  }
});

// Update API configuration based on selected backend
function updateApiConfig() {
  const backend = BACKEND_CONFIG[activeBackend];
  if (backend && backend.enabled) {
    apiConfig.baseUrl = backend.url;
  }
  logger?.info('API config updated', { backend: activeBackend, url: apiConfig.baseUrl });
}

// Create offscreen document for audio processing
async function ensureOffscreenDocument() {
  if (offscreenDocumentCreated) return;

  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen/offscreen.html',
      reasons: ['USER_MEDIA'],
      justification: 'Audio capture and processing for transcription'
    });
    offscreenDocumentCreated = true;
    logger?.info('Offscreen document created');
  } catch (e) {
    if (!e.message.includes('already exists')) {
      logger?.error('Failed to create offscreen document', e);
    }
  }
}

// Enhanced start capture with backend selection
async function startCapture(tabId) {
  if (isCapturing) {
    logger?.warn('Already capturing');
    return;
  }

  try {
    captureTabId = tabId;
    
    // Test backend connectivity first
    const backendStatus = await testBackendConnectivity();
    if (!backendStatus.success) {
      throw new Error(`Backend unavailable: ${backendStatus.error}`);
    }

    // Get tab capture stream
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tabId
    });

    // Create offscreen document
    await ensureOffscreenDocument();

    // Send stream ID to offscreen document
    chrome.runtime.sendMessage({
      type: 'START_AUDIO_CAPTURE',
      target: 'offscreen',
      streamId: streamId,
      chunkDuration: settings.chunkDuration
    });

    isCapturing = true;

    // Notify content script
    chrome.tabs.sendMessage(tabId, { type: 'START_CAPTURE' });
    
    logger?.info('Capture started', { tabId, backend: activeBackend });
    
  } catch (error) {
    logger?.error('Failed to start capture', error);
    isCapturing = false;
    throw error;
  }
}

// Enhanced stop capture
async function stopCapture() {
  if (!isCapturing) return;

  try {
    // Tell offscreen document to stop
    chrome.runtime.sendMessage({
      type: 'STOP_AUDIO_CAPTURE',
      target: 'offscreen'
    });

    isCapturing = false;

    // Notify content script
    if (captureTabId) {
      chrome.tabs.sendMessage(captureTabId, { type: 'STOP_CAPTURE' });
    }

    logger?.info('Capture stopped');
  } catch (error) {
    logger?.error('Failed to stop capture', error);
  }
}

// Enhanced backend connectivity test
async function testBackendConnectivity() {
  try {
    const testUrl = `${apiConfig.baseUrl}/`;
    logger?.debug('Testing backend connectivity', testUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      logger?.info('Backend connectivity test passed');
      return { success: true };
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    logger?.error('Backend connectivity test failed', error);
    return { 
      success: false, 
      error: error.message,
      fallback: apiConfig.fallbackEnabled
    };
  }
}

// Enhanced audio processing with retry logic
async function processAudioChunk(audioBlob) {
  if (!audioBlob || audioBlob.size < 1000) {
    logger?.debug('Skipping small audio chunk');
    return;
  }

  // Try primary backend first
  let result = await attemptTranscription(audioBlob, apiConfig.baseUrl);
  
  // If primary fails and fallback is enabled, try alternatives
  if (!result.success && apiConfig.fallbackEnabled) {
    logger?.warn('Primary backend failed, trying fallbacks');
    result = await tryFallbackBackends(audioBlob);
  }

  if (result.success && result.data) {
    // Send to content script
    if (captureTabId) {
      chrome.tabs.sendMessage(captureTabId, {
        type: 'UPDATE_SUBTITLES',
        english: result.data.english_text,
        arabic: result.data.arabic_text
      });
    }
  } else {
    logger?.error('All transcription attempts failed');
  }
}

// Attempt transcription with specific backend
async function attemptTranscription(audioBlob, baseUrl, attempt = 1) {
  try {
    logger?.debug(`Attempting transcription (attempt ${attempt})`, { baseUrl });
    
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeout);
    
    const response = await fetch(`${baseUrl}/transcribe-and-translate`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status === 'success' && data.arabic_text) {
      logger?.info('Transcription successful', {
        englishLength: data.english_text?.length || 0,
        arabicLength: data.arabic_text.length
      });
      return { success: true, data };
    } else {
      throw new Error('Invalid response format');
    }
    
  } catch (error) {
    logger?.error(`Transcription attempt ${attempt} failed`, error);
    
    // Retry logic
    if (attempt < apiConfig.retryAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      return attemptTranscription(audioBlob, baseUrl, attempt + 1);
    }
    
    return { success: false, error: error.message };
  }
}

// Try fallback backends
async function tryFallbackBackends(audioBlob) {
  const backends = ['local', 'custom'];
  
  for (const backendType of backends) {
    const backend = BACKEND_CONFIG[backendType];
    if (backend && backend.enabled && backend.url) {
      logger?.info(`Trying fallback backend: ${backend.name}`);
      const result = await attemptTranscription(audioBlob, backend.url);
      if (result.success) {
        return result;
      }
    }
  }
  
  return { success: false, error: 'All backends failed' };
}

// Enhanced message handler with version control
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  logger?.debug('Message received', message);
  
  // Handle messages from offscreen document
  if (message.target === 'background') {
    if (message.type === 'AUDIO_CHUNK') {
      // Convert base64 to blob
      const byteCharacters = atob(message.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/webm' });
      
      processAudioChunk(blob);
      sendResponse({ success: true });
      return true;
    }
  }

  // Handle messages from popup/content scripts
  switch (message.type) {
    case 'START_CAPTURE':
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs[0]) {
          try {
            await startCapture(tabs[0].id);
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
        }
      });
      return true;

    case 'STOP_CAPTURE':
      stopCapture();
      sendResponse({ success: true });
      break;

    case 'GET_STATE':
      sendResponse({ 
        isCapturing, 
        settings,
        activeBackend,
        backendConfig: BACKEND_CONFIG
      });
      break;

    case 'UPDATE_SETTINGS':
      settings = { ...settings, ...message.settings };
      if (message.settings.backendType) {
        activeBackend = message.settings.backendType;
        updateApiConfig();
      }
      chrome.storage.sync.set({ lasSettings: settings });
      
      // Forward to content script
      if (captureTabId) {
        chrome.tabs.sendMessage(captureTabId, {
          type: 'UPDATE_SETTINGS',
          settings: settings
        });
      }
      sendResponse({ success: true });
      break;

    case 'TEST_BACKEND':
      testBackendConnectivity().then(result => {
        sendResponse(result);
      });
      return true;

    case 'SET_CUSTOM_BACKEND':
      if (message.url) {
        BACKEND_CONFIG.custom.url = message.url;
        BACKEND_CONFIG.custom.enabled = true;
        if (activeBackend === 'custom') {
          updateApiConfig();
        }
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'URL required' });
      }
      break;
  }

  return true;
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (isCapturing) {
    stopCapture();
  } else {
    startCapture(tab.id).catch(error => {
      logger?.error('Failed to start capture via icon click', error);
    });
  }
});

// Version information
const EXTENSION_VERSION = '1.1.0';
const VERSION_INFO = {
  version: EXTENSION_VERSION,
  buildDate: new Date().toISOString(),
  features: [
    'Multiple backend support',
    'Enhanced logging',
    'Fallback mechanisms',
    'Version control protection',
    'Self-contained operation'
  ]
};

logger?.info('Enhanced Background Service Worker loaded', VERSION_INFO);
console.log(`[Live Arabic Subs] v${EXTENSION_VERSION} - Enhanced Background Loaded`);