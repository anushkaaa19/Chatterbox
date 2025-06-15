import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

let groupMessageHandler = null;

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupLoading: false,
  socket: null,

  setSocket: (socket) => {
    console.log("🔌 Setting socket in group store", socket);
    set({ socket });
  },

  setSelectedGroup: (group) => {
    const socket = useAuthStore.getState().socket;
    const { selectedGroup } = get();

    if (socket && selectedGroup?._id) {
      console.log("👋 Leaving group:", selectedGroup._id);
      socket.emit("leaveGroup", selectedGroup._id);
    }

    if (socket && group?._id) {
      console.log("👋 Joining group:", group._id);
      socket.emit("joinGroup", group._id);
    }

    console.log("✅ Selected group set:", group);
    set({ selectedGroup: group });
  },

  setGroupMessages: (messages) => {
    console.log("📜 Setting group messages", messages);
    set({ groupMessages: Array.isArray(messages) ? messages : [] });
  },

  getGroups: async () => {
    set({ isGroupLoading: true });
    try {
      console.log("📥 Fetching groups...");
      const { data } = await axiosInstance.get("/groups");
      console.log("✅ Groups fetched:", data.groups);
      set({ groups: data.groups || [], isGroupLoading: false });
    } catch (err) {
      console.error("❌ Error fetching groups", err);
      toast.error("Failed to load groups");
      set({ isGroupLoading: false });
    }
  },

  createGroup: async (formData) => {
    try {
      console.log("📤 Creating group with formData:", formData);
      const res = await axiosInstance.post("/groups", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const group = res.data?.group;
      console.log("✅ Group created:", group);
      if (group) {
        set((state) => ({
          groups: [...state.groups, group],
        }));
        toast.success("Group created successfully");
        return group;
      } else {
        throw new Error("Group not returned from API");
      }
    } catch (err) {
      console.error("❌ Create group failed:", err);
      toast.error("Failed to create group");
      throw err;
    }
  },

  getGroupMessages: async (groupId) => {
    try {
      console.log("📥 Fetching messages for group:", groupId);
      const { data } = await axiosInstance.get(`/groups/${groupId}/messages`);
      const messages = Array.isArray(data.messages)
        ? data.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        : [];
      console.log("✅ Messages loaded:", messages);
      set({ groupMessages: messages });
      return messages;
    } catch (err) {
      console.error("❌ Error loading group messages", err);
      toast.error("Failed to load messages");
      return [];
    }
  },

  sendGroupMessage: async (groupId, messageData) => {
    try {
      console.log("📤 Sending group message to:", groupId);
      console.log("🧾 Message Data:", messageData);
      const res = await axiosInstance.post(`/groups/${groupId}/messages`, messageData);
      console.log("✅ Group message sent:", res.data?.message);
      return res.data?.message;
    } catch (err) {
      console.error("❌ Error sending group message", err);
      toast.error("Failed to send message");
      throw err;
    }
  },

  subscribeToGroupMessages: (groupId) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) {
      console.warn("⚠️ Cannot subscribe — socket not found.");
      return;
    }

    if (groupMessageHandler) {
      console.log("🔁 Removing previous message listener");
      socket.off("receiveGroupMessage", groupMessageHandler);
    }

    groupMessageHandler = ({ groupId: incomingGroupId, message }) => {
      console.log("📡 Received group message via socket:", message);
      if (incomingGroupId === groupId) {
        set((state) => {
          const exists = state.groupMessages.some((m) => m._id === message._id);
          if (exists) {
            console.log("📎 Duplicate message ignored");
            return state;
          }
          console.log("📬 Appending new group message");
          return {
            groupMessages: [...state.groupMessages, message],
          };
        });
      } else {
        console.log("📤 Message received for another group:", incomingGroupId);
      }
    };

    console.log("👂 Subscribing to group messages for:", groupId);
    socket.on("receiveGroupMessage", groupMessageHandler);
  },

  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket && groupMessageHandler) {
      console.log("🔕 Unsubscribing from group messages");
      socket.off("receiveGroupMessage", groupMessageHandler);
      groupMessageHandler = null;
    }
  },
}));
