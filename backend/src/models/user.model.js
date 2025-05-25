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
      sparse: true, // Allows null values while maintaining uniqueness
    },
    bio: {
      type: String,
      default: "",
      maxlength: 150, // WhatsApp-like character limit
    },

    // Add these fields to store OTP and reset token info
    otp: {
      code: { type: String },
      expiresAt: { type: Date },
    },
    resetToken: {
      token: { type: String },
      expiresAt: { type: Date },
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields
  }
);

const User = mongoose.model("User", userSchema);

export default User;
