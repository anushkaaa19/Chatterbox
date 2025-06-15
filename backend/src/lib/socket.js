import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "https://chatterbox-frontend-uppi.onrender.com",
      "http://localhost:3000"
    ],
    credentials: true,
  },
});

// Map userId -> socketId
const userSocketMap = {};

export const getReceiverSocketId = (userId) => userSocketMap[userId] || null;

io.on("connection", (socket) => {
  // userId from handshake query
  const userId = socket.handshake.query.userId;
  console.log("🟢 Connected:", socket.id, "User:", userId);

  if (userId) {
    socket.userId = userId;
    userSocketMap[userId] = socket.id;
    // Broadcast updated online users list
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  // Typing events (one-to-one)
  socket.on("typing", ({ toUserId }) => {
    const receiverSocketId = userSocketMap[toUserId];
    if (receiverSocketId) io.to(receiverSocketId).emit("typing", { userId });
  });

  socket.on("stopTyping", ({ toUserId }) => {
    const receiverSocketId = userSocketMap[toUserId];
    if (receiverSocketId) io.to(receiverSocketId).emit("stopTyping", { userId });
  });

// Update the sendMessage event handler
socket.on("sendMessage", (data) => {
  if (!data || !data.receiverId || !data.message) {
    console.error("Invalid message format", data);
    return;
  }
  
  const receiverSocketId = userSocketMap[data.receiverId];
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", { 
      message: data.message,
      senderId: data.message.sender // Include sender ID
    });
    console.log(`📨 Sent message to user ${data.receiverId}`);
  }
});

// Add this to ensure consistent event naming
io.on("connection", (socket) => {
  // ... existing code ...

  // Add this new handler
  socket.on("directMessage", (data) => {
    const receiverSocketId = userSocketMap[data.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        message: data.message,
        senderId: data.message.sender
      });
    }
  });
});

  // Forward message (optional)
  socket.on("forwardMessage", ({ message, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", { message });
  });

  // Group chat events
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`✅ ${socket.userId} joined group ${groupId}`);
  });

  socket.on("leaveGroup", (groupId) => {
    socket.leave(groupId);
    console.log(`🚪 ${socket.userId} left group ${groupId}`);
  });

  socket.on("sendGroupMessage", ({ groupId, message }) => {
    io.to(groupId).emit("receiveGroupMessage", { groupId, message });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    if (socket.userId) {
      delete userSocketMap[socket.userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
    console.log("🔴 Disconnected:", socket.id);
  });
});

export { app, server, io };
