import React, { useRef, useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { useSubtitle } from '../context/SubtitleContext';
import { X, Move, Lock, Unlock, Maximize2, Minimize2 } from 'lucide-react';

export function SubtitleOverlay() {
  const { settings, subtitles, isOverlayVisible, setIsOverlayVisible, updateSetting } = useSubtitle();
  const nodeRef = useRef(null);
  const [showControls, setShowControls] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOverlayVisible) {
        setIsOverlayVisible(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOverlayVisible, setIsOverlayVisible]);

  if (!isOverlayVisible) return null;

  const isDraggable = settings.overlayPosition === 'draggable';
  const overlayWidth = isExpanded ? '90vw' : `${settings.overlayWidth}px`;

  const overlayContent = (
    <div
      ref={nodeRef}
      className={`fixed ${isDraggable ? '' : 'bottom-8 left-1/2 -translate-x-1/2'} z-50 transition-all duration-300`}
      style={{
        width: overlayWidth,
        maxWidth: '95vw',
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      data-testid="subtitle-overlay"
    >
      {/* Control bar (visible on hover) */}
      <div
        className={`flex items-center justify-between px-3 py-2 mb-2 rounded-lg transition-opacity duration-200 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundColor: `rgba(0, 0, 0, 0.6)`,
        }}
      >
        {/* Left controls */}
        <div className="flex items-center gap-2">
          {isDraggable && (
            <div className="draggable-handle p-1.5 hover:bg-white/10 rounded cursor-grab" data-testid="drag-handle">
              <Move className="w-4 h-4 text-zinc-400" />
            </div>
          )}
          <button
            onClick={() => updateSetting('overlayPosition', isDraggable ? 'fixed' : 'draggable')}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title={isDraggable ? 'Lock position' : 'Make draggable'}
            data-testid="toggle-position-btn"
          >
            {isDraggable ? (
              <Unlock className="w-4 h-4 text-zinc-400" />
            ) : (
              <Lock className="w-4 h-4 text-zinc-400" />
            )}
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title={isExpanded ? 'Minimize' : 'Expand'}
            data-testid="toggle-expand-btn"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-zinc-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-zinc-400" />
            )}
          </button>
          <button
            onClick={() => setIsOverlayVisible(false)}
            className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
            title="Close overlay"
            data-testid="close-overlay-btn"
          >
            <X className="w-4 h-4 text-zinc-400 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Subtitle container */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: `rgba(${hexToRgb(settings.bgColor)}, ${settings.bgOpacity})`,
          backdropFilter: 'blur(8px)',
        }}
        data-testid="subtitle-container"
      >
        {/* English source text (if enabled) */}
        {settings.showEnglish && subtitles.english && (
          <div
            className="px-6 pt-4 pb-2 subtitle-shadow"
            style={{
              fontSize: `${settings.englishFontSize}px`,
              color: settings.englishColor,
              fontFamily: 'Manrope, sans-serif',
              lineHeight: 1.4,
            }}
            data-testid="english-subtitle"
          >
            {subtitles.english}
          </div>
        )}

        {/* Arabic translation */}
        <div
          className="arabic-text px-6 py-4 subtitle-shadow"
          dir="rtl"
          style={{
            fontSize: `${settings.fontSize}px`,
            color: settings.fontColor,
            fontFamily: `'${settings.fontFamily}', 'Arial', sans-serif`,
            lineHeight: settings.lineHeight,
            minHeight: '60px',
          }}
          data-testid="arabic-subtitle"
        >
          {subtitles.arabic || (
            <span className="text-zinc-500 italic" style={{ direction: 'ltr', textAlign: 'center', display: 'block' }}>
              Waiting for speech...
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Wrap in Draggable if draggable mode
  if (isDraggable) {
    return (
      <Draggable
        nodeRef={nodeRef}
        handle=".draggable-handle"
        bounds="parent"
        defaultPosition={{ x: window.innerWidth / 2 - settings.overlayWidth / 2, y: window.innerHeight - 200 }}
      >
        {overlayContent}
      </Draggable>
    );
  }

  return overlayContent;
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
}

export default SubtitleOverlay;
