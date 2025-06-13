import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// ✅ Get users for sidebar
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
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ✅ Edit a message
export const editMessage = async (req, res) => {
  const { id } = req.params;
  const { newText } = req.body;
  const userId = req.user._id;

  try {
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    message.text = newText;
    message.edited = true;
    await message.save();

    // Emit to receiver if online
    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("editedMessage", message);
    }

    res.status(200).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Toggle like/unlike
export const toggleLike = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    const index = message.likes.indexOf(userId);
    if (index === -1) {
      message.likes.push(userId);
    } else {
      message.likes.splice(index, 1);
    }

    await message.save();

    // Emit like update
    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("likedMessage", message);
    }

    res.status(200).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get messages between two users
export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    if (!userToChatId) {
      return res.status(400).json({ success: false, message: "User ID parameter is required" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages, count: messages.length });
  } catch (error) {
    console.error("Error in getMessages controller:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ✅ Send message (text, image, audio) — PDF removed
export const sendMessages = async (req, res) => {
  try {
    const { text } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const files = req.files || {};

    if (!receiverId) {
      return res.status(400).json({ success: false, message: "Receiver ID required" });
    }

    let imageUrl = null;
    let audioUrl = null;

    // Handle image upload
    if (files.image) {
      const imgUpload = await cloudinary.uploader.upload_stream(
        { folder: "message_images" },
        (error, result) => {
          if (error) throw error;
          imageUrl = result.secure_url;
        }
      ).end(files.image[0].buffer);
    }

    // Handle audio upload
    if (files.audio) {
      const audioUpload = await cloudinary.uploader.upload_stream(
        { folder: "message_audio", resource_type: "auto" },
        (error, result) => {
          if (error) throw error;
          audioUrl = result.secure_url;
        }
      ).end(files.audio[0].buffer);
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: text || "",
      image: imageUrl,
      audio: audioUrl,
    });

    await newMessage.save();

    // Socket.io emission logic remains the same
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error("Error in sendMessages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};