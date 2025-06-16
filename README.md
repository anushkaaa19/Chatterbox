# 💬 ChatterBox – Real-Time Chat App

ChatterBox is a powerful and modern real-time chat application built using the **MERN stack** (MongoDB, Express, React, Node.js) and **Socket.IO**. It supports both personal and group messaging, media uploads, and real-time interactions with a beautiful, responsive UI.

---

## 🚀 Live Demo

* 🔗 **Live App**: [https://chatterbox-frontend-uppi.onrender.com](https://chatterbox-frontend-uppi.onrender.com)
* 🎥 **Demo Video**: [https://www.loom.com/share/e300fc8a8ac143c4aa25b6d43f71e271?sid=2e3b7898-aeee-49f2-b247-d724d936abdb](https://www.loom.com/share/e300fc8a8ac143c4aa25b6d43f71e271?sid=2e3b7898-aeee-49f2-b247-d724d936abdb)

---
## 🌟 Features

### 💬 Chat Functionalities

* **One-to-One Messaging**: Real-time direct messaging between users.
* **Group Messaging**: Create and manage group chats with avatars and multiple participants.
* **Typing Indicators**: See when someone is typing in real-time.
* **Online/Offline Status**: Real-time delivery and receipt acknowledgment.

### ✏️ Message Content Types

* **Text**: Send plain or formatted text messages.
* **Image Upload**: Share pictures, memes, or screenshots directly in chat.
* **Audio Messages**: Record and send voice notes.
* **Voice to Text**: Convert voice recordings into transcribed messages.

### 🔄 Message Actions

* **Edit Messages**: Modify sent messages with instant updates to all clients.
* **Like/Unlike Messages**: React to messages with likes.

### 🧑‍🤝‍🧑 Profile Features

* **Profile Photo Upload**: Update Profile Photo
* **About(Bio)**: Add a bio or about.
  
### 🧑‍🤝‍🧑 Group Features

* **Group Creation**: Easily create new groups.
* **Group Avatar**: Upload custom group icons.
* **Edit Group Info**: Change group name, icon, or members.
* **Leave/Delete Group**: Members can exit or delete the group (if admin).

### 🔐 Authentication & Security

* **Email/Password Signup**: Traditional authentication system.
* **Google OAuth**: Seamless Google Sign-In.
* **OTP Verification**: Secure signup and password reset.
* **JWT Tokens**: Access and Refresh tokens for secure sessions.

### ⚡ Real-Time Engine

* **Socket.IO Integration**: Powers all real-time communication.
* **Broadcast Events**: Send messages to groups or all users.
* **Reconnect Logic**: Handles intermittent disconnection.
* **Online Users Mapping**: Tracks active user socket IDs.

---

## 🧱 Tech Stack

### Frontend

* **React.js** – Component-based UI development
* **Zustand** – Lightweight state management for authentication and chat
* **Tailwind CSS + DaisyUI** – Custom styling using utility-first CSS with components
* **Socket.IO Client** – For real-time WebSocket communication

### Backend

* **Node.js** – Runtime environment
* **Express.js** – REST API server
* **MongoDB + Mongoose** – NoSQL database to store users, messages, groups
* **Socket.IO Server** – WebSocket connection management
* **Cloudinary SDK** – For image, audio, PDF uploads

### Other Tools

* **JWT** – Token-based authentication
* **Bcrypt** – Password hashing
* **Render** – Hosting platform for both frontend and backend
* **Loom** – Video demo recording

---

## 🛠️ Installation Instructions

### Backend

```bash
git clone https://github.com/your-username/chatterbox-backend.git
cd chatterbox-backend
npm install
npm run dev
```

Create a `.env` file:

```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend

```bash
git clone https://github.com/your-username/chatterbox-frontend.git
cd chatterbox-frontend
npm install
npm run dev
```

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 📁 Folder Structure

```
/backend
  ├── controllers
  ├── models
  ├── routes
  ├── lib (cloudinary, socket, etc)
  └── middlewares

/frontend
  ├── components
  ├── pages
  ├── store (Zustand)
  ├── hooks
  ├── utils
  └── assets
```

---

## 🧪 Test Features

* Open in 2 tabs or devices to test real-time messaging.
* Create a group and send a mix of image, audio, and text.
* Like and edit a message.
* Try logging in via Google.

---

## 🧑‍💻 Author

**Anushka Srivastava**
📧 Email: [Anushka Srivastava](anushka.19252406@gmail.com)
🔗 LinkedIn: [Anushka Srivastava](https://www.linkedin.com/in/anushka-srivastava-a2030b287/)
🎥 Loom: [Demo Link](https://www.loom.com/share/e300fc8a8ac143c4aa25b6d43f71e271?sid=4b6ddedd-7742-4c1d-86ac-9d773a619d98)

---
