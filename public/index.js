const socket = io('http://localhost:3000');

const videoElement = document.getElementById('video');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
let mediaRecorder;
let stream;
let mediaSource = new MediaSource();
let sourceBuffer;
videoElement.src = URL.createObjectURL(mediaSource);

mediaSource.addEventListener('sourceopen', () => {
    sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8, vorbis"');
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
    if (sourceBuffer && !sourceBuffer.updating) {
        sourceBuffer.appendBuffer(data);
    }
});

socket.on('streamStopped', () => {
    if (sourceBuffer) {
        sourceBuffer.abort(); // Stop appending data
    }
    mediaSource.endOfStream();
    videoElement.srcObject = null;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});
