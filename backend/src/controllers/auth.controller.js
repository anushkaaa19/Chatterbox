// Use these imports at the top of your file
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        // Validate required fields
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
            profilePic: req.body.profilePic || "" // Add profilePic if provided
        });

        // Save user and generate token
        await newUser.save();
        generateToken(newUser._id, res);

        // Return success response
        res.status(201).json({
            message: "User created successfully",
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic
            }
        });

    } catch (error) {
        console.error("Error in signup controller:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" }); // Changed from 480 to standard 401
        }

        // Compare passwords
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Invalid credentials" }); // Changed from 480 to standard 401
        }

        // Generate JWT token
        generateToken(user._id, res);

        // Return user data
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
            createdAt: user.createdAt, // Added if you have timestamps
            updatedAt: user.updatedAt  // Added if you have timestamps
        });

    } catch (error) {
        console.error("Error in login controller:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { 
            maxAge: 0,
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV !== "development"
        });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Error in logout controller:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userId = req.user._id;

        // Validate input
        if (!profilePic) {
            return res.status(400).json({ message: "Profile picture is required" });
        }

        // Upload to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(profilePic, {
            folder: "profile-pictures",
            resource_type: "auto"
        });

        // Update user in database
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: uploadResponse.secure_url },
            { new: true, select: "-password" } // Return updated user without password
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Return updated user data
        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                _id: updatedUser._id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                profilePic: updatedUser.profilePic,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt
            }
        });

    } catch (error) {
        console.error("Error in updateProfile controller:", error);
        
        // Handle specific Cloudinary errors
        if (error.message.includes("File size too large")) {
            return res.status(413).json({ message: "File size too large" });
        }
        
        // Handle invalid file type errors
        if (error.message.includes("Invalid image file")) {
            return res.status(415).json({ message: "Invalid file type" });
        }

        res.status(500).json({ message: "Internal server error" });
    }
};
export const checkAuth = (req, res) => {
    try {
        // Check if user exists in request (added validation)
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        // Return user data without sensitive information
        res.status(200).json({
            _id: req.user._id,
            fullName: req.user.fullName,
            email: req.user.email,
            profilePic: req.user.profilePic,
            createdAt: req.user.createdAt,
            updatedAt: req.user.updatedAt
        });
        
    } catch (error) {
        console.error("Error in checkAuth controller:", error.message);
        res.status(500).json({ 
            message: "Internal Server Error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};