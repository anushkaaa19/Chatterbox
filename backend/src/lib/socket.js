// lib/socket.js
import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["https://chatterbox-frontend-uppi.onrender.com"],
    credentials: true,
  },
});

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

  // One-to-one typing
  socket.on("typing", ({ fromUserId, toUserId }) => {
    const receiverSocketId = userSocketMap[toUserId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { userId: fromUserId });
    }
  });

  socket.on("stopTyping", ({ fromUserId, toUserId }) => {
    const receiverSocketId = userSocketMap[toUserId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", { userId: fromUserId });
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

  // When message is saved in DB, emit separately
  socket.on("sendGroupMessage", ({ groupId, message }) => {
    // Broadcast to everyone in the group INCLUDING the sender
    io.to(groupId).emit("receiveGroupMessage", { groupId, message });
  });
  
  socket.on("disconnect", () => {
    if (socket.userId) {
      delete userSocketMap[socket.userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
    console.log("🔴 Disconnected:", socket.id);
  });
});

export { app, server, io };
