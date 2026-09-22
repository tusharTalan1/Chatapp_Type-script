# ChatApp v2

A robust, real-time chat application built with **Node.js, Express, TypeScript, Socket.IO, and MongoDB**.

## Features
- **Strict WebSocket Connection**: Polling is completely disabled.
- **JWT Authentication**: Secure login and registration.
- **Socket Authentication**: Real-time connections are intercepted and validated using JWT.
- **Glassmorphism UI**: Beautiful, custom-designed Vanilla CSS frontend.
- **Real-time Messaging**: Create and join rooms dynamically.

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas (or a local MongoDB instance)

### 2. Environment Variables
Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@yourcluster.mongodb.net/?appName=ChatAppTsCluster
JWT_SECRET=your_super_secret_key
```

### 3. Installation
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

### 4. Running the App
Start the development server with live-reloading (via nodemon & tsx):
```bash
npm run dev
```
The server will start on `http://localhost:3000`.

To view the frontend, simply open `client/index.html` in your browser.

---

## REST API Endpoints

All HTTP routes are prepended with `/api/auth`.

### 1. Register User
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
- **Success Response**: `201 Created` - `{ "message": "User registered successfully" }`
- **Error Response**: `400 Bad Request` - `{ "error": "User already exists" }`

### 2. Login User
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
- **Success Response**: `200 OK` - `{ "token": "jwt_token_string", "username": "johndoe" }`
- **Error Response**: `400 Bad Request` - `{ "error": "Invalid credentials" }`

---

## Socket.IO Events

The Socket.IO connection operates on `ws://localhost:3000`. 
*Note: You must pass your JWT token during the initial connection handshake or you will be rejected.*
```javascript
const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  auth: { token: 'YOUR_JWT_TOKEN' }
});
```

### Client Emits (Client ➔ Server)

1. **`joinRoom`**
   - **Payload**: `string` (The room name)
   - **Description**: Joins the user to a specific chat room.

2. **`sendMessage`**
   - **Payload**: `{ room: string, content: string }`
   - **Description**: Sends a message to a specific room and saves it to MongoDB.

### Client Listens (Server ➔ Client)

1. **`message`**
   - **Payload**: `{ sender: string, content: string, createdAt: Date }`
   - **Description**: Broadcasted to all users in a room when a new message is sent.

2. **`error`**
   - **Payload**: `string` (Error message)
   - **Description**: Emitted when an action (like sending a message) fails.
