# Desktop Implementation Plan: Real-Time English-to-Arabic Subtitle Overlay

## Overview

This document provides a comprehensive cross-platform implementation plan for building a native desktop application that captures system audio and provides real-time Arabic subtitle translation overlay.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Windows Implementation (WASAPI Loopback)](#windows-implementation-wasapi-loopback)
3. [macOS Implementation Options](#macos-implementation-options)
4. [Cross-Platform Python + PyQt Solution](#cross-platform-python--pyqt-solution)
5. [Audio Processing Pipeline](#audio-processing-pipeline)
6. [Overlay Window Implementation](#overlay-window-implementation)
7. [Dependencies and Setup](#dependencies-and-setup)
8. [Trade-offs and Considerations](#trade-offs-and-considerations)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Desktop Application                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Audio Capture│───▶│  Transcribe  │───▶│  Translate   │      │
│  │   (System)   │    │  (Whisper)   │    │  (GPT-5.2)   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                                        │              │
│         │            ┌──────────────────────────┐│              │
│         │            │    Subtitle Overlay      ││              │
│         └───────────▶│  (Always-on-top Window)  │◀┘              │
│                      │  - RTL Arabic Text       │               │
│                      │  - Font Controls         │               │
│                      │  - Draggable/Fixed       │               │
│                      └──────────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Windows Implementation (WASAPI Loopback)

### The Cleanest Path: PyAudioWPatch

WASAPI (Windows Audio Session API) loopback allows capturing all system audio output without any additional virtual audio drivers.

### Installation

```bash
pip install PyAudioWPatch
```

### Core Implementation

```python
import pyaudiowpatch as pyaudio
import wave
import threading
import queue
import time

class WASAPILoopbackCapture:
    """
    Captures system audio using WASAPI loopback on Windows.
    This is the cleanest solution - no virtual audio drivers needed.
    """
    
    def __init__(self, chunk_duration=4.0):
        self.p = pyaudio.PyAudio()
        self.stream = None
        self.chunk_duration = chunk_duration
        self.audio_queue = queue.Queue()
        self.is_capturing = False
        
    def get_default_wasapi_loopback_device(self):
        """Find the default WASAPI loopback device."""
        wasapi_info = self.p.get_host_api_info_by_type(pyaudio.paWASAPI)
        
        # Find default output device
        default_speakers = self.p.get_device_info_by_index(
            wasapi_info["defaultOutputDevice"]
        )
        
        # Find corresponding loopback device
        for i in range(self.p.get_device_count()):
            device_info = self.p.get_device_info_by_index(i)
            
            # Check if this is the loopback device for our speakers
            if (device_info.get("isLoopbackDevice", False) and 
                device_info["name"].startswith(default_speakers["name"])):
                return device_info
                
        raise RuntimeError("No WASAPI loopback device found")
    
    def start_capture(self, callback):
        """
        Start capturing audio.
        
        Args:
            callback: Function that receives audio chunks (bytes)
        """
        device = self.get_default_wasapi_loopback_device()
        
        self.stream = self.p.open(
            format=pyaudio.paInt16,
            channels=int(device["maxInputChannels"]),
            rate=int(device["defaultSampleRate"]),
            input=True,
            input_device_index=device["index"],
            frames_per_buffer=1024,
            stream_callback=self._audio_callback
        )
        
        self.is_capturing = True
        self._start_chunk_processor(callback)
        
    def _audio_callback(self, in_data, frame_count, time_info, status):
        """PyAudio callback - runs in separate thread."""
        self.audio_queue.put(in_data)
        return (None, pyaudio.paContinue)
    
    def _start_chunk_processor(self, callback):
        """Process audio into chunks and send to callback."""
        def process():
            accumulated = b""
            sample_rate = 48000  # WASAPI default
            bytes_per_chunk = int(sample_rate * self.chunk_duration * 2 * 2)  # 16-bit stereo
            
            while self.is_capturing:
                try:
                    data = self.audio_queue.get(timeout=0.1)
                    accumulated += data
                    
                    if len(accumulated) >= bytes_per_chunk:
                        callback(accumulated[:bytes_per_chunk])
                        accumulated = accumulated[bytes_per_chunk:]
                        
                except queue.Empty:
                    continue
                    
        self.processor_thread = threading.Thread(target=process)
        self.processor_thread.start()
        
    def stop_capture(self):
        """Stop capturing audio."""
        self.is_capturing = False
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
        self.p.terminate()


# Usage Example
if __name__ == "__main__":
    def on_audio_chunk(audio_bytes):
        print(f"Received {len(audio_bytes)} bytes of audio")
        # Send to Whisper API here
        
    capture = WASAPILoopbackCapture(chunk_duration=4.0)
    capture.start_capture(on_audio_chunk)
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        capture.stop_capture()
```

### Why WASAPI Loopback is the Best Windows Option

| Feature | WASAPI Loopback | Virtual Audio Cable | Stereo Mix |
|---------|----------------|---------------------|------------|
| No extra software | ✅ | ❌ | ✅ |
| Works on all Windows 10/11 | ✅ | ✅ | ❌ (disabled on many) |
| Low latency | ✅ (~20ms) | ❌ (~50-100ms) | ⚠️ (varies) |
| Captures all apps | ✅ | ✅ | ✅ |
| No audio routing needed | ✅ | ❌ | ✅ |

---

## macOS Implementation Options

### Option 1: BlackHole (Recommended for Simplicity)

**What it is:** Free, open-source virtual audio driver that creates a loopback device.

**Installation:**
```bash
brew install blackhole-2ch
```

**Setup Required:**
1. User must create a Multi-Output Device in Audio MIDI Setup
2. Set Multi-Output as default output
3. App captures from BlackHole

**Python Implementation:**

```python
import sounddevice as sd
import numpy as np
import queue

class BlackHoleCapture:
    """
    Captures audio from BlackHole virtual device on macOS.
    Requires user to set up Multi-Output Device.
    """
    
    def __init__(self, device_name="BlackHole 2ch", sample_rate=48000):
        self.device_name = device_name
        self.sample_rate = sample_rate
        self.audio_queue = queue.Queue()
        self.is_capturing = False
        
    def find_blackhole_device(self):
        """Find the BlackHole device index."""
        devices = sd.query_devices()
        for i, dev in enumerate(devices):
            if self.device_name in dev['name'] and dev['max_input_channels'] > 0:
                return i
        raise RuntimeError(f"BlackHole device '{self.device_name}' not found. "
                          "Please install BlackHole and set up Multi-Output Device.")
    
    def start_capture(self, callback, chunk_duration=4.0):
        """Start capturing from BlackHole."""
        device_idx = self.find_blackhole_device()
        
        def audio_callback(indata, frames, time_info, status):
            self.audio_queue.put(indata.copy())
            
        self.stream = sd.InputStream(
            device=device_idx,
            channels=2,
            samplerate=self.sample_rate,
            callback=audio_callback,
            blocksize=int(self.sample_rate * 0.1)
        )
        self.stream.start()
        self.is_capturing = True
        
        # Start chunk processor
        self._process_chunks(callback, chunk_duration)
        
    def _process_chunks(self, callback, chunk_duration):
        import threading
        
        def process():
            accumulated = []
            samples_per_chunk = int(self.sample_rate * chunk_duration)
            
            while self.is_capturing:
                try:
                    data = self.audio_queue.get(timeout=0.1)
                    accumulated.append(data)
                    
                    total_samples = sum(len(d) for d in accumulated)
                    if total_samples >= samples_per_chunk:
                        audio_data = np.concatenate(accumulated)
                        callback(audio_data[:samples_per_chunk])
                        accumulated = [audio_data[samples_per_chunk:]]
                        
                except queue.Empty:
                    continue
                    
        self.processor_thread = threading.Thread(target=process)
        self.processor_thread.start()
        
    def stop_capture(self):
        self.is_capturing = False
        if self.stream:
            self.stream.stop()
            self.stream.close()
```

**Trade-offs:**
- ✅ Free, open-source
- ✅ Low latency
- ❌ Requires manual setup by user
- ❌ User must remember to switch audio output

---

### Option 2: ScreenCaptureKit (macOS 13+, Best Native)

**What it is:** Apple's modern API for capturing screen and audio without virtual devices.

**Pros:**
- No additional software installation
- Per-app audio capture possible
- Apple-approved method

**Cons:**
- Requires macOS 13 (Ventura) or later
- Requires Objective-C/Swift bridge
- User permission prompt required

**Implementation with PyObjC:**

```python
# Note: This requires PyObjC and macOS 13+
# pip install pyobjc-framework-ScreenCaptureKit

import objc
from ScreenCaptureKit import (
    SCContentFilter,
    SCStreamConfiguration,
    SCStream,
    SCShareableContent
)
import asyncio

class ScreenCaptureKitAudio:
    """
    Uses Apple's ScreenCaptureKit for system audio capture.
    macOS 13+ only, but requires no virtual audio drivers.
    """
    
    def __init__(self):
        self.stream = None
        
    async def get_shareable_content(self):
        """Get available content for capture."""
        content = await SCShareableContent.getShareableContentWithCompletionHandler_(None)
        return content
        
    async def start_capture(self, callback):
        """Start capturing system audio."""
        content = await self.get_shareable_content()
        
        # Configure for audio-only capture
        config = SCStreamConfiguration.new()
        config.capturesAudio = True
        config.excludesCurrentProcessAudio = True  # Don't capture our own app
        config.sampleRate = 48000
        config.channelCount = 2
        
        # Create content filter for entire display
        display = content.displays()[0]
        filter = SCContentFilter.alloc().initWithDisplay_excludingApplications_exceptingWindows_(
            display, [], []
        )
        
        # Create and start stream
        self.stream = SCStream.alloc().initWithFilter_configuration_delegate_(
            filter, config, self
        )
        
        await self.stream.startCaptureWithCompletionHandler_(None)
        
    def stream_didOutputAudioSampleBuffer_(self, stream, sampleBuffer):
        """Delegate method called when audio is available."""
        # Convert CMSampleBuffer to audio data
        # Process and send to callback
        pass
```

---

### Option 3: Soundflower (Legacy)

**Status:** Deprecated, not recommended for new projects.

---

### macOS Options Comparison

| Feature | BlackHole | ScreenCaptureKit | Soundflower |
|---------|-----------|------------------|-------------|
| macOS Version | 10.14+ | 13+ | 10.9+ |
| Installation Required | Yes (brew) | No | Yes |
| User Setup Needed | Yes | No | Yes |
| Per-App Capture | No | Yes | No |
| Maintenance Status | Active | Apple-maintained | Deprecated |
| Recommended | ✅ General use | ✅ macOS 13+ | ❌ |

---

## Cross-Platform Python + PyQt Solution

### Complete Application Structure

```
arabic-subtitle-overlay/
├── main.py                 # Entry point
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── audio/
│   │   ├── __init__.py
│   │   ├── capture_windows.py   # WASAPI implementation
│   │   ├── capture_macos.py     # BlackHole/SCK implementation
│   │   └── capture_factory.py   # Platform detection
│   ├── transcription/
│   │   ├── __init__.py
│   │   └── whisper_client.py    # OpenAI Whisper API
│   ├── translation/
│   │   ├── __init__.py
│   │   └── gpt_translator.py    # GPT-5.2 translation
│   ├── ui/
│   │   ├── __init__.py
│   │   ├── main_window.py       # Control window
│   │   ├── overlay_window.py    # Subtitle overlay
│   │   └── settings_dialog.py   # Settings UI
│   └── utils/
│       ├── __init__.py
│       └── audio_utils.py
└── resources/
    └── fonts/
        └── IBMPlexSansArabic-Regular.ttf
```

### Main Application (main.py)

```python
import sys
import platform
from PyQt6.QtWidgets import QApplication
from PyQt6.QtCore import Qt
from src.ui.main_window import MainWindow
from src.audio.capture_factory import create_audio_capture

def main():
    # High DPI support
    QApplication.setHighDpiScaleFactorRoundingPolicy(
        Qt.HighDpiScaleFactorRoundingPolicy.PassThrough
    )
    
    app = QApplication(sys.argv)
    app.setStyle('Fusion')
    
    # Detect platform and create appropriate capture
    system = platform.system()
    print(f"Running on {system}")
    
    if system == "Windows":
        from src.audio.capture_windows import WASAPILoopbackCapture
        audio_capture = WASAPILoopbackCapture()
    elif system == "Darwin":  # macOS
        from src.audio.capture_macos import BlackHoleCapture
        audio_capture = BlackHoleCapture()
    else:
        raise RuntimeError(f"Unsupported platform: {system}")
    
    # Create main window
    window = MainWindow(audio_capture)
    window.show()
    
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
```

### Overlay Window (overlay_window.py)

```python
from PyQt6.QtWidgets import QWidget, QLabel, QVBoxLayout
from PyQt6.QtCore import Qt, QPoint
from PyQt6.QtGui import QFont, QColor, QPalette

class SubtitleOverlay(QWidget):
    """
    Transparent, always-on-top overlay window for subtitles.
    Supports RTL Arabic text with customizable appearance.
    """
    
    def __init__(self, parent=None):
        super().__init__(parent)
        
        # Window flags for overlay behavior
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint |
            Qt.WindowType.WindowStaysOnTopHint |
            Qt.WindowType.Tool |  # Don't show in taskbar
            Qt.WindowType.WindowTransparentForInput if not self.draggable else Qt.WindowType.Widget
        )
        
        # Transparent background
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        
        # Settings
        self.draggable = True
        self.settings = {
            'font_size': 28,
            'font_family': 'IBM Plex Sans Arabic',
            'font_color': '#F5C518',
            'bg_opacity': 0.75,
            'show_english': True,
            'english_font_size': 16,
        }
        
        self._setup_ui()
        self._apply_styles()
        
        # For dragging
        self._drag_pos = None
        
    def _setup_ui(self):
        """Create the subtitle labels."""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 15, 20, 15)
        layout.setSpacing(8)
        
        # English source text
        self.english_label = QLabel()
        self.english_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.english_label.setWordWrap(True)
        layout.addWidget(self.english_label)
        
        # Arabic translation
        self.arabic_label = QLabel()
        self.arabic_label.setAlignment(Qt.AlignmentFlag.AlignRight)  # RTL
        self.arabic_label.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
        self.arabic_label.setWordWrap(True)
        layout.addWidget(self.arabic_label)
        
        # Set minimum size
        self.setMinimumWidth(500)
        self.setMaximumWidth(900)
        
    def _apply_styles(self):
        """Apply styling from settings."""
        s = self.settings
        
        # Background with opacity
        bg_alpha = int(s['bg_opacity'] * 255)
        self.setStyleSheet(f"""
            QWidget {{
                background-color: rgba(0, 0, 0, {bg_alpha});
                border-radius: 12px;
            }}
        """)
        
        # English label style
        self.english_label.setStyleSheet(f"""
            QLabel {{
                color: #A1A1AA;
                font-family: 'Manrope', sans-serif;
                font-size: {s['english_font_size']}px;
                background: transparent;
            }}
        """)
        self.english_label.setVisible(s['show_english'])
        
        # Arabic label style
        self.arabic_label.setStyleSheet(f"""
            QLabel {{
                color: {s['font_color']};
                font-family: '{s['font_family']}', 'Arial';
                font-size: {s['font_size']}px;
                background: transparent;
            }}
        """)
        
    def update_subtitles(self, english: str, arabic: str):
        """Update the displayed subtitles."""
        self.english_label.setText(english)
        self.arabic_label.setText(arabic)
        self.adjustSize()
        
    def update_setting(self, key: str, value):
        """Update a single setting and refresh styles."""
        self.settings[key] = value
        self._apply_styles()
        
    # Dragging support
    def mousePressEvent(self, event):
        if self.draggable and event.button() == Qt.MouseButton.LeftButton:
            self._drag_pos = event.globalPosition().toPoint() - self.frameGeometry().topLeft()
            
    def mouseMoveEvent(self, event):
        if self._drag_pos and self.draggable:
            self.move(event.globalPosition().toPoint() - self._drag_pos)
            
    def mouseReleaseEvent(self, event):
        self._drag_pos = None
```

---

## Audio Processing Pipeline

### Whisper Client

```python
import openai
import io
import wave
import numpy as np

class WhisperClient:
    """Client for OpenAI Whisper speech-to-text."""
    
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
        
    async def transcribe(self, audio_data: bytes, sample_rate: int = 48000) -> str:
        """
        Transcribe audio data to text.
        
        Args:
            audio_data: Raw PCM audio bytes
            sample_rate: Sample rate of the audio
            
        Returns:
            Transcribed text
        """
        # Convert raw PCM to WAV format for API
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, 'wb') as wav:
            wav.setnchannels(2)
            wav.setsampwidth(2)  # 16-bit
            wav.setframerate(sample_rate)
            wav.writeframes(audio_data)
        
        wav_buffer.seek(0)
        wav_buffer.name = "audio.wav"
        
        # Send to Whisper API
        response = await self.client.audio.transcriptions.create(
            model="whisper-1",
            file=wav_buffer,
            language="en"
        )
        
        return response.text
```

### GPT Translator

```python
import openai

class GPTTranslator:
    """Translates text to Modern Standard Arabic using GPT-5.2."""
    
    SYSTEM_PROMPT = """You are a professional translator specializing in Modern Standard Arabic (MSA / الفصحى).
Your task is to translate English text to Modern Standard Arabic.
Rules:
1. Use only Modern Standard Arabic (الفصحى), not dialects
2. Return ONLY the Arabic translation, nothing else
3. Maintain the meaning and tone of the original text
4. Use proper Arabic grammar and punctuation
5. Do not add explanations or notes"""

    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
        
    async def translate(self, text: str) -> str:
        """
        Translate English text to Arabic.
        
        Args:
            text: English text to translate
            
        Returns:
            Arabic translation
        """
        if not text.strip():
            return ""
            
        response = await self.client.chat.completions.create(
            model="gpt-5.2",
            messages=[
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user", "content": f"Translate to Arabic: {text}"}
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        return response.choices[0].message.content.strip()
```

---

## Dependencies and Setup

### requirements.txt

```
# Core
PyQt6>=6.6.0
openai>=1.0.0
numpy>=1.24.0

# Windows audio (install on Windows only)
PyAudioWPatch>=0.2.12; sys_platform == 'win32'

# macOS audio
sounddevice>=0.4.6; sys_platform == 'darwin'
# pyobjc-framework-ScreenCaptureKit>=9.0; sys_platform == 'darwin'  # For SCK option

# Audio processing
scipy>=1.11.0
pydub>=0.25.1

# Async support
aiohttp>=3.9.0
asyncio>=3.4.3
```

### Installation

**Windows:**
```bash
pip install -r requirements.txt
```

**macOS:**
```bash
# Install BlackHole first
brew install blackhole-2ch

# Then Python dependencies
pip install -r requirements.txt
```

---

## Trade-offs and Considerations

### Windows (WASAPI)
| Aspect | Details |
|--------|---------|
| **Pros** | Zero additional software, low latency, captures all system audio |
| **Cons** | Windows-only, no per-app capture |
| **Recommendation** | Best option for Windows users |

### macOS (BlackHole)
| Aspect | Details |
|--------|---------|
| **Pros** | Free, well-maintained, works on macOS 10.14+ |
| **Cons** | Requires installation, manual Multi-Output setup |
| **Recommendation** | Best general-purpose option for macOS |

### macOS (ScreenCaptureKit)
| Aspect | Details |
|--------|---------|
| **Pros** | No extra software, per-app capture, Apple-approved |
| **Cons** | macOS 13+ only, more complex implementation |
| **Recommendation** | Best for macOS 13+ when you need per-app capture |

### Performance Considerations

1. **Chunk Duration**: 3-5 seconds is optimal
   - Shorter = more API calls, lower latency
   - Longer = fewer calls, more context for Whisper

2. **Audio Quality**: 16kHz is sufficient for speech
   - Downsampling from 48kHz reduces bandwidth

3. **Rate Limiting**: Consider Whisper API limits
   - Batch requests if needed
   - Local Whisper model as fallback

---

## Next Steps

1. **Download this plan** and implement locally
2. **Choose your target platform** (Windows-first or cross-platform)
3. **Get OpenAI API key** for Whisper and GPT-5.2
4. **For macOS**: Install BlackHole and configure Multi-Output Device
5. **Test incrementally**: Audio capture → Transcription → Translation → UI

---

*This document was generated as part of the Live Arabic Subs MVP. The web-based version is available at the deployed URL.*
