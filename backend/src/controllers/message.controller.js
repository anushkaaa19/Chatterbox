import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import streamifier from "streamifier";

// Utility for streaming buffer to Cloudinary
const streamUpload = (buffer, folder, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json({
      success: true,
      users: filteredUsers,
      count: filteredUsers.length,
    });
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  const { messageId } = req.params;
  const { newText } = req.body;
  const userId = req.user._id;

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    message.text = newText;
    message.edited = true;
    await message.save();

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("editedMessage", message);
    }

    res.status(200).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleLike = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    const index = message.likes.indexOf(userId);
    if (index === -1) {
      message.likes.push(userId);
    } else {
      message.likes.splice(index, 1);
    }

    await message.save();

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("likedMessage", message);
    }

    res.status(200).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const {id: userToChatId } = req.params;
    const myId = req.user._id;

    if (!userToChatId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages, count: messages.length });
  } catch (error) {
    console.error("Error in getMessages:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const sendMessages = async (req, res) => {
  try {
    const { content } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl, audioUrl;

    // Upload image
    if (req.files?.image?.[0]) {
      const result = await streamUpload(req.files.image[0].buffer, "message_images");
      imageUrl = result.secure_url;
    }

    // Upload audio
    if (req.files?.audio?.[0]) {
      const result = await streamUpload(req.files.audio[0].buffer, "message_audio", "auto");
      audioUrl = result.secure_url;
    }

    if (!content && !imageUrl && !audioUrl) {
      return res.status(400).json({
        success: false,
        message: "Message content or file is required",
      });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: content || "",
      image: imageUrl,
      audio: audioUrl,
    });

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json({ success: true, message: newMessage });
  } catch (error) {
    console.error("sendMessages error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
