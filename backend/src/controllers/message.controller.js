import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Get all users except self (for sidebar)
export const getUsersForSidebar = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select("-password");
    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Send a one-to-one message (text, image, audio)
export const sendMessages = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const { text, image, audio } = req.body;
    const senderId = req.user._id;

    let imageUrl = null;
    let audioUrl = null;

    // Upload image to Cloudinary if present
    if (image) {
      const uploadedImage = await cloudinary.uploader.upload(image, {
        folder: "message_images",
        resource_type: "auto"
      });
      imageUrl = uploadedImage.secure_url;
    }

    // Upload audio to Cloudinary if present
    if (audio) {
      const uploadedAudio = await cloudinary.uploader.upload(audio, {
        folder: "message_audio",
        resource_type: "auto"
      });
      audioUrl = uploadedAudio.secure_url;
    }

    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: {
        text: text || "",
        image: imageUrl,
        audio: audioUrl
      }
    });

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage",  { message: newMessage });
    }
    
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage",  { message: newMessage });
    }
    

    res.status(201).json({ success: true, message: newMessage });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get one-to-one messages
export const getMessages = async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.id;

    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- message.controller.js ---
export const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { newText } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    // Ensure we're comparing ObjectIds correctly
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    message.content.text = newText;
    message.edited = true;
    await message.save();

    // Return the updated message
    res.status(200).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    // Convert to string for comparison
    const userIdStr = userId.toString();
    
    // Initialize likedBy array if it doesn't exist
    if (!Array.isArray(message.likedBy)) {
      message.likedBy = [];
    }

    // Check if user already liked the message
    const alreadyLiked = message.likedBy.some(id => id.toString() === userIdStr);
    
    if (alreadyLiked) {
      // Remove like
      message.likedBy = message.likedBy.filter(id => id.toString() !== userIdStr);
    } else {
      // Add like
      message.likedBy.push(userId);
    }

    await message.save();
    res.status(200).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};