// auth.routes.js
import express from "express";
import protectRoute from "../middlewares/auth.middlewares.js";
import {
  forgotPassword,
  verifyOtp,
  resetPassword,
  signup,
  login,
  logout,
  updateProfile,
  checkAuth,
  googleAuth
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";


const router = express.Router();

router.post("/signup", signup);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/google", googleAuth);
router.post("/login", login);
router.post("/logout", logout);
router.put("/update-profile", protectRoute, updateProfile);
router.get("/check", verifyToken, checkAuth);

export default router;