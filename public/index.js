const videoElement = document.getElementById('video');
const loginButton = document.getElementById('loginButton');
const loginError = document.getElementById('loginError');
const messageInput = document.getElementById('messageInput');
const sendMessageButton = document.getElementById('sendMessage');
const messagesElement = document.getElementById('messages');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');

let mediaRecorder;
let stream;
let mediaSource;
let sourceBuffer;
let isSourceBufferUpdating = false;
let username;
let isAdmin = false;
const queue = [];
let mediaStream = new MediaStream();
videoElement.srcObject = mediaStream;

let token = localStorage.getItem('token');
const socket = io('http://localhost:3000/', {
    query: { token },
});

let peerConnection;
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const iceCandidatesQueue = [];

function initializePeerConnection() {
    if (peerConnection) {
        return;
    }

    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = ({ candidate }) => {
        if (candidate) {
            socket.emit('iceCandidate', candidate);
        }
    };

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
            mediaStream.addTrack(track);
        });
    };

    peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'failed') {
            console.error('Peer connection failed');
        }
    };

    peerConnection.onsignalingstatechange = () => {
        console.log('Signaling state change:', peerConnection.signalingState);
    };

    peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state change:', peerConnection.iceConnectionState);
    };
}

function initializeMediaSource() {
    console.log('Initializing MediaSource...');
    mediaSource = new MediaSource();
    videoElement.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener('sourceopen', onSourceOpen);
    mediaSource.addEventListener('sourceended', () => {
        console.log('MediaSource ended');
    });
    mediaSource.addEventListener('error', (e) => {
        console.error('MediaSource error:', e);
    });
}

function onSourceOpen() {
    console.log('MediaSource opened');
    try {
        sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8, opus"');
        console.log('SourceBuffer added');

        sourceBuffer.addEventListener('updateend', () => {
            console.log('SourceBuffer updateend event');
            isSourceBufferUpdating = false;
            if (queue.length > 0) {
                console.log('Queue length:', queue.length);
                appendBuffer(queue.shift());
            }
        });

        sourceBuffer.addEventListener('error', (e) => {
            console.error('SourceBuffer error:', e);
            resetMediaSource();
        });

        while (queue.length > 0) {
            appendBuffer(queue.shift());
        }

    } catch (e) {
        console.error('Error adding SourceBuffer:', e);
        resetMediaSource();
    }
}

function appendBuffer(data) {
    console.log('Appending buffer, length:', data.byteLength);
    if (sourceBuffer && mediaSource.readyState === 'open' && !isSourceBufferUpdating) {
        isSourceBufferUpdating = true;
        try {
            sourceBuffer.appendBuffer(new Uint8Array(data));
            console.log('Buffer appended, length:', data.byteLength);
        } catch (e) {
            console.error('Error appending buffer:', e);
            resetMediaSource();
        }
    } else {
        queue.push(data);
        console.log('Buffer queued, length:', data.byteLength);
    }
}

function resetMediaSource() {
    console.log('Resetting MediaSource');
    if (mediaSource) {
        if (mediaSource.readyState === 'open') {
            try {
                mediaSource.endOfStream();
            } catch (e) {
                console.error('Error ending MediaSource:', e);
            }
        }
        mediaSource = null;
        sourceBuffer = null;
        videoElement.src = '';
    }
}

loginButton.addEventListener('click', async () => {
    const usernameInput = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: usernameInput, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.accessToken);
            token = data.accessToken;
            username = usernameInput;
            isAdmin = (usernameInput === 'admin' && password === 'admin');
            document.getElementById('login').style.display = 'none';
            document.getElementById('stream').style.display = 'block';
            updateUIForUserRole();
            socket.io.opts.query = { token, username };
            socket.connect();
        } else {
            loginError.textContent = data.message;
        }
    } catch (error) {
        loginError.textContent = 'Error logging in. Please try again.';
    }
});

function updateUIForUserRole() {
    if (isAdmin) {
        startButton.style.display = 'block';
        stopButton.style.display = 'block';
    } else {
        startButton.style.display = 'none';
        stopButton.style.display = 'none';
    }
}

startButton.addEventListener('click', () => {
    initializePeerConnection();
    initializeMediaSource();

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(mediaStream => {
            stream = mediaStream;
            videoElement.srcObject = stream;
            videoElement.play();
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    event.data.arrayBuffer().then(arrayBuffer => {
                        socket.emit('streamData', arrayBuffer);
                    });
                }
            };

            mediaRecorder.start(1000);

            stream.getTracks().forEach(track => {
                peerConnection.addTrack(track, stream);
            });

            peerConnection.createOffer()
                .then(offer => peerConnection.setLocalDescription(offer))
                .then(() => {
                    socket.emit('offer', peerConnection.localDescription);
                })
                .catch(error => {
                    console.error('Error creating or sending offer:', error);
                });
        })
        .catch(error => {
            console.error('Error accessing media devices.', error);
        });
});

stopButton.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
        socket.emit('stopStream');
    }
    videoElement.srcObject = null;
    mediaStream = new MediaStream();
    videoElement.srcObject = mediaStream;
});

sendMessageButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('chatMessage', { user: username, message });
        messageInput.value = '';
    }
});

socket.on('streamData', (data) => {
    console.log('Received data, length:', data.byteLength);
    if (!mediaSource) {
        initializeMediaSource();
    }

    if (mediaSource.readyState === 'open') {
        appendBuffer(data);
    } else {
        queue.push(data);
    }
});

socket.on('iceCandidate', (candidate) => {
    if (!peerConnection) initializePeerConnection();
    if (peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(error => {
            console.error('Error adding ICE candidate:', error);
        });
    } else {
        iceCandidatesQueue.push(candidate);
    }
});

socket.on('offer', (offer) => {
    if (!peerConnection) initializePeerConnection();
    if (peerConnection.signalingState !== 'stable') {
        console.warn('Unexpected signaling state:', peerConnection.signalingState);
        return;
    }
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => peerConnection.createAnswer())
        .then(answer => peerConnection.setLocalDescription(answer))
        .then(() => {
            socket.emit('answer', peerConnection.localDescription);
            while (iceCandidatesQueue.length > 0) {
                const candidate = iceCandidatesQueue.shift();
                peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(error => {
                    console.error('Error adding queued ICE candidate:', error);
                });
            }
        })
        .catch(error => {
            console.error('Error handling offer:', error);
        });
});

socket.on('answer', (answer) => {
    if (!peerConnection) {
        console.warn('Peer connection is not initialized');
        return;
    }
    if (peerConnection.signalingState === 'have-local-offer') {
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer)).catch(error => {
            console.error('Error setting remote description for answer:', error);
        });
    } else {
        console.warn('Unexpected signaling state when setting answer:', peerConnection.signalingState);
    }
});

socket.on('chatMessage', ({ user, message }) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = `${user}: ${message}`;
    messagesElement.appendChild(messageElement);
    messagesElement.scrollTop = messagesElement.scrollHeight;
});

socket.on('stopStream', () => {
    if (videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
    }
    resetMediaSource();
});

window.addEventListener('beforeunload', () => {
    if (peerConnection) {
        peerConnection.close();
    }
    socket.disconnect();
});
