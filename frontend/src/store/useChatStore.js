import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

let dmMessageHandler = null;

export const useChatStore = create((set, get) => ({
  users: [],
  messages: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  typingUsers: [],

  // === Subscriptions ===
  subscribeToMessages: (userId) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    if (dmMessageHandler) {
      socket.off("receiveMessage", dmMessageHandler);
    }

    dmMessageHandler = ({ senderId, message }) => {
      // Only add if from current chat
      if (senderId === userId) {
        get().addMessage(message);
      }
    };

    socket.on("receiveMessage", dmMessageHandler);
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket && dmMessageHandler) {
      socket.off("receiveMessage", dmMessageHandler);
      dmMessageHandler = null;
    }
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

  // === Typing ===
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

  // === Fetching ===
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data?.users ?? [] });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true, messages: [] });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data?.messages ?? [] });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // === Send Message ===
  sendMessage: async (messageData) => {
    const { selectedUser, messages, socket } = get();
    if (!selectedUser?._id) {
      const err = new Error("No recipient selected");
      toast.error(err.message);
      throw err;
    }

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      const newMsg = res.data?.message;
      if (!newMsg || !newMsg._id) throw new Error("Invalid message");

      // Optimistically add message
      set({ messages: [...messages, newMsg] });

      // Emit to recipient
      socket?.emit("sendMessage", {
        receiverId: selectedUser._id,
        message: newMsg,
      });

      return newMsg;
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to send message");
      throw err;
    }
  },

  // === Message Helpers ===
  addMessage: (message) => {
    set((state) => {
      const exists = state.messages.some((m) => m._id === message._id || m.id === message.id);
      return exists ? state : { messages: [...state.messages, message] };
    });
  },

  updateMessage: (updatedMessage) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === updatedMessage._id ? updatedMessage : msg
      ),
    }));
  },

  editMessage: async (messageId, newText) => {
    try {
      const res = await axiosInstance.put(`/messages/edit/${messageId}`, { newText });
      const updatedMsg = res.data?.message;
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId
            ? { ...msg, content: { ...msg.content, text: newText }, edited: true }
            : msg
        ),
      }));
      toast.success("Message edited");
    } catch (err) {
      toast.error("Failed to edit message");
      console.error(err);
    }
  },

  toggleLike: async (messageId) => {
    try {
      const res = await axiosInstance.post(`/messages/like/${messageId}`);
      const updatedMsg = res.data?.message;
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, likedBy: updatedMsg.likedBy } : msg
        ),
      }));
    } catch (err) {
      toast.error("Failed to like message");
      console.error(err);
    }
  },

  // === Selection ===
  setSelectedUser: (user) => {
    const socket = useAuthStore.getState().socket;
    const prevUser = get().selectedUser;

    if (socket && prevUser?._id) {
      socket.emit("leaveRoom", prevUser._id);
    }

    if (socket && user?._id) {
      socket.emit("joinRoom", user._id);
    }

    set({ selectedUser: user, messages: [] });

    if (user?._id) {
      get().getMessages(user._id);
      get().subscribeToMessages(user._id);
    }
  },
}));
