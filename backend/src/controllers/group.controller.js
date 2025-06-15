import { Group } from "../models/group.model.js";
import { GroupMessage } from "../models/GroupMessage.model.js";
import { io } from "../lib/socket.js";
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

    const uniqueMembers = [...new Set([...parsedMembers, req.user._id.toString()])];

    const newGroup = await Group.create({
      name,
      members: uniqueMembers,
      admin: req.user._id,
      profilePic,
    });

    const populatedGroup = await Group.findById(newGroup._id)
      .populate("members", "fullName email profilePic")
      .populate("admin", "fullName email profilePic");

    res.status(201).json({ success: true, group: populatedGroup });
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
      .populate("members", "fullName email profilePic")
      .populate("admin", "fullName email profilePic");

    res.status(200).json({ success: true, groups });
  } catch (err) {
    console.error("Error fetching user groups:", err);
    res.status(500).json({ success: false, message: "Failed to fetch groups" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    console.log("➡️ Incoming group message request");

    const { text = "" } = req.body;
    const { groupId } = req.params;
    const senderId = req.user._id;

    console.log("📦 Received text:", text);
    console.log("📦 Files received:", req.files);

    let imageUrl = "";
    let audioUrl = "";

    if (req.files?.image && req.files.image.tempFilePath) {
      console.log("📤 Uploading image...");
      const imgUpload = await uploadToCloudinary(req.files.image.tempFilePath, "group_images");
      imageUrl = imgUpload?.secure_url || "";
      console.log("✅ Image uploaded:", imageUrl);
    }

    if (req.files?.audio && req.files.audio.tempFilePath) {
      console.log("📤 Uploading audio...");
      const audioUpload = await uploadToCloudinary(req.files.audio.tempFilePath, "group_audio", "raw");
      audioUrl = audioUpload?.secure_url || "";
      console.log("✅ Audio uploaded:", audioUrl);
    }

    if (!text.trim() && !imageUrl && !audioUrl) {
      console.log("❌ Empty message submitted, rejecting.");
      return res.status(400).json({ success: false, message: "Cannot send empty message" });
    }

    const newMessage = await GroupMessage.create({
      group: groupId,
      sender: senderId,
      content: {
        text: text.trim(),
        image: imageUrl,
        audio: audioUrl,
      },
    });

    await newMessage.populate("sender", "fullName profilePic _id");

    console.log("📤 Emitting message to group via socket:", groupId);
    console.log("📨 Message Content:", newMessage);

    io.to(groupId).emit("receiveGroupMessage", {
      groupId,
      message: newMessage,
    });

    res.status(201).json({ success: true, message: newMessage });
  } catch (err) {
    console.error("💥 Error sending group message:", err);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};


// ✅ Update group (name and/or profile pic)
export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    if (!group.members.includes(userId)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (name) group.name = name;

    if (req.files?.avatar) {
      const uploadRes = await uploadToCloudinary(req.files.avatar.tempFilePath, "groups");
      group.profilePic = uploadRes.secure_url;
    }

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate("members", "fullName email profilePic")
      .populate("admin", "fullName email profilePic");

    res.status(200).json({ success: true, group: updatedGroup });
  } catch (err) {
    console.error("Group update error:", err);
    res.status(500).json({ success: false, message: "Failed to update group" });
  }
};

// ✅ Delete group
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

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

// ✅ Leave group
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

// ✅ Get all group messages
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
