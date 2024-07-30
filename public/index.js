let token = localStorage.getItem('token');
const socket = io('http://localhost:3000', {
    query: { token },
});

const videoElement = document.getElementById('video');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const loginButton = document.getElementById('loginButton');
const loginError = document.getElementById('loginError');
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

            stopButton.addEventListener('click', () => {
                mediaRecorder.stop();
                socket.emit('stopStream');
            });
        })
        .catch(error => {
            console.error('Error accessing media devices.', error);
        });
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
