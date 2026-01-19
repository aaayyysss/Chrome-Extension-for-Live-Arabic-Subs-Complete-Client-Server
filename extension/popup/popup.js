/**
 * Live Arabic Subs - Enhanced Popup Script
 * With logging, language selection, and API key management
 */

// DOM Elements
const captureBtn = document.getElementById('capture-btn');
const captureText = document.getElementById('capture-text');
const micIcon = document.getElementById('mic-icon');
const stopIcon = document.getElementById('stop-icon');
const statusIndicator = document.getElementById('status-indicator');

// Language selectors
const sourceLanguageSelect = document.getElementById('source-language');
const outputLanguageSelect = document.getElementById('output-language');
const apiProviderSelect = document.getElementById('api-provider');

// API key elements
const apiKeyInput = document.getElementById('api-key');
const saveApiKeyBtn = document.getElementById('save-api-key');

// Display settings
const fontSizeSlider = document.getElementById('font-size');
const fontSizeValue = document.getElementById('font-size-value');
const bgOpacitySlider = document.getElementById('bg-opacity');
const opacityValue = document.getElementById('opacity-value');
const showEnglishToggle = document.getElementById('show-english');
const colorBtns = document.querySelectorAll('.color-btn');

// Preview elements
const previewContainer = document.getElementById('preview-container');
const previewEnglish = document.getElementById('preview-english');
const previewArabic = document.getElementById('preview-arabic');

// Debug panel elements
const debugToggle = document.getElementById('debug-toggle');
const debugPanel = document.getElementById('debug-panel');
const closeDebug = document.getElementById('close-debug');
const debugStatus = document.getElementById('debug-status');
const debugLogs = document.getElementById('debug-logs');
const clearLogsBtn = document.getElementById('clear-logs');
const exportLogsBtn = document.getElementById('export-logs');
const testConnectionBtn = document.getElementById('test-connection');
const connectionResult = document.getElementById('connection-result');

const webAppLink = document.getElementById('web-app-link');

// State
let isCapturing = false;
let settings = {
  fontSize: 28,
  fontColor: '#F5C518',
  bgOpacity: 0.85,
  showEnglish: true,
  sourceLanguage: 'en',
  outputLanguage: 'ar',
  apiKeyProvider: 'openai'
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  logger.info('Popup DOM loaded');
  
  try {
    // Load configuration
    await configManager.loadConfig();
    settings = { ...settings, ...configManager.getConfig() };
    
    // Populate language selectors
    populateLanguageSelectors();
    
    // Load state from background
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      if (response) {
        isCapturing = response.isCapturing;
        settings = { ...settings, ...response.settings };
        updateUI();
        updatePreview();
        logger.info('State loaded from background', response);
      }
    });

    // Set web app link
    webAppLink.href = 'https://live-arabic-subs.preview.emergentagent.com';
    webAppLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: webAppLink.href });
    });

    // Setup event listeners
    setupEventListeners();
    
    // Load saved API key
    loadSavedApiKey();
    
    logger.info('Popup initialized successfully');
    
  } catch (error) {
    logger.error('Failed to initialize popup', error);
    showError('Failed to initialize popup. Please reload the extension.');
  }
});

function populateLanguageSelectors() {
  try {
    // Populate source languages
    const sourceLanguages = configManager.getSourceLanguages();
    sourceLanguageSelect.innerHTML = '<option value="">Auto-detect</option>';
    sourceLanguages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = `${lang.flag} ${lang.name}`;
      if (lang.code === settings.sourceLanguage) {
        option.selected = true;
      }
      sourceLanguageSelect.appendChild(option);
    });

    // Populate output languages
    const outputLanguages = configManager.getOutputLanguages();
    outputLanguageSelect.innerHTML = '';
    outputLanguages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = `${lang.flag} ${lang.name}`;
      option.dir = lang.script === 'rtl' ? 'rtl' : 'ltr';
      if (lang.code === settings.outputLanguage) {
        option.selected = true;
      }
      outputLanguageSelect.appendChild(option);
    });

    // Set API provider
    apiProviderSelect.value = settings.apiKeyProvider || 'openai';

    logger.debug('Language selectors populated');
  } catch (error) {
    logger.error('Failed to populate language selectors', error);
  }
}

function setupEventListeners() {
  // Capture button
  captureBtn.addEventListener('click', handleCaptureToggle);
  
  // Language selection
  sourceLanguageSelect.addEventListener('change', handleLanguageChange);
  outputLanguageSelect.addEventListener('change', handleLanguageChange);
  apiProviderSelect.addEventListener('change', handleApiProviderChange);
  
  // API key management
  saveApiKeyBtn.addEventListener('click', handleSaveApiKey);
  
  // Display settings
  fontSizeSlider.addEventListener('input', handleFontSizeChange);
  bgOpacitySlider.addEventListener('input', handleOpacityChange);
  showEnglishToggle.addEventListener('change', handleShowEnglishChange);
  
  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => handleColorChange(btn.dataset.color));
  });
  
  // Debug panel
  debugToggle.addEventListener('click', toggleDebugPanel);
  closeDebug.addEventListener('click', toggleDebugPanel);
  clearLogsBtn.addEventListener('click', clearLogs);
  exportLogsBtn.addEventListener('click', exportLogs);
  testConnectionBtn.addEventListener('click', testConnection);
}

function handleCaptureToggle() {
  if (isCapturing) {
    chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' }, (response) => {
      if (response?.success) {
        isCapturing = false;
        updateUI();
        logger.info('Capture stopped');
      }
    });
  } else {
    // Check if API key is set
    const currentProvider = apiProviderSelect.value;
    const apiKey = configManager.getApiKey(currentProvider);
    
    if (!apiKey) {
      showError(`Please set your ${currentProvider} API key first`);
      return;
    }
    
    chrome.runtime.sendMessage({ type: 'START_CAPTURE' }, (response) => {
      if (response?.success) {
        isCapturing = true;
        updateUI();
        logger.info('Capture started');
      } else {
        showError('Failed to start capture');
      }
    });
  }
}

function handleLanguageChange() {
  const newSettings = {
    sourceLanguage: sourceLanguageSelect.value,
    outputLanguage: outputLanguageSelect.value
  };
  
  settings = { ...settings, ...newSettings };
  configManager.updateConfig(newSettings);
  saveSettings();
  logger.info('Language settings updated', newSettings);
}

function handleApiProviderChange() {
  const provider = apiProviderSelect.value;
  settings.apiKeyProvider = provider;
  configManager.updateConfig({ apiKeyProvider: provider });
  
  // Load saved API key for this provider
  loadSavedApiKey();
  logger.info('API provider changed', provider);
}

function handleSaveApiKey() {
  const provider = apiProviderSelect.value;
  const key = apiKeyInput.value.trim();
  
  if (!key) {
    showError('Please enter an API key');
    return;
  }
  
  const validation = configManager.validateApiKey(provider, key);
  if (!validation.valid) {
    showError(validation.error);
    return;
  }
  
  configManager.saveApiKey(provider, key)
    .then(() => {
      showSuccess('API key saved successfully');
      apiKeyInput.value = '';
      logger.info(`API key saved for ${provider}`);
    })
    .catch(error => {
      logger.error('Failed to save API key', error);
      showError('Failed to save API key');
    });
}

function loadSavedApiKey() {
  const provider = apiProviderSelect.value;
  const savedKey = configManager.getApiKey(provider);
  if (savedKey) {
    // Show masked key indicator
    apiKeyInput.placeholder = '••••••••••••••••••••••••••••••••';
    saveApiKeyBtn.textContent = 'Update';
  } else {
    apiKeyInput.placeholder = 'Enter your API key';
    saveApiKeyBtn.textContent = 'Save';
  }
}

function handleFontSizeChange(e) {
  const value = parseInt(e.target.value);
  settings.fontSize = value;
  fontSizeValue.textContent = value;
  saveSettings();
  updatePreview();
}

function handleOpacityChange(e) {
  const value = parseInt(e.target.value);
  settings.bgOpacity = value / 100;
  opacityValue.textContent = value;
  saveSettings();
  updatePreview();
}

function handleShowEnglishChange(e) {
  settings.showEnglish = e.target.checked;
  saveSettings();
  updatePreview();
}

function handleColorChange(color) {
  settings.fontColor = color;
  colorBtns.forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-color="${color}"]`).classList.add('active');
  saveSettings();
  updatePreview();
}

function saveSettings() {
  chrome.runtime.sendMessage({
    type: 'UPDATE_SETTINGS',
    settings: settings
  });
  configManager.updateConfig(settings);
}

function updateUI() {
  // Capture button
  if (isCapturing) {
    captureBtn.classList.add('recording');
    captureText.textContent = 'Stop Capture';
    micIcon.classList.add('hidden');
    stopIcon.classList.remove('hidden');
    statusIndicator.classList.add('recording');
  } else {
    captureBtn.classList.remove('recording');
    captureText.textContent = 'Start Capture';
    micIcon.classList.remove('hidden');
    stopIcon.classList.add('hidden');
    statusIndicator.classList.remove('recording');
  }

  // Settings controls
  fontSizeSlider.value = settings.fontSize;
  fontSizeValue.textContent = settings.fontSize;

  bgOpacitySlider.value = Math.round(settings.bgOpacity * 100);
  opacityValue.textContent = Math.round(settings.bgOpacity * 100);

  showEnglishToggle.checked = settings.showEnglish;

  // Color buttons
  colorBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === settings.fontColor);
  });
}

function updatePreview() {
  previewArabic.style.fontSize = `${Math.min(settings.fontSize, 24)}px`;
  previewArabic.style.color = settings.fontColor;
  previewContainer.style.background = `rgba(0, 0, 0, ${settings.bgOpacity})`;
  previewEnglish.classList.toggle('hidden', !settings.showEnglish);
  
  // Set text direction for output language
  const outputLang = configManager.getOutputLanguages().find(l => l.code === settings.outputLanguage);
  if (outputLang) {
    previewArabic.dir = outputLang.script;
  }
}

function toggleDebugPanel() {
  debugPanel.classList.toggle('hidden');
  if (!debugPanel.classList.contains('hidden')) {
    updateDebugPanel();
  }
}

async function updateDebugPanel() {
  try {
    // Update status
    const backgroundState = await new Promise(resolve => {
      chrome.runtime.sendMessage({ type: 'GET_STATE' }, resolve);
    });
    
    debugStatus.innerHTML = `
      <div>Capturing: ${backgroundState?.isCapturing ? 'Yes' : 'No'}</div>
      <div>Active Tab: ${backgroundState?.captureTabId || 'None'}</div>
      <div>Settings Loaded: Yes</div>
    `;
    
    // Update logs
    const recentLogs = logger.getRecentLogs(20);
    debugLogs.innerHTML = recentLogs.map(log => 
      `<div class="log-entry log-${log.level.toLowerCase()}">
        <span class="log-timestamp">${new Date(log.timestamp).toLocaleTimeString()}</span>
        <span class="log-level">${log.level}</span>
        <span class="log-message">${log.message}</span>
        ${log.data ? `<span class="log-data">${JSON.stringify(log.data)}</span>` : ''}
      </div>`
    ).join('');
    
    debugLogs.scrollTop = debugLogs.scrollHeight;
    
  } catch (error) {
    logger.error('Failed to update debug panel', error);
    debugStatus.innerHTML = '<div class="error">Failed to load debug information</div>';
  }
}

function clearLogs() {
  logger.clearLogs();
  updateDebugPanel();
  showSuccess('Logs cleared');
}

function exportLogs() {
  const logsText = logger.exportLogs();
  const blob = new Blob([logsText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `las-logs-${new Date().toISOString().slice(0, 19)}.txt`;
  a.click();
  
  URL.revokeObjectURL(url);
  showSuccess('Logs exported');
}

async function testConnection() {
  connectionResult.innerHTML = '<div>Testing connection...</div>';
  
  try {
    const response = await fetch('https://live-arabic-subs.preview.emergentagent.com/api/');
    if (response.ok) {
      connectionResult.innerHTML = '<div class="success">✅ API connection successful</div>';
    } else {
      connectionResult.innerHTML = `<div class="error">❌ API returned status: ${response.status}</div>`;
    }
  } catch (error) {
    connectionResult.innerHTML = `<div class="error">❌ Connection failed: ${error.message}</div>`;
    logger.error('API connection test failed', error);
  }
}

function showError(message) {
  // Create error notification
  const notification = createNotification(message, 'error');
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
}

function showSuccess(message) {
  // Create success notification
  const notification = createNotification(message, 'success');
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function createNotification(message, type) {
  const div = document.createElement('div');
  div.className = `notification notification-${type}`;
  div.textContent = message;
  div.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-size: 14px;
    z-index: 10000;
    max-width: 300px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    ${type === 'error' ? 'background: #ef4444;' : 'background: #22c55e;'}
  `;
  return div;
}

// Listen for state changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STATE_CHANGED') {
    isCapturing = message.isCapturing;
    updateUI();
  }
});

// Auto-refresh debug panel
setInterval(() => {
  if (!debugPanel.classList.contains('hidden')) {
    updateDebugPanel();
  }
}, 2000);

logger.info('Enhanced popup script loaded');