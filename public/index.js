let token = localStorage.getItem('token');
const socket = io('http://localhost:3000/', {
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
let username;
let isAdmin = false;

videoElement.src = URL.createObjectURL(mediaSource);

mediaSource.addEventListener('sourceopen', () => {
    try {
        sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8, vorbis"');
        console.log('Source buffer opened');
    } catch (e) {
        console.error('Error adding SourceBuffer:', e);
    }
});

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
            socket.io.opts.query = { token, username }; // Pass username to socket
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
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(mediaStream => {
            stream = mediaStream;
            videoElement.srcObject = stream;
            videoElement.play();
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    console.log('Sending data:', event.data);
                    socket.emit('startStream', event.data);
                }
            };

            mediaRecorder.start(1000);
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
        stream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
    }
    if (sourceBuffer) {
        sourceBuffer.abort();
    }
    if (mediaSource) {
        mediaSource.endOfStream();
    }
});

socket.on('streamData', (data) => {
    console.log('Received stream data:', data);
    if (sourceBuffer && !sourceBuffer.updating) {
        try {
            sourceBuffer.appendBuffer(new Uint8Array(data));
        } catch (error) {
            console.error('Error appending buffer:', error);
            mediaSource.endOfStream();
        }
    } else {
        console.log('Buffer is updating, queueing data');
    }
});

socket.on('streamStopped', () => {
    console.log('Stream stopped');
    if (sourceBuffer) {
        sourceBuffer.abort();
    }
    mediaSource.endOfStream();
    videoElement.srcObject = null;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});

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

        if (lastMessageElement && lastMessageElement.dataset.username === message.username) {
            messageElement.textContent = `${message.username}: ${message.text}`;
        } else {
            messageElement.textContent = `${message.username}: ${message.text}`;
        }

        messageElement.dataset.username = message.username;
        messagesElement.appendChild(messageElement);
        messagesElement.scrollTop = messagesElement.scrollHeight;
    } else {
        console.error('Received chat message with missing username or text');
    }
});
