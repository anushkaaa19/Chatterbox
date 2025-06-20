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
      count: filteredUsers.length
    });
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
};

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

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", { message });
    }

    res.status(200).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Toggle like/unlike
export const toggleLike = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  try {
    let message = await Message.findById(id).populate("likes", "name");

    if (!message)
      return res.status(404).json({ success: false, message: "Message not found" });

    const likesSet = new Set(message.likes.map(u => u._id.toString()));
    
    if (likesSet.has(userId)) {
      likesSet.delete(userId);
    } else {
      likesSet.add(userId);
    }

    // Save updated likes (as ObjectId array)
    message.likes = Array.from(likesSet);
    await message.save();

    // Re-populate likes with names
    await message.populate("likes", "name");

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    const senderSocketId = getReceiverSocketId(message.senderId.toString());

    if (receiverSocketId)
      io.to(receiverSocketId).emit("messageLiked", { message });

    if (senderSocketId && senderSocketId !== receiverSocketId)
      io.to(senderSocketId).emit("messageLiked", { message });

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
      return res.status(400).json({
        success: false,
        message: "User ID parameter is required"
      });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      messages,
      count: messages.length
    });
  } catch (error) {
    console.error("Error in getMessages controller:", error.message);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ✅ Send message (text/image/audio)
export const sendMessages = async (req, res) => {
  try {
    const { text, image, audio } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ success: false, message: "Receiver ID required" });
    }

    let imageUrl, audioUrl;

    // Upload image if exists
    if (image) {
      const imgUpload = await cloudinary.uploader.upload(image, {
        folder: "message_images",
        resource_type: "auto"
      });
      imageUrl = imgUpload.secure_url;
    }

    // Upload audio if exists
    if (audio) {
      const audioUpload = await cloudinary.uploader.upload(audio, {
        folder: "message_audio",
        resource_type: "auto"
      });
      audioUrl = audioUpload.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: text || "",
      image: imageUrl,
      audio: audioUrl
    });

    await newMessage.save();

    // Send real-time notification
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json({
      success: true,
      message: {
        _id: newMessage._id,
        senderId,
        receiverId,
        text: newMessage.text,
        image: newMessage.image,
        audio: newMessage.audio,
        createdAt: newMessage.createdAt
      }
    });
  } catch (error) {
    console.error("Error in sendMessages controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};