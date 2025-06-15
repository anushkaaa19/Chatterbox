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
  const userId = socket.handshake.query.userId;
  console.log("🟢 Connected:", socket.id, "User:", userId);

  if (userId) {
    socket.userId = userId;
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  socket.on("typing", ({ toUserId }) => {
    const receiverSocketId = userSocketMap[toUserId];
    if (receiverSocketId) io.to(receiverSocketId).emit("typing", { userId });
  });

  socket.on("stopTyping", ({ toUserId }) => {
    const receiverSocketId = userSocketMap[toUserId];
    if (receiverSocketId) io.to(receiverSocketId).emit("stopTyping", { userId });
  });

  socket.on("sendMessage", (data) => {
    if (!data || !data.receiverId || !data.message) {
      console.error("Invalid message format", data);
      return;
    }
    const receiverSocketId = userSocketMap[data.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        message: data.message,
        senderId: data.message.sender,
      });
    }
  });

  // This is the same as sendMessage, you can remove if not used separately
  socket.on("directMessage", (data) => {
    const receiverSocketId = userSocketMap[data.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        message: data.message,
        senderId: data.message.sender,
      });
    }
  });

  socket.on("forwardMessage", ({ message, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", { message });
  });

  // Group chat events
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
  });

  socket.on("leaveGroup", (groupId) => {
    socket.leave(groupId);
  });

  socket.on("sendGroupMessage", ({ groupId, message }) => {
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
export { io, app, server };
