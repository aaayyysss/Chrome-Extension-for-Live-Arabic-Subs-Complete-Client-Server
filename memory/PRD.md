# Live Arabic Subs - Product Requirements Document

## Original Problem Statement
Build an MVP for real-time English audio to Modern Standard Arabic subtitle translation with:
- Input: English audio (microphone + browser tab)
- Output: Arabic subtitles (Modern Standard Arabic)
- Overlay: Topmost window with RTL rendering and font control
- No saving, no exporting, no redistribution features
- Cross-platform implementation plan including Windows WASAPI loopback and macOS options

## User Personas
1. **Content Consumers**: Users watching English videos/streams who need Arabic subtitles
2. **Language Learners**: Students learning Arabic who want to see translations in real-time
3. **Accessibility Users**: Users who prefer reading Arabic over English audio

## Core Requirements (Static)
- [x] Real-time audio capture (microphone + browser tab)
- [x] Speech-to-text via OpenAI Whisper
- [x] Translation via GPT-5.2 to Modern Standard Arabic
- [x] Floating subtitle overlay with RTL support
- [x] Advanced font controls (size, family, color, opacity, line spacing)
- [x] Draggable/fixed overlay toggle
- [x] No persistence/export features

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI with emergentintegrations library
- **APIs**: OpenAI Whisper (STT) + GPT-5.2 (Translation)
- **Key**: Emergent Universal Key (EMERGENT_LLM_KEY)

## What's Been Implemented

### January 2026 - MVP Release
- [x] Dashboard with audio source selection (Mic/Tab)
- [x] Real-time transcription pipeline (4-second chunks)
- [x] GPT-5.2 translation to Modern Standard Arabic
- [x] Glassmorphism dark theme UI
- [x] Settings panel with 3 tabs (Appearance, Typography, Display)
- [x] Draggable/fixed subtitle overlay
- [x] RTL Arabic text rendering with IBM Plex Sans Arabic font
- [x] Color presets (Yellow, White, Cyan, Green)
- [x] Background opacity control
- [x] Font size and line spacing controls
- [x] Desktop implementation plan document (WASAPI + macOS options)

### January 2026 - Chrome Extension
- [x] Manifest V3 Chrome Extension (`/app/extension/`)
- [x] Tab audio capture via `chrome.tabCapture` API
- [x] Content script injects overlay into any webpage
- [x] Works in fullscreen video mode
- [x] Popup UI with settings controls
- [x] Offscreen document for audio processing
- [x] Connects to same backend API

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Audio capture working
- [x] Whisper transcription working
- [x] GPT translation working
- [x] Overlay rendering with RTL

### P1 (High Priority) - Future
- [ ] Continuous audio processing optimization (reduce latency)
- [ ] Buffering for smoother subtitle display
- [ ] Keyboard shortcuts (Start/Stop)

### P2 (Medium Priority) - Future
- [ ] Multiple translation language support
- [ ] Custom color picker (beyond presets)
- [ ] Subtitle history scroll-back

### P3 (Low Priority) - Future
- [ ] Offline Whisper model option
- [ ] Desktop app (Electron/Tauri wrapper)

## Next Tasks
1. Test with real audio input (user testing)
2. Optimize chunk duration for better latency
3. Add keyboard shortcut support
4. Consider adding subtitle buffering for smoother display

## Technical Notes
- Audio is captured in 4-second chunks for optimal Whisper processing
- WebM format used for browser audio capture
- Emergent LLM Key handles both Whisper and GPT-5.2 calls
- RTL rendering uses `dir="rtl"` and IBM Plex Sans Arabic font
