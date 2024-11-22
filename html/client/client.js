document.getElementById('connectBtn').addEventListener('click', connectToBroadcast);

let videoElement = document.getElementById('video');
let ws;
let pc;

function connectToBroadcast() {
    ws = new WebSocket('ws://localhost:8080');
    pc = new RTCPeerConnection();

    ws.onopen = () => {
        console.log('WebSocket connected for client.');
        ws.send(JSON.stringify({ type: 'watcher' }));
    };

    ws.onmessage = async (event) => {
        // Handle Blob data by converting it to text
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const message = JSON.parse(reader.result);
                
                if (message.type === 'offer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    ws.send(JSON.stringify({ type: 'answer', answer, id: message.id }));
                }

                if (message.type === 'candidate') {
                    await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
                }
            } catch (err) {
                console.error('Failed to parse message:', reader.result, err);
            }
        };
        reader.readAsText(event.data);
    };

    pc.ontrack = (event) => {
        videoElement.srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
        }
    };
}
