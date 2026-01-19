# Live Arabic Subs - Chrome Extension

Real-time English to Arabic subtitle translation overlay that works on any webpage with video content.

## Features

- **Tab Audio Capture**: Uses Chrome's `tabCapture` API to capture audio from any tab
- **Real-time Translation**: English speech → OpenAI Whisper → GPT-5.2 → Arabic subtitles
- **Overlay Injection**: Subtitles appear directly on the webpage, works in fullscreen
- **Customizable**: Font size, color presets, background opacity, draggable position
- **RTL Support**: Proper right-to-left Arabic text rendering

## Installation

### From Source (Developer Mode)

1. Download or clone this extension folder
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `/app/extension` folder
6. The extension icon will appear in your toolbar

### Pin the Extension

1. Click the puzzle piece icon in Chrome toolbar
2. Find "Live Arabic Subs"
3. Click the pin icon to keep it visible

## Usage

1. **Open a video page** (YouTube, Netflix, etc.)
2. **Click the extension icon** in your toolbar
3. **Click "Start Capture"** to begin
4. **Watch** as subtitles appear at the bottom of the page
5. **Adjust settings** using the popup:
   - Change subtitle color (Yellow, White, Cyan, Green)
   - Adjust font size (16-48px)
   - Set background opacity
   - Toggle English source text
6. **Click "Stop Capture"** when done

## Overlay Controls

When hovering over the subtitle overlay:

- **Move icon**: Enable dragging to reposition
- **Lock icon**: Reset to centered bottom position
- **Settings icon**: Open extension popup
- **X icon**: Hide overlay and stop capture

## API Configuration

The extension connects to the backend API at:
```
https://live-arabic-subs.preview.emergentagent.com/api
```

To use your own backend, edit `background/service-worker.js`:
```javascript
const API_BASE_URL = 'YOUR_BACKEND_URL/api';
```

## Technical Details

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Content Script │◄────│ Service Worker  │◄────│ Offscreen Doc   │
│  (Overlay UI)   │     │ (API calls)     │     │ (Audio capture) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Backend API    │
                        │ (Whisper+GPT)   │
                        └─────────────────┘
```

### Manifest V3

This extension uses Manifest V3 with:
- **Service Worker**: Background script for API communication
- **Offscreen Document**: Required for audio capture (service workers can't access media APIs)
- **Content Script**: Injects overlay into webpages

### Permissions

- `tabCapture`: Capture audio from browser tabs
- `activeTab`: Access current tab for overlay injection
- `storage`: Save user settings
- `offscreen`: Create offscreen document for audio processing

## Troubleshooting

### "No audio captured"
- Make sure the tab is playing audio
- Try refreshing the page and restarting capture
- Check that the tab isn't muted

### "Subtitles not appearing"
- Ensure the content script loaded (refresh page)
- Check console for errors
- Verify backend API is accessible

### "Extension not working on some sites"
- Some sites (chrome://, chrome-extension://) block content scripts
- Try on regular web pages

## Development

### File Structure
```
extension/
├── manifest.json           # Extension configuration
├── background/
│   └── service-worker.js   # Background script
├── content/
│   ├── content.js          # Overlay injection
│   └── overlay.css         # Overlay styles
├── offscreen/
│   ├── offscreen.html      # Offscreen document
│   └── offscreen.js        # Audio capture
├── popup/
│   ├── popup.html          # Extension popup
│   ├── popup.css           # Popup styles
│   └── popup.js            # Popup logic
└── icons/                  # Extension icons
```

### Testing

1. Load the extension in developer mode
2. Open any YouTube video
3. Click extension icon → Start Capture
4. Speak or play audio to test transcription

## License

MIT License - Part of Live Arabic Subs project.
