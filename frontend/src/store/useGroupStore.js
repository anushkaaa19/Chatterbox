import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import { useAuthStore } from "./useAuthStore"; // make sure this path is correct

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupLoading: false,

  setSelectedGroup: (group) => set({ selectedGroup: group }),

  setGroupMessages: (messages) => set({ groupMessages: messages }),

  // ✅ Fetch all groups the user is part of
  getGroups: async () => {
    set({ isGroupLoading: true });
    try {
      const { data } = await axiosInstance.get("/groups");
      set({ groups: data.groups, isGroupLoading: false });
    } catch (err) {
      console.error("Error fetching groups", err);
      set({ isGroupLoading: false });
    }
  },

  // ✅ Create a new group
  createGroup: async (formData) => {
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create group");
    } catch (err) {
      console.error("Create group failed:", err);
    }
  },
  

  // ✅ Load all messages from a specific group
  getGroupMessages: async (groupId) => {
    try {
      const { data } = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ groupMessages: data.messages });
      return data.messages;
    } catch (err) {
      console.error("Error loading group messages", err);
      return [];
    }
  },

  // ✅ Send a group message
  sendGroupMessage: async (groupId, messageData) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/messages`, messageData);
      const newMessage = res.data?.message;

      set((state) => ({
        groupMessages: [...state.groupMessages, newMessage],
      }));

      // Emit via socket to all group members
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("sendGroupMessage", { groupId, message: newMessage });
      }
    } catch (err) {
      toast.error("Failed to send group message");
      throw err;
    }
  },

  // ✅ Subscribe to real-time incoming group messages
  subscribeToGroupMessages: (groupId) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("receiveGroupMessage", ({ groupId: gid, message }) => {
      if (gid === groupId) {
        set((state) => ({
          groupMessages: [...state.groupMessages, message],
        }));
      }
    });
  },

  // ✅ Unsubscribe from socket messages when leaving
  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("receiveGroupMessage");
    }
  },

  // Optional: store socket for group-specific use
  socket: null,
  setSocket: (socket) => set({ socket }),
}));
