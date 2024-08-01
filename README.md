# Live Streaming Project

## Overview
This project is a live streaming application that allows an admin to start a stream and viewers to join and watch it. The application features a login system for both admin and viewers and includes a live chat feature for interaction during the stream.

## Features
- **Admin**: Can start the stream using admin credentials.
- **Viewer**: Can join the stream using viewer credentials.
- **Live Chat**: Viewers can send and receive chat messages during the stream.

## Prerequisites
To set up and run this project, you'll need the following:

1. **Node.js**: Ensure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org/).

2. **npm**: Node.js comes with npm, but you can check or install it separately from [npm's website](https://www.npmjs.com/get-npm).

3. **NestJS**: This project uses NestJS for the backend. You'll install it via npm.

4. **MediaSource API**: Make sure your browser supports the MediaSource API for video streaming.

## Installation

### 1. Clone the Repository
First, clone the repository to your local machine:

```bash
git clone [<repository-url>](https://github.com/PreritKhandelwal98/live-stream-server)
cd live-stream-server
```

### 2. Install Backend Dependencies
```bash
npm install
```


## Setup

### 1. Start the Backend Server
Navigate to the directory and run:

```bash
npm run start
```

The backend server will start and listen for connections.


## Usage

### Admin Login
- **Username**: `admin`
- **Password**: `admin`

Log in with these credentials to start the stream. Click on the "Start Streaming" button to begin.

### Viewer Login
- **Username**: `test`
- **Password**: `test`

Log in with these credentials to join the stream. You can watch the stream and participate in the chat.

## Project Structure

- **`backend/`** - Contains the NestJS backend server.
  - `src/`
    - `auth/` - Authentication-related files.
    - `live-stream/` - Live streaming functionality.
    - `app.module.ts` - Main module importing other modules.
    - `main.ts` - Entry point for the NestJS application.
- **`public/`** - Contains the frontend assets.
  - `index.html` - Main HTML file for the live streaming interface.
  - `index.js` - JavaScript file handling video streaming, login functionality, and chat.
  - `styles.css` - Styles for the project.

## API Endpoints

The backend server handles real-time communication and streaming via WebSockets. Make sure the frontend and backend are properly connected for the application to function.

## Troubleshooting

- **Video not loading**: Ensure that your browser supports the MediaSource API and that the backend server is running.
- **Login issues**: Verify that the credentials are correct and that the backend server is handling authentication properly.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [NestJS](https://nestjs.com/) for the backend framework.
- [Socket.io](https://socket.io/) for real-time communication.
- [MediaSource API](https://developer.mozilla.org/en-US/docs/Web/API/MediaSource) for handling streaming media.

```

### Key Sections:
- **Overview**: Brief description of the project and its features.
- **Prerequisites**: Necessary tools and libraries.
- **Installation**: Steps to set up both backend and frontend.
- **Setup**: Instructions on starting both backend and frontend servers.
- **Usage**: How to log in as admin or viewer and use the application.
- **Project Structure**: Description of the project’s directory and files.
- **API Endpoints**: Mention of WebSocket usage for real-time communication.
- **Troubleshooting**: Common issues and solutions.
- **License**: Information on licensing.
- **Acknowledgments**: Credits for external libraries and frameworks.
