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

  // Store socket for group chat
  setSocket: (socket) => set({ socket }),

  // Handle switching groups
  setSelectedGroup: (group) => {
    const socket = useAuthStore.getState().socket;
    const { selectedGroup } = get();

    if (socket && selectedGroup?._id) {
      socket.emit("leaveGroup", selectedGroup._id);
    }

    if (socket && group?._id) {
      socket.emit("joinGroup", group._id);
    }

    set({ selectedGroup: group });
  },

  // Replace entire message list
  setGroupMessages: (messages) =>
    set({ groupMessages: Array.isArray(messages) ? messages : [] }),

  // Fetch groups for current user
  getGroups: async () => {
    set({ isGroupLoading: true });
    try {
      const { data } = await axiosInstance.get("/groups");
      set({ groups: data.groups || [], isGroupLoading: false });
    } catch (err) {
      console.error("Error fetching groups", err);
      toast.error("Failed to load groups");
      set({ isGroupLoading: false });
    }
  },

  // Create new group
  createGroup: async (formData) => {
    try {
      const res = await axiosInstance.post("/groups", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const group = res.data?.group;
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
      console.error("Create group failed:", err);
      toast.error("Failed to create group");
      throw err;
    }
  },

  // Fetch messages for selected group
  getGroupMessages: async (groupId) => {
    try {
      const { data } = await axiosInstance.get(`/groups/${groupId}/messages`);
      const messages = Array.isArray(data.messages)
        ? data.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        : [];
      set({ groupMessages: messages });
      return messages;
    } catch (err) {
      console.error("Error loading group messages", err);
      toast.error("Failed to load messages");
      return [];
    }
  },

  // Send a group message
  sendGroupMessage: async (groupId, messageData) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/messages`, messageData);
      return res.data?.message;
    } catch (err) {
      console.error("Error sending group message", err);
      toast.error("Failed to send message");
      throw err;
    }
  },

  // Listen to incoming group messages
  subscribeToGroupMessages: (groupId) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Remove previous listener
    if (groupMessageHandler) {
      socket.off("receiveGroupMessage", groupMessageHandler);
    }

    // New handler scoped to specific group
    groupMessageHandler = ({ groupId: incomingGroupId, message }) => {
      if (incomingGroupId === groupId) {
        set((state) => {
          const exists = state.groupMessages.some((m) => m._id === message._id);
          if (exists) return state;
          return {
            groupMessages: [...state.groupMessages, message],
          };
        });
      }
    };

    socket.on("receiveGroupMessage", groupMessageHandler);
  },

  // Remove group message listener
  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket && groupMessageHandler) {
      socket.off("receiveGroupMessage", groupMessageHandler);
      groupMessageHandler = null;
    }
  },
}));
