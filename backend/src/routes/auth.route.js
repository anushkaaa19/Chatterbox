import express from "express";
import protectRoute  from "../middlewares/auth.middlewares.js";
import { googleAuth } from "../controllers/auth.controller.js";


import { checkAuth,login, logout, signup,updateProfile} from "../controllers/auth.controller.js";

const router= express.Router();

router.post("/signup",signup);
router.post("/google", googleAuth);
router.post("/login",login);
router.post("/logout",logout);
router.put("/update-profile",protectRoute,updateProfile);
router.get("/check",protectRoute,checkAuth);

export default router;
