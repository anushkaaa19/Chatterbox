import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./lib/db.js";

import {app,server} from "./lib/socket.js"
import fileUpload from "express-fileupload";
let authRoutes, messageRoutes, groupRoutes;

try {
  authRoutes = await import("./routes/auth.route.js").then(mod => mod.default);
  console.log("✅ authRoutes loaded");
} catch (err) {
  console.error("❌ Failed to import authRoutes", err);
}

try {
  messageRoutes = await import("./routes/message.route.js").then(mod => mod.default);
  console.log("✅ messageRoutes loaded");
} catch (err) {
  console.error("❌ Failed to import messageRoutes", err);
}

try {
  groupRoutes = await import("./routes/group.route.js").then(mod => mod.default);
  console.log("✅ groupRoutes loaded");
} catch (err) {
  console.error("❌ Failed to import groupRoutes", err);
}

import path from "path";
dotenv.config();
console.log("authRoutes", typeof authRoutes);       // should be 'function'
console.log("messageRoutes", typeof messageRoutes); // should be 'function'
console.log("groupRoutes", typeof groupRoutes);     // should be 'function'

const PORT = process.env.PORT || 5001; // Use default port if not defined
const __dirname=path.resolve();
try {
  app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  }));
} catch (err) {
  console.error("File upload middleware error:", err);
}

// Middleware setup
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(cors({
    origin: "https://chatterbox-frontend-uppi.onrender.com",
    credentials: true,
}));

// Add this right after your middleware setup
app.use((req, res, next) => {
  try {
    next();
  } catch (err) {
    if (err.message.includes('Missing parameter name')) {
      console.error('Invalid route detected:', req.path);
      return res.status(400).json({ error: 'Invalid route configuration' });
    }
    next(err);
  }
});
// Routes
// Middleware and route setup
try {
  app.use("/api/auth", authRoutes);
  console.log("✅ Auth routes loaded");
} catch (err) {
  console.error("❌ Error registering auth routes:", err);
}

try {
  app.use("/api/messages", messageRoutes);
  console.log("✅ Message routes loaded");
} catch (err) {
  console.error("❌ Error registering message routes:", err);
}

try {
  app.use("/api/groups", groupRoutes);
  console.log("✅ Group routes loaded");
} catch (err) {
  console.error("❌ Error registering group routes:", err);
}



if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/build")));
  
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../frontend", "build", "index.html"));
    });
  }
// Global error handler
app.use((req, res, next) => {
  if (req.path.includes(':/')) {
    console.error('❌ Invalid dynamic route:', req.path);
    return res.status(400).send('Invalid route path');
  }
  next();
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
