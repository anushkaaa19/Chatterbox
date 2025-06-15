// src/lib/socket.js
import { io } from "socket.io-client";

export const createSocket = (userId) => {
  return io("https://chatterbox-backend-rus5.onrender.com", {
    query: {
      userId,
    },
    transports: ["websocket"],
    withCredentials: true,
  });
};
