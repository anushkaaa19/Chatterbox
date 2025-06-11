import { Group } from "../models/group.model.js";
import { GroupMessage } from "../models/groupMessage.model.js";
import { io } from "../lib/socket.js";
import cloudinary from "../lib/cloudinary.js";

export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    const parsedMembers = JSON.parse(members);
    let profilePic = "";

    if (req.files?.avatar) {
      const uploadRes = await uploadToCloudinary(req.files.avatar.tempFilePath, "groups");
      profilePic = uploadRes.secure_url;
    }

    const newGroup = await Group.create({
      name,
      members: parsedMembers,
      admin: req.user.id,
      profilePic,
    });

    res.status(201).json({ success: true, group: newGroup });
  } catch (err) {
    console.error("Group creation error:", err);
    res.status(500).json({ success: false, message: "Failed to create group" });
  }
};


// Get all groups for the logged-in user
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({ members: userId })
      .populate("members", "name email profilePic")
      .populate("admin", "name email profilePic");

    res.status(200).json({ success: true, groups });
  } catch (err) {
    console.error("Error fetching user groups:", err);
    res.status(500).json({ success: false, message: "Failed to fetch groups" });
  }
};

// Send a message to a group

    
    // Send a message to a group
    export const sendGroupMessage = async (req, res) => {
      try {
        const { text, image, audio } = req.body;
        const { groupId } = req.params;
        const senderId = req.user._id;
    
        // Validate group existence
        const group = await Group.findById(groupId);
        if (!group) {
          return res.status(404).json({ success: false, message: "Group not found" });
        }
    
        let imageUrl = null;
        let audioUrl = null;
    
        // Handle image upload
        if (image) {
          const imgUpload = await cloudinary.uploader.upload(image, {
            folder: "group_images",
            resource_type: "auto",
          });
          imageUrl = imgUpload.secure_url;
        }
    
        // Handle audio upload
        if (audio) {
          const audioUpload = await cloudinary.uploader.upload(audio, {
            folder: "group_audio",
            resource_type: "auto",
          });
          audioUrl = audioUpload.secure_url;
        }
    
        const newMessage = await GroupMessage.create({
            group: groupId,
            sender: senderId,
            content: {        // ✅ FIXED
              text,
              image: imageUrl,
              audio: audioUrl,
            },
          });
          
    
    
        // ✅ Populate sender before sending back
        await newMessage.populate("sender", "fullName profilePic _id");
    
        // ✅ Emit real-time message to group
        io.to(groupId).emit("receiveGroupMessage", {
          groupId,
          message: newMessage,
        });
    
        // ✅ Send response
        res.status(201).json({ success: true, message: newMessage });
      } catch (err) {
        console.error("Error sending group message:", err);
        res.status(500).json({ success: false, message: "Failed to send message" });
      }
    };
    

// Fetch messages for a group
export const getGroupMessages = async (req, res) => {
    try {
      const { groupId } = req.params;
  
      const messages = await GroupMessage.find({ group: groupId })
      .populate("sender", "fullName profilePic") // ✅ Corrected fields
      .sort({ createdAt: 1 });
    
      console.log("Fetched Group Messages:", messages); // ✅ LOG HERE
  
      res.status(200).json({ success: true, messages });
    } catch (err) {
      console.error("Error fetching group messages:", err);
      res.status(500).json({ success: false, message: "Failed to fetch messages" });
    }
  };
  

