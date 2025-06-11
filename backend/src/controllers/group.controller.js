import { Group } from "../models/group.model.js";
import { GroupMessage } from "../models/groupMessage.model.js";
import { io } from "../lib/socket.js";
import cloudinary from "../lib/cloudinary.js";
import { uploadToCloudinary } from "../utils/cloudinary.utils.js";

// ✅ Create a group
export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    const parsedMembers = JSON.parse(members);
    let profilePic = "";

    if (req.files?.avatar) {
      const uploadRes = await uploadToCloudinary(req.files.avatar.tempFilePath, "groups");
      profilePic = uploadRes.secure_url;
    }

    // ✅ Ensure the creator is also in the group
    const uniqueMembers = [...new Set([...parsedMembers, req.user.id])];

    const newGroup = await Group.create({
      name,
      members: uniqueMembers,
      admin: req.user.id,
      profilePic,
    });

    res.status(201).json({ success: true, group: newGroup });
  } catch (err) {
    console.error("Group creation error:", err);
    res.status(500).json({ success: false, message: "Failed to create group" });
  }
};

// ✅ Get all groups the user is a part of
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

// ✅ Send a message to a group
export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image, audio } = req.body;
    const { groupId } = req.params;
    const senderId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    let imageUrl = null;
    let audioUrl = null;

    if (image) {
      const imgUpload = await cloudinary.uploader.upload(image, {
        folder: "group_images",
        resource_type: "auto",
      });
      imageUrl = imgUpload.secure_url;
    }

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
      content: {
        text,
        image: imageUrl,
        audio: audioUrl,
      },
    });

    await newMessage.populate("sender", "fullName profilePic _id");

    io.to(groupId).emit("receiveGroupMessage", {
      groupId,
      message: newMessage,
    });

    res.status(201).json({ success: true, message: newMessage });
  } catch (err) {
    console.error("Error sending group message:", err);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

export const updateGroup = async (req, res) => {
    try {
      const { groupId } = req.params;
      const { name } = req.body;
      const userId = req.user._id;
  
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ success: false, message: "Group not found" });
  
      // Only group members can edit
      if (!group.members.includes(userId)) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
  
      if (name) group.name = name;
  
      if (req.files?.avatar) {
        const uploadRes = await uploadToCloudinary(req.files.avatar.tempFilePath, "groups");
        group.profilePic = uploadRes.secure_url;
      }
  
      await group.save();
  
      res.status(200).json({ success: true, group });
    } catch (err) {
      console.error("Group update error:", err);
      res.status(500).json({ success: false, message: "Failed to update group" });
    }
  };
  
  export const deleteGroup = async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.user._id;
  
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ success: false, message: "Group not found" });
  
      // Only admin can delete
      if (group.admin.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: "Only admin can delete the group" });
      }
  
      await group.deleteOne();
      res.status(200).json({ success: true, message: "Group deleted" });
    } catch (err) {
      console.error("Delete group error:", err);
      res.status(500).json({ success: false, message: "Failed to delete group" });
    }
  };
  
  export const leaveGroup = async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.user._id;
  
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ success: false, message: "Group not found" });
  
      group.members = group.members.filter((id) => id.toString() !== userId.toString());
  
      await group.save();
      res.status(200).json({ success: true, message: "Left the group" });
    } catch (err) {
      console.error("Leave group error:", err);
      res.status(500).json({ success: false, message: "Failed to leave group" });
    }
  };
// ✅ Fetch all messages in a group
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const messages = await GroupMessage.find({ group: groupId })
      .populate("sender", "fullName profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (err) {
    console.error("Error fetching group messages:", err);
    res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
};
