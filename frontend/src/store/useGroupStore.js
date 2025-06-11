import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupLoading: false,

  setSelectedGroup: (group) => set({ selectedGroup: group }),
  setGroupMessages: (messages) => set({ groupMessages: messages }),

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

  createGroup: async (formData) => {
    try {
      const res = await axiosInstance.post("/groups", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = res.data;
      toast.success("Group created successfully");

      await get().getGroups(); // Refresh after creation

      return data.group;
    } catch (err) {
      console.error("Create group failed:", err);
      toast.error("Failed to create group");
      throw err;
    }
  },

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

  sendGroupMessage: async (groupId, messageData) => {
    try {
      const res = await axiosInstance.post(
        `/groups/${groupId}/messages`,
        messageData
      );

      const newMessage = res.data?.message;

      set((state) => ({
        groupMessages: [...state.groupMessages, newMessage],
      }));

      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("sendGroupMessage", { groupId, message: newMessage });
      }
    } catch (err) {
      toast.error("Failed to send group message");
      throw err;
    }
  },

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

  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("receiveGroupMessage");
    }
  },

  socket: null,
  setSocket: (socket) => set({ socket }),
}));
