/**
 * Live Arabic Subs - Offscreen Document (ROLLBACK VERSION)
 * Simplified version to test basic functionality
 */

let mediaStream = null;
let mediaRecorder = null;
let audioChunks = [];
let chunkInterval = null;
let chunkDuration = 4000;

// Handle messages from service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Offscreen] Received message:', message);
  
  if (message.target !== 'offscreen') return;

  switch (message.type) {
    case 'START_AUDIO_CAPTURE':
      console.log('[Offscreen] Starting capture with streamId:', message.streamId);
      startCapture(message.streamId, message.chunkDuration || 4000);
      sendResponse({ success: true });
      break;

    case 'STOP_AUDIO_CAPTURE':
      console.log('[Offscreen] Stopping capture');
      stopCapture();
      sendResponse({ success: true });
      break;
  }

  return true;
});

async function startCapture(streamId, duration) {
  chunkDuration = duration;
  console.log('[Offscreen] Starting capture with constraints');

  try {
    // SIMPLIFIED VERSION - Basic tab audio capture
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      }
    });

    console.log('[Offscreen] Got media stream, tracks:', mediaStream.getAudioTracks().length);

    // Create MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
      ? 'audio/webm;codecs=opus' 
      : 'audio/webm';

    mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType,
      audioBitsPerSecond: 128000
    });

    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      console.log('[Offscreen] Data available, size:', event.data.size);
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      console.log('[Offscreen] Recorder stopped, chunks:', audioChunks.length);
      if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        audioChunks = [];

        // Convert to base64 and send to service worker
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          console.log('[Offscreen] Sending audio chunk to background');
          
          chrome.runtime.sendMessage({
            type: 'AUDIO_CHUNK',
            target: 'background',
            data: base64
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('[Offscreen] Failed to send message:', chrome.runtime.lastError);
            } else {
              console.log('[Offscreen] Message sent successfully');
            }
          });
        };
        reader.readAsDataURL(audioBlob);
      }
    };

    // Start recording
    mediaRecorder.start();
    console.log('[Offscreen] MediaRecorder started');

    // Process chunks at interval
    chunkInterval = setInterval(() => {
      console.log('[Offscreen] Processing chunk interval');
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        setTimeout(() => {
          if (mediaRecorder && mediaRecorder.state === 'inactive') {
            mediaRecorder.start();
            console.log('[Offscreen] Restarted recording');
          }
        }, 100);
      }
    }, chunkDuration);

    console.log('[Offscreen] Audio capture fully started');
  } catch (error) {
    console.error('[Offscreen] Failed to start capture:', error);
  }
}

function stopCapture() {
  console.log('[Offscreen] Stopping capture');
  
  if (chunkInterval) {
    clearInterval(chunkInterval);
    chunkInterval = null;
  }

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  mediaRecorder = null;

  if (mediaStream) {
    mediaStream.getTracks().forEach(track => {
      console.log('[Offscreen] Stopping track:', track.kind);
      track.stop();
    });
    mediaStream = null;
  }

  audioChunks = [];
  console.log('[Offscreen] Audio capture completely stopped');
}

console.log('[Live Arabic Subs] Offscreen document loaded (DEBUG VERSION)');