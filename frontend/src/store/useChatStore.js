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
 // Update the subscribeToMessages function

  // Subscribe to incoming messages
  subscribeToMessages: (userId) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return () => {};

    const handleIncomingMessage = (data) => {
      const message = data.message;
      const authUser = useAuthStore.getState().authUser;
      
      if (!message || !authUser?._id) return;

      const senderId = message.sender?._id || message.sender;
      const receiverId = message.receiver?._id || message.receiver;

      // Only add if relevant to current chat
      if ((senderId === userId && receiverId === authUser._id) || 
          (senderId === authUser._id && receiverId === userId)) {
        set(state => ({
          messages: state.messages.some(m => m._id === message._id) 
            ? state.messages 
            : [...state.messages, message]
        }));
      }
    };

    socket.on("newMessage", handleIncomingMessage);
    set({ socketListener: handleIncomingMessage });

    return () => {
      socket.off("newMessage", handleIncomingMessage);
    };
  },
// Update the sendMessage function
sendMessage: async (messageData) => {
  const { selectedUser, messages, socket } = get();
  if (!selectedUser?._id) {
    const err = new Error("No recipient selected");
    toast.error(err.message);
    throw err;
  }

  try {
    const res = await axiosInstance.post(`/messages/${selectedUser._id}`, messageData);
    const newMsg = res.data?.message;
    
    // Optimistically add message
    set({ messages: [...messages, newMsg] });

    // Emit with consistent format
    socket?.emit("sendMessage", {
      receiverId: selectedUser._id,
      message: newMsg
    });

    return newMsg;
  } catch (err) {
    toast.error(err.response?.data?.message || err.message || "Failed to send message");
    throw err;
  }
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