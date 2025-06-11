import mongoose from 'mongoose';

const groupMessageSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      text: { type: String, default: "" },
      image: { type: String, default: null }, // URL or base64
      audio: { type: String, default: null }, // URL or base64
    },
  },
  { timestamps: true }
);

export const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);
