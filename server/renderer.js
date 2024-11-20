const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const video = document.querySelector('video');

let ws;

// Start streaming
startButton.addEventListener('click', async () => {
  // Connect to WebSocket server
  ws = new WebSocket('ws://localhost:8080');

  ws.onopen = () => {
    console.log('Connected to WebSocket server');
  };

  ws.onmessage = (event) => {
    console.log('Message from server:', event.data);
  };

  // Request the main process to start capturing the screen
  window.electron.startStream();

  // Handle the selected screen source from the main process
  window.electron.onScreenSourceSelected(async (sourceId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false, // Add audio capture if needed
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
          },
        },
      });

      video.srcObject = stream;
      video.play();

      // Send the captured stream frames to the WebSocket server
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp8' });
      mediaRecorder.ondataavailable = (event) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(event.data);
        }
      };

      mediaRecorder.start(100); // Send data every 100ms

      stopButton.addEventListener('click', () => {
        mediaRecorder.stop();
        stream.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
        if (ws) ws.close();
      });
    } catch (error) {
      console.error('Error capturing screen:', error);
    }
  });
});
