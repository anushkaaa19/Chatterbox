// src/store/useChatStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

// Global direct message socket handler
let dmMessageHandler = null;

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
// --- useChatStore.js ---
editMessage: async (id, newText) => {
  try {
    const res = await axiosInstance.put(`/messages/edit/${id}`, { newText });
    // Update the specific message in the store
    set((state) => ({
      messages: state.messages.map(msg => 
        msg._id === id ? {...msg, content: {...msg.content, text: newText}, edited: true} : msg
      )
    }));
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to edit message");
  }
},

toggleLike: async (messageId) => {
  try {
    const res = await axiosInstance.post(`/messages/like/${messageId}`);
    // Update the specific message in the store
    set((state) => ({
      messages: state.messages.map(msg => 
        msg._id === messageId ? {
          ...msg, 
          likedBy: res.data.message.likedBy 
        } : msg
      )
    }));
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to toggle like");
  }
},

  subscribeToMessages: () => {
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;
    if (!selectedUser || !socket) return;

    // Unsubscribe previous
    if (dmMessageHandler) {
      socket.off("newMessage", dmMessageHandler);
    }

    // New handler
    dmMessageHandler = (newMessage) => {
      if (newMessage.senderId !== selectedUser._id) return;

      set((state) => {
        const exists = state.messages.some(m => m._id === newMessage._id);
        return exists
          ? state
          : { messages: [...state.messages, newMessage] };
      });
    };

    socket.on("newMessage", dmMessageHandler);
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket && dmMessageHandler) {
      socket.off("newMessage", dmMessageHandler);
      dmMessageHandler = null;
    }
  },

  setSelectedUser: (user) => {
    get().unsubscribeFromMessages();
    set({ selectedUser: user, messages: [] });

    if (user?._id) {
      get().getMessages(user._id);
      get().subscribeToMessages();
    }
  },
}));
