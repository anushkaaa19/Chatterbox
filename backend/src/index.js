import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
const app= express();
dotenv.config();
import { connectDB } from "./lib/db.js";
const PORT=process.env.PORT;
import authRoutes from "./routes/auth.route.js";
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth",authRoutes);
app.listen(PORT,()=>{
    console.log("Server is running");
    connectDB();
}
)
