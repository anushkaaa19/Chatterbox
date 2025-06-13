import express from "express";
import protectRoute from "../middlewares/auth.middlewares.js";
import {
  getUsersForSidebar,
  sendMessages,
  getMessages,
  editMessage,
  toggleLike,
} from "../controllers/message.controller.js";

const router = express.Router();

// Make parameters explicitly named and optional if needed
router.put("/edit/:messageId", protectRoute, editMessage);  // ✅ More explicit
router.post("/like/:messageId", protectRoute, toggleLike);  // ✅ More explicit
router.get("/users", protectRoute, getUsersForSidebar);

// ✅ Use /chat/:id to avoid collision with /groups/:groupId/messages
router.get("/chat/:messageId", protectRoute, getMessages);
router.post("/chat/:messageId", protectRoute, sendMessages);

export default router;
