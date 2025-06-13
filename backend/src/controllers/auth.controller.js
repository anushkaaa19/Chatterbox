import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Forgot password: send OTP email
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    user.otp = { code: otp, expiresAt };
    await user.save();

    // Nodemailer config
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: user.email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is ${otp}. It will expire in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

// Verify OTP and generate temp reset token
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.otp) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }

    if (user.otp.code !== otp || user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Clear OTP and create resetToken
    user.otp = undefined;
    const tempToken = crypto.randomBytes(20).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
    user.resetToken = { token: tempToken, expiresAt };
    await user.save();

    res.json({ success: true, message: "OTP verified", tempToken });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "OTP verification failed" });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  const { email, newPassword, token } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.resetToken) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    if (
      user.resetToken.token !== token ||
      user.resetToken.expiresAt < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    user.resetToken = undefined;

    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};

// Signup controller
export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      profilePic: req.body.profilePic || "",
    });

    await newUser.save();

    // Generate JWT token
    const token = generateToken(newUser._id);

    // Set cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
      domain: process.env.NODE_ENV === "production" ? ".yourdomain.com" : undefined,
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in signup controller:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Login controller
export const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
      domain: process.env.NODE_ENV === "production" ? ".yourdomain.com" : undefined,
    });

    res.status(200).json({ message: "Logged in successfully", user: { id: user._id, email: user.email
      ,bio:user.bio, // ✅ ADD THIS

     } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Logout controller
export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", {
      maxAge: 0,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { profilePic, fullName, bio } = req.body;

    const updateData = {};

    if (profilePic) {
      // Upload image and set URL
      const uploadResponse = await cloudinary.uploader.upload(profilePic, {
        folder: "profile-pictures",
        resource_type: "auto",
      });
      updateData.profilePic = uploadResponse.secure_url;
    }

    if (fullName !== undefined) {
      updateData.fullName = fullName;
    }

    if (bio !== undefined) {
      updateData.bio = bio;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No data to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      select: "-password",
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("Updated user data:", updatedUser);

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in updateProfile controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Check auth (returns user data if logged in)
export const checkAuth = (req, res) => {
  try {
    if (!req.user) {
      return res.status(200).json(null);
    }

    res.status(200).json({
      _id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      profilePic: req.user.profilePic,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
      bio: req.user.bio, // ✅ ADD THIS

    });
  } catch (error) {
    console.error("Error in checkAuth controller:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Google OAuth controller
export const googleAuth = async (req, res) => {
  const { uid, email, displayName, photoURL } = req.body;

  try {
    let user = await User.findOne({
      $or: [{ firebaseUid: uid }, { email }],
    });

    if (!user) {
      user = new User({
        firebaseUid: uid,
        fullName: displayName,
        email,
        profilePic: photoURL,
        password: null, // Mark as Google-authenticated user
      });
      await user.save();
    }

    const token = generateToken(user._id);

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
      domain: process.env.NODE_ENV === "production" ? ".yourdomain.com" : undefined,
    });

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio, // ✅ ADD THIS
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
};
