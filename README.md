# 💬 ChatterBox – Real-Time Chat App

ChatterBox is a powerful and modern real-time chat application built using the **MERN stack** (MongoDB, Express, React, Node.js) and **Socket.IO**. It supports both personal and group messaging, media uploads, and real-time interactions with a beautiful, responsive UI.

---

## 🚀 Live Demo

* 🔗 **Live App**: [https://chatterbox-frontend-uppi.onrender.com](https://chatterbox-frontend-uppi.onrender.com)
* 🎥 **Demo Video**: [https://www.loom.com/share/62914be9bb7d4fb5b2adb80b8b3a2065?sid=f2691aea-abd1-4d3a-8c6f-0bca4198f01f](https://www.loom.com/share/62914be9bb7d4fb5b2adb80b8b3a2065?sid=f2691aea-abd1-4d3a-8c6f-0bca4198f01f)

---

## 📈 Features

### 🔐 Authentication

* Signup/Login with Email + Password
* Google OAuth
* OTP Verification Flow
* JWT (Access & Refresh Token) with secure cookie storage

### 💬 Messaging

* One-to-one and group chats
* Real-time messaging with Socket.IO
* Typing indicators
* Message editing, deleting, liking
* Seen/read receipts

### 📎 File Support

* Send & receive images, voice messages, PDFs
* Cloudinary integration for uploads (images, audio, raw)
* Voice-to-text (basic)

### 👥 Group Features

* Create/delete groups
* Set group avatar and name
* Add/remove members
* Leave group
* Admin-only controls

### 🎨 UI/UX

* Clean, modern interface using Tailwind CSS + DaisyUI
* Responsive for mobile & desktop
* Elegant animations, modals, and menus

---

## 🔧 Tech Stack

| Area        | Tech                                  |
| ----------- | ------------------------------------- |
| Frontend    | React, Zustand, Tailwind CSS, DaisyUI |
| Backend     | Node.js, Express, MongoDB (Mongoose)  |
| Real-Time   | Socket.IO                             |
| Auth        | JWT, Google OAuth, bcrypt, nodemailer |
| File Upload | Cloudinary                            |
| Deployment  | Render (Frontend + Backe# 🗨️ ChatterBox - Real-time Chat Application

**ChatterBox** is a feature-rich, modern real-time chat application built for both 1-to-1 and group conversations. Whether you're chatting with a friend, sharing files in a group, or collaborating in real-time, ChatterBox makes it smooth, secure, and scalable.

> 🔴 **Live Demo**: [https://chatterbox-frontend-uppi.onrender.com](https://chatterbox-frontend-uppi.onrender.com)
> 🎥 **Video Walkthrough (Loom)**: *\[Insert Loom link here]*

---

## 🌟 Features

### 💬 Chat Functionalities

* **One-to-One Messaging**: Real-time direct messaging between users.
* **Group Messaging**: Create and manage group chats with avatars and multiple participants.
* **Typing Indicators**: See when someone is typing in real-time.
* **Message Status**: Real-time delivery and receipt acknowledgment.

### ✏️ Message Content Types

* **Text**: Send plain or formatted text messages.
* **Image Upload**: Share pictures, memes, or screenshots directly in chat.
* **Audio Messages**: Record and send voice notes.
* **Voice to Text**: Convert voice recordings into transcribed messages.
* **PDF Upload & Download**: Share documents like PDFs with download links.

### 🔄 Message Actions

* **Edit Messages**: Modify sent messages with instant updates to all clients.
* **Like/Unlike Messages**: React to messages with likes.
* **Delete Messages** (if enabled): Remove messages from the conversation.

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
* **httpOnly Cookies**: Prevent token theft via XSS.

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
📧 Email: [your.email@example.com](mailto:your.email@example.com)
🔗 LinkedIn: [linkedin.com/in/yourprofile](https://www.linkedin.com/in/yourprofile)
🎥 Loom: [Demo Link](https://www.loom.com/share/62914be9bb7d4fb5b2adb80b8b3a2065?sid=f2691aea-abd1-4d3a-8c6f-0bca4198f01f)

---
