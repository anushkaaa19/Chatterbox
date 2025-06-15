import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

// Global handler reference
let groupMessageHandler = null;

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupLoading: false,
  socket: null,

  setSocket: (socket) => set({ socket }),

  setSelectedGroup: (group) => {
    const authSocket = useAuthStore.getState().socket;
    const { selectedGroup } = get();

    if (authSocket && selectedGroup?._id) {
      authSocket.emit("leaveGroup", selectedGroup._id);
    }

    if (authSocket && group?._id) {
      authSocket.emit("joinGroup", group._id);
    }

    set({ selectedGroup: group });
  },

  setGroupMessages: (messages) =>
    set({ groupMessages: Array.isArray(messages) ? messages : [] }),

  getGroups: async () => {
    set({ isGroupLoading: true });
    try {
      const { data } = await axiosInstance.get("/groups");
      set({ groups: data.groups || [], isGroupLoading: false });
    } catch (err) {
      console.error("Error fetching groups", err);
      set({ isGroupLoading: false });
    }
  },

  createGroup: async (formData) => {
    try {
      const res = await axiosInstance.post("/groups", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const group = res.data?.group;
      toast.success("Group created successfully");

      set((state) => ({
        groups: [...state.groups, group],
      }));

      return group;
    } catch (err) {
      console.error("Create group failed:", err);
      toast.error("Failed to create group");
      throw err;
    }
  },

  getGroupMessages: async (groupId) => {
    try {
      const { data } = await axiosInstance.get(`/groups/${groupId}/messages`);
      const messages = data.messages || [];
      set({ groupMessages: messages });
      return messages;
    } catch (err) {
      console.error("Error loading group messages", err);
      return [];
    }
  },

  sendGroupMessage: async (groupId, messageData) => {
    try {
      const res = await axiosInstance.post(
        `/groups/${groupId}/messages`,
        messageData
      );
      return res.data?.message;
      // Server will handle the socket emission
    } catch (err) {
      console.error("Error sending message", err);
      toast.error("Failed to send group message");
      throw err;
    }
  },

  subscribeToGroupMessages: (groupId) => {
    const authSocket = useAuthStore.getState().socket;
    if (!authSocket) return;

    // Remove old listener if it exists
    if (groupMessageHandler) {
      authSocket.off("receiveGroupMessage", groupMessageHandler);
    }

    // Define a named handler and store globally
    groupMessageHandler = ({ groupId: gid, message }) => {
      if (gid === groupId) {
        set((state) => {
          // Check if message already exists to prevent duplicates
          const exists = state.groupMessages.some(m => m._id === message._id);
          return exists ? state : {
            groupMessages: [...(state.groupMessages || []), message],
          };
        });
      }
    };

    authSocket.on("receiveGroupMessage", groupMessageHandler);
  },

  unsubscribeFromGroupMessages: () => {
    const authSocket = useAuthStore.getState().socket;
    if (authSocket && groupMessageHandler) {
      authSocket.off("receiveGroupMessage", groupMessageHandler);
      groupMessageHandler = null;
    }
  },
}));