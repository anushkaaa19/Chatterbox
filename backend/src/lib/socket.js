// lib/socket.js
import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["https://chatterbox-frontend-uppi.onrender.com", "http://localhost:3000"],
    credentials: true,
  },
});

// Maintain map of userId -> socket.id
const userSocketMap = {};
export const getReceiverSocketId = (userId) => userSocketMap[userId] || null;

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("🟢 Connected:", socket.id, "User:", userId);

  if (userId) {
    socket.userId = userId;
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  // ==== One-to-One Typing Events ====
  socket.on("typing", ({ toUserId }) => {
    const receiverSocketId = userSocketMap[toUserId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { userId });
    }
  });

  socket.on("stopTyping", ({ toUserId }) => {
    const receiverSocketId = userSocketMap[toUserId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", { userId });
    }
  });

  // ==== One-to-One Message ====
  socket.on("sendMessage", (message) => {
    if (!message || !message.receiver) {
      console.error("Invalid message format", message);
      return;
    }

    const receiverId = message.receiver._id || message.receiver;
    const receiverSocketId = userSocketMap[receiverId];
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", { message });
      console.log(`📨 Sent message to user ${receiverId}`);
    } else {
      console.log(`❌ User ${receiverId} not connected`);
    }
  });

  // ==== One-to-One Message ====
  socket.on("forwardMessage", ({ message, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", { message });
    }
  });
  // ===== Group Chat Events =====
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

  // Handle disconnection
  socket.on("disconnect", () => {
    if (socket.userId) {
      delete userSocketMap[socket.userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
    console.log("🔴 Disconnected:", socket.id);
  });
});

export { app, server, io };
