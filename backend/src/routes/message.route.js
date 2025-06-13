import express from "express";
import multer from "multer";
import protectRoute from "../middlewares/auth.middlewares.js";
import {
  getUsersForSidebar,
  sendMessages,
  getMessages,
  editMessage,
  toggleLike,
} from "../controllers/message.controller.js";

const router = express.Router();

// Use memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.put("/edit/:messageId", protectRoute, editMessage);
router.post("/like/:messageId", protectRoute, toggleLike);
router.get("/users", protectRoute, getUsersForSidebar);

// Use upload.fields for image/audio
router.get("/chat/:id", protectRoute, getMessages);
router.post(
  "/chat/:id",
  protectRoute,
  upload.fields([{ name: "image" }, { name: "audio" }]),
  sendMessages
);

export default router;
