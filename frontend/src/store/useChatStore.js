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

  setSelectedUser: (user) => {
    const socket = useAuthStore.getState().socket;
    const prevUser = get().selectedUser;

    // Leave previous room
    if (socket && prevUser?._id) {
      socket.emit("leaveRoom", prevUser._id);
    }

    // Join new room
    if (socket && user?._id) {
      socket.emit("joinRoom", user._id);
    }

    set({ selectedUser: user, messages: [] });
  },

  addTypingUser: (userId) =>
    set((state) => ({
      typingUsers: state.typingUsers.includes(userId)
        ? state.typingUsers
        : [...state.typingUsers, userId],
    })),

  removeTypingUser: (userId) =>
    set((state) => ({
      typingUsers: state.typingUsers.filter((id) => id !== userId),
    })),

  subscribeToTypingEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("typing", ({ userId }) => get().addTypingUser(userId));
    socket.on("stopTyping", ({ userId }) => get().removeTypingUser(userId));
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
      set({ users: res.data?.users ?? [] });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    if (!userId) {
      toast.error("User ID is missing while fetching messages");
      return;
    }
  
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/chat/${userId}`);
      set({ messages: res.data?.messages ?? [] });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load messages");
      set({ messages: [] });
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const selectedUser = get().selectedUser;
    if (!selectedUser) throw new Error("No user selected");
  
    try {
      const formData = new FormData();
      formData.append("text", messageData.text || "");
  
      const dataURLtoFile = async (dataUrl, filename, mimeType) => {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return new File([blob], filename, { type: mimeType });
      };
  
      if (messageData.image) {
        const imageFile = await dataURLtoFile(messageData.image, "image.png", "image/png");
        formData.append("image", imageFile);
      }
  
      if (messageData.audio) {
        const audioFile = await dataURLtoFile(messageData.audio, "audio.webm", "audio/webm");
        formData.append("audio", audioFile);
      }
  
      const res = await axiosInstance.post(
        `/messages/chat/${selectedUser._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      return res.data;
    } catch (err) {
      console.error("Full error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to send message";
      toast.error(msg);
      throw err;
    }
  },  
  
  editMessage: async (id, newText) => {
    try {
      const res = await axiosInstance.put(`/messages/edit/${id}`, { newText });
      const updatedMsg = res.data?.message ?? res.data;
      get().updateMessage(updatedMsg);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to edit message");
    }
  },
  toggleLike: async (messageId) => {
    const { authUser } = useAuthStore.getState();
    if (!authUser || !authUser._id) return;
  
    // Optimistic UI update
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
  
    // Sync with backend
    try {
      const res = await axiosInstance.post(`/messages/like/${messageId}`);
      const updatedMessage = res.data.message;
      get().updateMessage(updatedMessage);
    } catch (err) {
      toast.error("Failed to like/unlike message");
    }
  },  

  updateMessage: (updatedMsg) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === updatedMsg._id ? updatedMsg : msg
      ),
    }));
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMsg) => {
      const { selectedUser, messages } = get();
      if (newMsg.senderId === selectedUser?._id) {
        const alreadyExists = messages.some((msg) => msg._id === newMsg._id);
        if (!alreadyExists) {
          set({ messages: [...messages, newMsg] });
        }
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) socket.off("newMessage");
  },
}));
