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

router.put("/edit/:id", protectRoute, editMessage);
router.post("/like/:id", protectRoute, toggleLike);
router.get("/users", protectRoute, getUsersForSidebar);

// ✅ Use /chat/:id to avoid collision with /groups/:groupId/messages
router.get("/chat/:id", protectRoute, getMessages);
router.post("/chat/:id", protectRoute, sendMessages);

export default router;
