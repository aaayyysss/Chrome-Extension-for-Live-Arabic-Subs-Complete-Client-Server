import React, { createContext, useContext, useState, useCallback } from 'react';

const SubtitleContext = createContext(null);

const defaultSettings = {
  // Font settings
  fontSize: 28,
  fontFamily: 'IBM Plex Sans Arabic',
  fontColor: '#F5C518', // Yellow default
  lineHeight: 1.6,
  
  // Background settings
  bgOpacity: 0.75,
  bgColor: '#000000',
  
  // English source text settings
  showEnglish: true,
  englishFontSize: 16,
  englishColor: '#A1A1AA',
  
  // Overlay settings
  overlayPosition: 'fixed', // 'fixed' or 'draggable'
  overlayWidth: 600,
  
  // Color presets
  colorPresets: [
    { name: 'Yellow', value: '#F5C518' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Green', value: '#22C55E' },
  ],
  
  // Font family options
  fontFamilies: [
    { name: 'IBM Plex Sans Arabic', value: 'IBM Plex Sans Arabic' },
    { name: 'Arial', value: 'Arial' },
    { name: 'Tahoma', value: 'Tahoma' },
    { name: 'Noto Sans Arabic', value: 'Noto Sans Arabic' },
  ],
};

export function SubtitleProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [subtitles, setSubtitles] = useState({
    english: '',
    arabic: '',
  });
  const [isCapturing, setIsCapturing] = useState(false);
  const [audioSource, setAudioSource] = useState('microphone'); // 'microphone' or 'tab'
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateSubtitles = useCallback((english, arabic) => {
    setSubtitles({ english, arabic });
  }, []);

  const clearSubtitles = useCallback(() => {
    setSubtitles({ english: '', arabic: '' });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const value = {
    settings,
    updateSetting,
    resetSettings,
    subtitles,
    updateSubtitles,
    clearSubtitles,
    isCapturing,
    setIsCapturing,
    audioSource,
    setAudioSource,
    isOverlayVisible,
    setIsOverlayVisible,
  };

  return (
    <SubtitleContext.Provider value={value}>
      {children}
    </SubtitleContext.Provider>
  );
}

export function useSubtitle() {
  const context = useContext(SubtitleContext);
  if (!context) {
    throw new Error('useSubtitle must be used within a SubtitleProvider');
  }
  return context;
}

export default SubtitleContext;
