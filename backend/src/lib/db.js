import mongoose from "mongoose";

export const connectDB=async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("connected db");
    }
    catch(error){
        console.log("Err in db",error);

    }
}