// src/store/useChatStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
export const useChatStore = create((set, get) => ({
  messages: [],         // list of messages in the current chat
  users: [],            // list of users for sidebar
  selectedUser: null,   // currently selected chat user
  isUsersLoading: false,
  isMessagesLoading: false,

  // Fetch all users for sidebar
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

  // Fetch messages for the selected user
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

  // Send message to selected user
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
      // The backend should return the saved message object
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
    const messages = get().messages.map((msg) =>
      msg._id === updatedMessage._id ? updatedMessage : msg
    );
    set({ messages });
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
              ? msg.likes.filter((uid) => uid !== authUser._id) // Unlike
              : [...msg.likes, authUser._id],                   // Like
          }
        : msg
    ),
  }));
},
  
  
  
  // Subscribe to real-time messages from socket.io
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      // Only add messages from currently selected user
      const isFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
    } else {
      console.warn("unsubscribeFromMessages: socket is null or undefined");
    }
  },
  
  setSelectedUser: (user) => set({ selectedUser: user }),
}));
