import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      default: "",
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true // Allows null values while maintaining uniqueness
    },
    bio: {
      type: String,
      default: "",
      maxlength: 150 // WhatsApp-like character limit
    }
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields
  }
);

const User = mongoose.model("User", userSchema);

export default User;