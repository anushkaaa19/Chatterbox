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

  // ✅ NEW — Listen for incoming real-time messages
  subscribeToMessageEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("receiveMessage", (message) => {
      get().addMessage(message);
    });
  },

  unsubscribeFromMessageEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("receiveMessage");
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
    set({ isMessagesLoading: true, messages: [] });
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
    const { selectedUser, messages, socket } = get();
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
      if (!newMsg || !newMsg._id) throw new Error("Invalid message from server");

      set({ messages: [...messages, newMsg] });

      if (socket) {
        socket.emit("sendMessage", newMsg); // ✅ Emit to server
      }

      return newMsg;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to send message";
      toast.error(msg);
      throw err;
    }
  },

  addMessage: (message) => {
    set((state) => {
      const exists = state.messages.some(
        (m) => m._id === message._id || m.id === message.id
      );
      if (exists) return state;
      return { messages: [...state.messages, message] };
    });
  },

  updateMessage: (updatedMessage) => {
    const updated = get().messages.map((msg) =>
      msg._id === updatedMessage._id ? updatedMessage : msg
    );
    set({ messages: updated });
  },

  editMessage: async (messageId, newText) => {
    try {
      const { data } = await axiosInstance.put(`/messages/edit/${messageId}`, {
        newText,
      });
      const updatedMsg = data.message;

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                content: { ...msg.content, text: newText },
                edited: true,
              }
            : msg
        ),
      }));

      toast.success("Message edited");
    } catch (error) {
      toast.error("Failed to edit message");
      console.error(error);
    }
  },

  toggleLike: async (messageId) => {
    try {
      const { data } = await axiosInstance.post(`/messages/like/${messageId}`);
      const updatedMsg = data.message;

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId
            ? { ...msg, likedBy: updatedMsg.likedBy }
            : msg
        ),
      }));

      toast.success("Toggled like");
    } catch (error) {
      toast.error("Failed to toggle like");
      console.error(error);
    }
  },

  setSelectedUser: (user) => {
    set({ selectedUser: user, messages: [] });
    if (user?._id) {
      get().getMessages(user._id);
    }
  },
}));
