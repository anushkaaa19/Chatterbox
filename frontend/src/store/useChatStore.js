// src/store/useChatStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  users: [],
  messages: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  typingUsers: [],

  addTypingUser: (userId) => {
    set((state) => ({
      typingUsers: state.typingUsers.includes(userId)
        ? state.typingUsers
        : [...state.typingUsers, userId],
    }));
  },

  removeTypingUser: (userId) => {
    set((state) => ({
      typingUsers: state.typingUsers.filter((id) => id !== userId),
    }));
  },

  subscribeToTypingEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("typing", ({ userId }) => {
      get().addTypingUser(userId);
    });

    socket.on("stopTyping", ({ userId }) => {
      get().removeTypingUser(userId);
    });
  },

  unsubscribeFromTypingEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("typing");
    socket.off("stopTyping");
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      const users = res.data?.users ?? [];
      set({ users });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to load users";
      toast.error(msg);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      const data = res.data?.messages ?? res.data;
      set({ messages: Array.isArray(data) ? data : [] });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to load messages";
      toast.error(msg);
      set({ messages: [] });
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser?._id) {
      const err = new Error("No recipient selected");
      toast.error(err.message);
      throw err;
    }

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      const newMsg = res.data?.message ?? res.data;
      if (!newMsg || !newMsg._id) {
        throw new Error("Invalid message returned from server");
      }
      set({ messages: [...messages, newMsg] });
      return newMsg;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to send message";
      toast.error(msg);
      throw err;
    }
  },

  updateMessage: (updatedMessage) => {
    const updated = get().messages.map((msg) =>
      msg._id === updatedMessage._id ? updatedMessage : msg
    );
    set({ messages: updated });
  },

  editMessage: async (id, newText) => {
    try {
      const res = await axiosInstance.put(`/messages/edit/${id}`, { newText });
      get().updateMessage(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to edit message");
    }
  },

  toggleLike: (messageId) => {
    const { authUser } = useAuthStore.getState();
    if (!authUser || !authUser._id) return;

    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === messageId
          ? {
              ...msg,
              likes: msg.likes.includes(authUser._id)
                ? msg.likes.filter((uid) => uid !== authUser._id)
                : [...msg.likes, authUser._id],
            }
          : msg
      ),
    }));
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      if (newMessage.senderId !== selectedUser._id) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
    }
  },

  setSelectedUser: (user) => set({ selectedUser: user }),
}));
