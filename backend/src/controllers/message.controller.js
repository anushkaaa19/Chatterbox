import User from "../models/user.model.js";
import Message from "../models/message.model.js"
import cloudinary from "../lib/cloudinary.js"
import { getReceiverSocketId,io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        // Get the authenticated user's ID
        const loggedInUserId = req.user._id; // Fixed from req.user_id to req.user._id

        // Find all users except the current user, excluding passwords
        const filteredUsers = await User.find(
            { _id: { $ne: loggedInUserId } }
        ).select("-password");

        // Return the filtered users
        res.status(200).json({
            success: true,
            users: filteredUsers,
            count: filteredUsers.length
        });

    } catch (error) {
        console.error("Error in getUsersForSidebar: ", error.message);
        res.status(500).json({ 
            success: false,
            error: "Internal server error",
            message: error.message // Only include in development
        });
    }
}; // Fixed missing closing brace
// Edit a message
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

    return res.status(200).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Toggle like/unlike
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

    return res.status(200).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id; // Fixed from req.user__id to req.user._id

        // Validate the userToChatId
        if (!userToChatId) {
            return res.status(400).json({ 
                success: false,
                message: "User ID parameter is required" 
            });
        }

        // Find messages between the two users
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ],
        }).sort({ createdAt: 1 }); // Sort by oldest first

        // Return the messages
        res.status(200).json({
            success: true,
            messages: messages, // Fixed from 'message' to 'messages'
            count: messages.length
        });

    } catch (error) {
        console.error("Error in getMessages controller: ", error.message);
        res.status(500).json({ 
            success: false,
            error: "Internal server error",
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
export const sendMessages = async (req, res) => {
    try {
      const { text, image } = req.body;
      const { id: receiverId } = req.params;
      const senderId = req.user._id;
  
      // Validate receiver
      if (!receiverId) {
        return res.status(400).json({ success: false, message: "Receiver ID required" });
      }
  
      // Upload image if present
      let imageUrl;
      if (image) {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: "message_images",
          resource_type: "auto"
        });
        imageUrl = uploadResponse.secure_url;
      }
  
      // Create and save
      const newMessage = new Message({
        senderId,
        receiverId,
        text: text || "",
        image: imageUrl
      });
      await newMessage.save();
  
      // Emit to the other user if they're online
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
  
      // Respond
      res.status(201).json({
        success: true,
        message: {
          _id: newMessage._id,
          senderId,
          receiverId,
          text: newMessage.text,
          image: newMessage.image,
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