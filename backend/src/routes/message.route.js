import express from "express";
import  protectRoute  from "../middlewares/auth.middlewares.js";
import { getUsersForSidebar , sendMessages , getMessages} from "../controllers/message.controller.js";
import { editMessage, toggleLike } from "../controllers/message.controller.js";


const router = express.Router();

router.put("/edit/:id", protectRoute, editMessage);
router.post("/like/:id", protectRoute, toggleLike);
// Get users for sidebar (excluding current user)
router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id",protectRoute,getMessages);
router.post("/send/:id",protectRoute,sendMessages);

// Additional message routes can be added here:
// router.post("/send", protectRoute, sendMessage);
// router.get("/:userId", protectRoute, getMessages);

export default router;