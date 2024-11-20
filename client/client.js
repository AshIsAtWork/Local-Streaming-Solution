const connectButton = document.getElementById('connectButton');
const videoElement = document.getElementById('video');

// WebSocket connection to the server
let ws;

// Media Source Extensions (MSE) for handling the video stream
const mediaSource = new MediaSource();
videoElement.src = URL.createObjectURL(mediaSource);
let sourceBuffer;

// Handle media source opened
mediaSource.addEventListener('sourceopen', () => {
  console.log('MediaSource opened');
  // Ensure the codec matches what the server sends
  sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"'); // Adjust codec if needed

  sourceBuffer.addEventListener('updateend', () => {
    console.log('SourceBuffer update ended');
    videoElement.play(); // Force video to play after buffer is updated
  });
});

connectButton.addEventListener('click', () => {
  // Connect to the WebSocket server
  ws = new WebSocket('ws://localhost:8080');
  ws.binaryType = 'arraybuffer';

  ws.onopen = () => {
    console.log('Connected to WebSocket server');
    connectButton.disabled = true;
  };

  ws.onmessage = (event) => {
    const videoChunk = new Uint8Array(event.data);
    console.log('Received video chunk:', videoChunk); // Log the chunk data for debugging

    // Check if the mediaSource is ready and the sourceBuffer is not updating
    if (mediaSource.readyState === 'open' && !sourceBuffer.updating) {
      try {
        sourceBuffer.appendBuffer(videoChunk);
        console.log('Appended video chunk:', videoChunk);
      } catch (e) {
        console.error('Error appending buffer:', e);
      }
    } else {
      console.warn('SourceBuffer is updating, cannot append new data.');
    }
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed');
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
});
