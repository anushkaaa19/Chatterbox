import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import {app,server} from "./lib/socket.js"
import fileUpload from "express-fileupload";

import path from "path";
import groupRoutes from "./routes/group.route.js";
dotenv.config();

const PORT = process.env.PORT || 5001; // Use default port if not defined
const __dirname=path.resolve();

// Middleware setup
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(cors({
    origin: "https://chatterbox-frontend-uppi.onrender.com",
    credentials: true,
}));
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  }));


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
try {
  app.use('/api/groups', groupRoutes);
} catch (err) {
  console.error("Group route error:", err);
}


if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/build")));
  
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../frontend", "build", "index.html"));
    });
  }
// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: "Something went wrong!" });
});

// Connect to DB and then start the server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1); // Exit if DB connection fails
});
