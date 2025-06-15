import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Get all users except current user (for sidebar)
export const getUsersForSidebar = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select("-password");
    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Send one-to-one message (text, image, audio)
export const sendMessages = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const { text, image, audio } = req.body;
    const senderId = req.user._id;

    let imageUrl = null;
    let audioUrl = null;

    if (image) {
      const uploadedImage = await cloudinary.uploader.upload(image, {
        folder: "message_images",
        resource_type: "auto",
      });
      imageUrl = uploadedImage.secure_url;
    }

    if (audio) {
      const uploadedAudio = await cloudinary.uploader.upload(audio, {
        folder: "message_audio",
        resource_type: "video", // To handle webm, mp3 correctly
      });
      audioUrl = uploadedAudio.secure_url;
    }

    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: {
        text: text || "",
        image: imageUrl,
        audio: audioUrl,
      },
    });

    // Emit to receiver
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", { message: newMessage });

    // Emit to sender (for real-time UI update)
    const senderSocketId = getReceiverSocketId(senderId.toString());
    if (senderSocketId) io.to(senderSocketId).emit("newMessage", { message: newMessage });

    res.status(201).json({ success: true, message: newMessage });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get one-to-one messages (chat history)
export const getMessages = async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.id;

    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Edit a message (only sender can edit)
export const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { newText } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    message.content.text = newText;
    message.edited = true;
    await message.save();

    // Optionally emit edited message via socket here if needed

    res.status(200).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Toggle like on message
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    if (!Array.isArray(message.likedBy)) {
      message.likedBy = [];
    }

    const userIdStr = userId.toString();
    const alreadyLiked = message.likedBy.some(id => id.toString() === userIdStr);

    if (alreadyLiked) {
      message.likedBy = message.likedBy.filter(id => id.toString() !== userIdStr);
    } else {
      message.likedBy.push(userId);
    }

    await message.save();

    // Optionally emit like update via socket here

    res.status(200).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};