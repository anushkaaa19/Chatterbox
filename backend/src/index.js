import express from "express";
const app= express();
import authRoutes from "./routes/auth.route.js";
app.use("/ap/auth",authRoutes);
app.listen(5001,()=>{
    console.log("Server is running");
}
)
