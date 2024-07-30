let token = localStorage.getItem('token');
const socket = io('https://live-stream-server-j6mk.onrender.com', {
    query: { token },
});

const videoElement = document.getElementById('video');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const loginButton = document.getElementById('loginButton');
const loginError = document.getElementById('loginError');
const messageInput = document.getElementById('messageInput');
const sendMessageButton = document.getElementById('sendMessage');
const messagesElement = document.getElementById('messages');
let mediaRecorder;
let stream;
let mediaSource = new MediaSource();
let sourceBuffer;

videoElement.src = URL.createObjectURL(mediaSource);

mediaSource.addEventListener('sourceopen', () => {
    sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8, vorbis"');
    console.log('Source buffer opened');
});

loginButton.addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.accessToken);
            token = data.accessToken;
            document.getElementById('login').style.display = 'none';
            document.getElementById('stream').style.display = 'block';
            socket.io.opts.query = { token };
            socket.connect();
        } else {
            loginError.textContent = data.message;
        }
    } catch (error) {
        loginError.textContent = 'Error logging in. Please try again.';
    }
});

startButton.addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(mediaStream => {
            stream = mediaStream;
            videoElement.srcObject = stream;
            videoElement.play();
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    console.log('Sending data:', event.data); // Log the data being sent
                    socket.emit('startStream', event.data);
                }
            };

            mediaRecorder.start(1000); // Adjust time slice as needed
        })
        .catch(error => {
            console.error('Error accessing media devices.', error);
        });
});

stopButton.addEventListener('click', () => {
    if (mediaRecorder) {
        mediaRecorder.stop();
        socket.emit('stopStream');
    }
    if (stream) {
        stream.getTracks().forEach(track => track.stop()); // Stop all media tracks
        videoElement.srcObject = null; // Clear video element source
    }
    if (sourceBuffer) {
        sourceBuffer.abort(); // Stop appending data
    }
    if (mediaSource) {
        mediaSource.endOfStream(); // End the media source
    }
});

socket.on('streamData', (data) => {
    console.log('Received stream data:', data);
    if (sourceBuffer && !sourceBuffer.updating) {
        sourceBuffer.appendBuffer(new Uint8Array(data)); // Ensure the data is correctly formatted
    }
});

socket.on('streamStopped', () => {
    console.log('Stream stopped');
    if (sourceBuffer) {
        sourceBuffer.abort(); // Stop appending data
    }
    mediaSource.endOfStream();
    videoElement.srcObject = null;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});

// Chat feature
sendMessageButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('chatMessage', { username: 'User', text: message });
        messageInput.value = '';
    }
});

socket.on('chatMessage', (message) => {
    if (message.username && message.text) {
        const messageElement = document.createElement('div');
        const lastMessageElement = messagesElement.lastElementChild;

        // Check if the previous message was from the same user
        if (lastMessageElement && lastMessageElement.dataset.username === message.username) {
            messageElement.textContent = `${message.username}: ${message.text}`;
        } else {
            messageElement.textContent = `${message.username}: ${message.text}`;
        }

        messageElement.dataset.username = message.username;
        messagesElement.appendChild(messageElement);
        messagesElement.scrollTop = messagesElement.scrollHeight; // Scroll to the bottom
    } else {
        console.error('Received chat message with missing username or text');
    }
});
