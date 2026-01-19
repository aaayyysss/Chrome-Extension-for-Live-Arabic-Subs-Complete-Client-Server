import React, { useRef, useCallback, useEffect } from 'react';
import { useSubtitle } from '../context/SubtitleContext';
import { Mic, Monitor, Square, Settings, Subtitles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function Dashboard({ onOpenSettings }) {
  const {
    isCapturing,
    setIsCapturing,
    audioSource,
    setAudioSource,
    updateSubtitles,
    clearSubtitles,
    setIsOverlayVisible,
  } = useSubtitle();

  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);

  const processAudioChunk = useCallback(async (audioBlob) => {
    if (audioBlob.size < 1000) return; // Skip very small chunks
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');

      const response = await fetch(`${API}/transcribe-and-translate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.arabic_text) {
        updateSubtitles(data.english_text, data.arabic_text);
      }
    } catch (error) {
      console.error('Processing error:', error);
    }
  }, [updateSubtitles]);

  const startCapture = useCallback(async () => {
    try {
      let stream;

      if (audioSource === 'microphone') {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
          },
        });
        toast.success('Microphone connected');
      } else {
        // Tab audio capture using getDisplayMedia
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true, // Required for getDisplayMedia
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
        
        // Stop the video track as we only need audio
        stream.getVideoTracks().forEach(track => track.stop());
        
        // Check if we got audio
        if (stream.getAudioTracks().length === 0) {
          throw new Error('No audio track available. Make sure to enable "Share tab audio" when selecting the tab.');
        }
        toast.success('Tab audio connected');
      }

      audioStreamRef.current = stream;

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          await processAudioChunk(audioBlob);
          audioChunksRef.current = [];
        }
      };

      // Start recording
      mediaRecorder.start();
      setIsCapturing(true);
      setIsOverlayVisible(true);

      // Process audio every 4 seconds
      recordingIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.start();
        }
      }, 4000);

    } catch (error) {
      console.error('Capture error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Permission denied. Please allow access to continue.');
      } else {
        toast.error(error.message || 'Failed to start capture');
      }
    }
  }, [audioSource, processAudioChunk, setIsCapturing, setIsOverlayVisible]);

  const stopCapture = useCallback(() => {
    // Clear interval
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    // Stop recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    // Stop stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    setIsCapturing(false);
    clearSubtitles();
    toast.info('Capture stopped');
  }, [setIsCapturing, clearSubtitles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{
        background: 'radial-gradient(circle at 50% 0%, #1a1a1a 0%, #050505 100%)',
      }}
      data-testid="dashboard"
    >
      {/* Logo/Title */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Subtitles className="w-10 h-10 text-blue-500" />
          <h1 className="text-4xl font-bold tracking-tight">Live Arabic Subs</h1>
        </div>
        <p className="text-zinc-400 text-lg">Real-time English to Arabic subtitle translation</p>
      </div>

      {/* Audio Source Selector */}
      <div className="glass-panel rounded-2xl p-6 mb-8 w-full max-w-md" data-testid="audio-source-selector">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">
          Audio Source
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => setAudioSource('microphone')}
            disabled={isCapturing}
            className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl transition-all ${
              audioSource === 'microphone'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50'
            } ${isCapturing ? 'opacity-50 cursor-not-allowed' : ''}`}
            data-testid="source-microphone"
          >
            <Mic className="w-5 h-5" />
            <span className="font-medium">Microphone</span>
          </button>
          <button
            onClick={() => setAudioSource('tab')}
            disabled={isCapturing}
            className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl transition-all ${
              audioSource === 'tab'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50'
            } ${isCapturing ? 'opacity-50 cursor-not-allowed' : ''}`}
            data-testid="source-tab"
          >
            <Monitor className="w-5 h-5" />
            <span className="font-medium">Browser Tab</span>
          </button>
        </div>
      </div>

      {/* Main Control Button */}
      <div className="mb-8">
        {!isCapturing ? (
          <Button
            onClick={startCapture}
            size="lg"
            className="h-20 px-12 text-xl font-semibold rounded-full bg-blue-600 hover:bg-blue-700 transition-all hover:scale-105"
            data-testid="start-capture-btn"
          >
            <Mic className="w-6 h-6 mr-3" />
            Start Capture
          </Button>
        ) : (
          <Button
            onClick={stopCapture}
            size="lg"
            className="h-20 px-12 text-xl font-semibold rounded-full bg-red-600 hover:bg-red-700 recording-indicator"
            data-testid="stop-capture-btn"
          >
            <Square className="w-6 h-6 mr-3" />
            Stop Capture
          </Button>
        )}
      </div>

      {/* Audio Visualizer (when capturing) */}
      {isCapturing && (
        <div className="flex items-center gap-1 mb-8" data-testid="audio-visualizer">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-blue-500 rounded-full audio-wave"
              style={{
                animationDelay: `${i * 0.1}s`,
                height: '20px',
              }}
            />
          ))}
        </div>
      )}

      {/* Settings Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenSettings}
        className="fixed top-6 right-6 w-12 h-12 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50"
        data-testid="settings-btn"
      >
        <Settings className="w-5 h-5" />
      </Button>

      {/* Instructions */}
      <div className="mt-8 text-center text-zinc-500 text-sm max-w-md">
        <p className="mb-2">
          <strong>Microphone:</strong> Captures your voice or ambient audio
        </p>
        <p>
          <strong>Browser Tab:</strong> Captures audio from a tab (enable "Share tab audio")
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
