const startButton = document.getElementById('startButton');
const localVideo = document.getElementById('localVideo');

let localStream;

startButton.onclick = async () => {
    // Get media stream from the user's device
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        localVideo.srcObject = localStream;
    } catch (e) {
        console.error('Error accessing media devices.', e);
        return;
    }

    // Setup WebRTC Peer Connection
    const peerConnection = new RTCPeerConnection();

    // Add local stream to the connection
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    // Define the emergency contact signaling server URL
    const signalingServerUrl = 'wss://your-signaling-server.com';

    const signalingServer = new WebSocket(signalingServerUrl);

    signalingServer.onopen = () => {
        console.log('Connected to the signaling server');
        // Create an offer to send to the emergency contact
        peerConnection.createOffer()
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => {
                signalingServer.send(JSON.stringify({ offer: peerConnection.localDescription }));
            });
    };

    // Handle incoming messages from the signaling server
    signalingServer.onmessage = message => {
        const data = JSON.parse(message.data);

        if (data.answer) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }

        if (data.candidate) {
            peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    };

    // Send any ICE candidates to the other peer
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            signalingServer.send(JSON.stringify({ candidate: event.candidate }));
        }
    };

    // Handle remote stream (emergency contact’s video/audio)
    peerConnection.ontrack = event => {
        const [remoteStream] = event.streams;
        // Attach remote stream to a video element or handle as needed
    };

    // Automatically call emergency contacts when the stream starts
    signalingServer.send(JSON.stringify({ type: 'SOS', contacts: ['contact1@example.com', 'contact2@example.com'] }));
};