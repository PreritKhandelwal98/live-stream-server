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
const queue = [];
let isAdmin = false;
let mediaStream = new MediaStream();
videoElement.srcObject = mediaStream;

let token = localStorage.getItem('token');
const socket = io('https://live-stream-server-j6mk.onrender.com/', {
    query: { token },
});

function initializeMediaSource() {
    mediaSource = new MediaSource();
    videoElement.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener('sourceopen', () => {
        try {
            sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8, opus"');
            console.log('Source buffer opened');

            sourceBuffer.addEventListener('updateend', () => {
                isSourceBufferUpdating = false;
                console.log('SourceBuffer update ended');
                if (queue.length > 0) {
                    appendBuffer(queue.shift());
                }
            });

            sourceBuffer.addEventListener('error', (e) => {
                console.error('SourceBuffer error:', e);
                resetMediaSource();
            });
        } catch (e) {
            console.error('Error adding SourceBuffer:', e);
            resetMediaSource();
        }
    });
}

function appendBuffer(data) {
    if (sourceBuffer && mediaSource.readyState === 'open' && !isSourceBufferUpdating) {
        isSourceBufferUpdating = true;
        try {
            sourceBuffer.appendBuffer(new Uint8Array(data));
        } catch (e) {
            console.error('Error appending buffer:', e);
            resetMediaSource();
        }
    } else {
        queue.push(data);
    }
}

function resetMediaSource() {
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
        const response = await fetch('https://live-stream-server-j6mk.onrender.com/auth/login', {
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
                        console.log('Sending data:', arrayBuffer.byteLength);
                        socket.emit('streamData', arrayBuffer);
                    });
                }
            };

            mediaRecorder.start(1000); // Send data in 1-second intervals
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
});

socket.on('streamData', (data) => {
    appendBuffer(data);
});

socket.on('streamStopped', () => {
    console.log('Stream stopped');
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = new MediaStream();
    videoElement.srcObject = mediaStream;
});

sendMessageButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('chatMessage', { username, text: message });
        messageInput.value = '';
    }
});

socket.on('chatMessage', (message) => {
    if (message.username && message.text) {
        const messageElement = document.createElement('div');
        const lastMessageElement = messagesElement.lastElementChild;

        if (lastMessageElement && lastMessageElement.dataset.username === message.username) {
            messageElement.textContent = `${message.text}`;
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
