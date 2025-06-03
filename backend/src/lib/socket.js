import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    credentials: true,
  },
});

const userSocketMap = {};

export const getReceiverSocketId = (userId) => userSocketMap[userId] || null;

io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  // Get userId from query parameters during connection
  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.userId = userId; // Save userId on socket instance
    userSocketMap[userId] = socket.id;

    // Notify all clients about online users
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  // Typing indicator: broadcast to all except sender
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
  

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
    if (socket.userId) {
      delete userSocketMap[socket.userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

export { app, server, io };
