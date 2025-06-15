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

  // One-to-one send message
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
