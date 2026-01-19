/**
 * Live Arabic Subs - Enhanced Logging System
 * Centralized logging with different levels and storage
 */

class ExtensionLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.logLevel = 'DEBUG'; // DEBUG, INFO, WARN, ERROR
  }

  // Log levels
  debug(message, data = null) {
    this._log('DEBUG', message, data);
  }

  info(message, data = null) {
    this._log('INFO', message, data);
  }

  warn(message, data = null) {
    this._log('WARN', message, data);
  }

  error(message, data = null) {
    this._log('ERROR', message, data);
  }

  _log(level, message, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      stack: new Error().stack.split('\n')[3] // Get caller info
    };

    // Store in memory
    this.logs.push(logEntry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const consoleMessage = `[LAS-${level}] ${timestamp} ${message}`;
    switch (level) {
      case 'DEBUG':
        console.debug(consoleMessage, data || '');
        break;
      case 'INFO':
        console.info(consoleMessage, data || '');
        break;
      case 'WARN':
        console.warn(consoleMessage, data || '');
        break;
      case 'ERROR':
        console.error(consoleMessage, data || '');
        break;
    }

    // Save to storage periodically
    if (level === 'ERROR' || this.logs.length % 10 === 0) {
      this.saveLogs();
    }
  }

  // Save logs to chrome storage
  async saveLogs() {
    try {
      await chrome.storage.local.set({ 
        lasLogs: this.logs.slice(-100) // Save last 100 logs
      });
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  // Get recent logs
  getRecentLogs(count = 50) {
    return this.logs.slice(-count);
  }

  // Get logs by level
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    chrome.storage.local.remove('lasLogs');
  }

  // Export logs as text
  exportLogs() {
    return this.logs.map(log => 
      `[${log.timestamp}] ${log.level}: ${log.message}${log.data ? ' | Data: ' + JSON.stringify(log.data) : ''}`
    ).join('\n');
  }
}

// Global logger instance
const logger = new ExtensionLogger();

// Initialize logger
logger.info('Extension Logger initialized');

// Export for use in other files
window.extensionLogger = logger;