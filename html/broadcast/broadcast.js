document.getElementById('startBtn').addEventListener('click', startBroadcast);

let videoElement = document.getElementById('video');
let ws;
let peerConnections = {};

async function startBroadcast() {
    ws = new WebSocket('ws://localhost:8080');

    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    videoElement.srcObject = screenStream;

    ws.onopen = () => {
        console.log('WebSocket connected for broadcasting.');
        ws.send(JSON.stringify({ type: 'broadcaster' }));
    };

    ws.onmessage = async (event) => {
        // Handle Blob data by converting it to text
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const message = JSON.parse(reader.result);

                if (message.type === 'watcher') {
                    const pc = new RTCPeerConnection();
                    screenStream.getTracks().forEach((track) => pc.addTrack(track, screenStream));

                    pc.onicecandidate = (event) => {
                        if (event.candidate) {
                            ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate, id: message.id }));
                        }
                    };

                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    ws.send(JSON.stringify({ type: 'offer', offer, id: message.id }));

                    peerConnections[message.id] = pc;
                }

                if (message.type === 'answer') {
                    const pc = peerConnections[message.id];
                    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(message.answer));
                }

                if (message.type === 'candidate') {
                    const pc = peerConnections[message.id];
                    if (pc) await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
                }
            } catch (err) {
                console.error('Failed to parse message:', reader.result, err);
            }
        };
        reader.readAsText(event.data);
    };

    ws.onclose = () => console.log('WebSocket closed.');
}
