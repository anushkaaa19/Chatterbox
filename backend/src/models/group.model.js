import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    admin: {
      type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    profilePic: {
      type: String,
      default: '/default-group.png', // fallback avatar
    },
  },
  { timestamps: true }
);

export const Group = mongoose.model('Group', groupSchema);
