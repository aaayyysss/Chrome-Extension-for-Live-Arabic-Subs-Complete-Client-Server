/**
 * Live Arabic Subs - Language and API Configuration
 * Supported languages and API key management
 */

// Supported languages for transcription and translation
const SUPPORTED_LANGUAGES = {
  source: [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' }
  ],
  
  output: [
    { code: 'ar', name: 'Arabic (Modern Standard)', flag: '🇸🇦', script: 'rtl' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', script: 'ltr' },
    { code: 'fr', name: 'French', flag: '🇫🇷', script: 'ltr' },
    { code: 'de', name: 'German', flag: '🇩🇪', script: 'ltr' },
    { code: 'it', name: 'Italian', flag: '🇮🇹', script: 'ltr' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹', script: 'ltr' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺', script: 'ltr' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵', script: 'ltr' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷', script: 'ltr' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳', script: 'ltr' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳', script: 'ltr' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷', script: 'ltr' },
    { code: 'fa', name: 'Persian (Farsi)', flag: '🇮🇷', script: 'rtl' },
    { code: 'ur', name: 'Urdu', flag: '🇵🇰', script: 'rtl' }
  ]
};

// API Providers and their configurations
const API_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: {
      whisper: ['whisper-1'],
      gpt: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
    },
    baseUrl: 'https://api.openai.com/v1'
  },
  anthropic: {
    name: 'Anthropic Claude',
    models: {
      claude: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229']
    },
    baseUrl: 'https://api.anthropic.com/v1'
  },
  google: {
    name: 'Google Cloud',
    models: {
      speech: ['google_speech_v1'],
      translation: ['google_translate_v3']
    },
    baseUrl: 'https://speech.googleapis.com/v1'
  },
  azure: {
    name: 'Microsoft Azure',
    models: {
      speech: ['azure_speech_v1'],
      translation: ['azure_translator']
    },
    baseUrl: 'https://api.cognitive.microsoft.com/sts/v1.0'
  }
};

// Default configuration
const DEFAULT_CONFIG = {
  sourceLanguage: 'en',
  outputLanguage: 'ar',
  apiKeyProvider: 'openai',
  transcriptionModel: 'whisper-1',
  translationModel: 'gpt-4',
  chunkDuration: 4000,
  autoDetectLanguage: true,
  showDebugInfo: false,
  enableLogging: true
};

// Configuration manager
class ConfigManager {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.apiKeys = {};
    this.loadConfig();
  }

  async loadConfig() {
    try {
      const result = await chrome.storage.sync.get(['lasConfig', 'lasApiKeys']);
      if (result.lasConfig) {
        this.config = { ...DEFAULT_CONFIG, ...result.lasConfig };
      }
      if (result.lasApiKeys) {
        this.apiKeys = result.lasApiKeys;
      }
      logger.info('Configuration loaded', { config: this.config, hasApiKeys: !!Object.keys(this.apiKeys).length });
    } catch (error) {
      logger.error('Failed to load configuration', error);
    }
  }

  async saveConfig() {
    try {
      await chrome.storage.sync.set({ lasConfig: this.config });
      logger.info('Configuration saved', this.config);
    } catch (error) {
      logger.error('Failed to save configuration', error);
    }
  }

  async saveApiKey(provider, key) {
    try {
      this.apiKeys[provider] = key;
      await chrome.storage.sync.set({ lasApiKeys: this.apiKeys });
      logger.info(`API key saved for ${provider}`);
    } catch (error) {
      logger.error(`Failed to save API key for ${provider}`, error);
    }
  }

  getApiKey(provider) {
    return this.apiKeys[provider] || null;
  }

  getAllApiKeys() {
    return { ...this.apiKeys };
  }

  getConfig() {
    return { ...this.config };
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  getSourceLanguages() {
    return [...SUPPORTED_LANGUAGES.source];
  }

  getOutputLanguages() {
    return [...SUPPORTED_LANGUAGES.output];
  }

  getApiProviders() {
    return { ...API_PROVIDERS };
  }

  validateApiKey(provider, key) {
    // Basic validation - in production, you'd want to actually test the key
    if (!key || key.length < 10) {
      return { valid: false, error: 'API key is too short' };
    }
    
    // Check for common key patterns
    const patterns = {
      openai: /^sk-[a-zA-Z0-9_-]{20,}$/,
      anthropic: /^sk-ant-[a-zA-Z0-9]{32,}$/,
      google: /^[a-zA-Z0-9_-]{30,}$/,
      azure: /^[a-zA-Z0-9]{32}$/
    };

    if (patterns[provider] && !patterns[provider].test(key)) {
      return { valid: false, error: `Invalid ${provider} API key format` };
    }

    return { valid: true };
  }
}

// Global config manager instance
const configManager = new ConfigManager();

// Export for use in other files
window.SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;
window.API_PROVIDERS = API_PROVIDERS;
window.DEFAULT_CONFIG = DEFAULT_CONFIG;
window.configManager = configManager;