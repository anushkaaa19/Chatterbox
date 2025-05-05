import User from "../models/user.model.js";
import Message from "../models/message.model.js"

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
        const { text,image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id; // Fixed from req.user_id to req.user._id

        // Validate required fields
        
        let imageUrl;
        // Handle image upload if provided
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(req.body.image, {
                folder: "message_images",
                resource_type: "auto"
            });
            imageUrl = uploadResponse.secure_url;
        }

        // Create new message
        const newMessage = new Message({
            senderId,
            receiverId,
            text: text || "", // Handle case where only image is sent
            image: imageUrl || undefined // Only include if image exists
        });

        await newMessage.save();

        // Return the created message
        res.status(201).json({
            success: true,
            message: {
                _id: newMessage._id,
                senderId: newMessage.senderId,
                receiverId: newMessage.receiverId,
                text: newMessage.text,
                image: newMessage.image,
                createdAt: newMessage.createdAt
            }
        });

    } catch (error) {
        console.error("Error in sendMessage controller:", error.message);
        
        // Handle specific Cloudinary errors
        if (error.message.includes("File size too large")) {
            return res.status(413).json({ 
                success: false,
                message: "Image file size too large" 
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: "Failed to send message",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
