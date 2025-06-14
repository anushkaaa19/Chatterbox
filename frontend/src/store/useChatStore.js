// src/store/useChatStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";


// Remember to call initialize() when setting up the store
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
// Add this function
addMessage: (message) => {
  set((state) => {
    const exists = state.messages.some((m) => m._id === message._id);
    return exists ? state : { messages: [...state.messages, message] };
  });
},

// ... other functions ...

// Remove subscribeToMessages and unsubscribeFromMessages
setSelectedUser: (user) => {
  set({ selectedUser: user, messages: [] });
  if (user?._id) {
    get().getMessages(user._id);
  }
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
      if (!newMsg || !newMsg._id) {
        throw new Error("Invalid message returned from server");
      }
  
      set({ messages: [...messages, newMsg] });
  
      // ✅ EMIT SOCKET EVENT HERE
      // Inside sendMessage function:
if (socket) {
  socket.emit("forwardMessage", {
    message: newMsg,
    receiverId: selectedUser._id,
  });
}
  
      return newMsg;
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Failed to send message";
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
// ... existing code ...

setSocketListeners: () => {
  const { socket } = get();
  if (!socket) return;

  // Remove existing listener to avoid duplicates
  socket.off("newMessage");

  socket.on("newMessage", (data) => {
    const { message } = data;
    const { selectedUser, user } = get();
    
    if (!message || !selectedUser) return;
    
    const senderId = message.sender?._id || message.sender;
    const receiverId = message.receiver?._id || message.receiver;
    
    // Check if message belongs to current conversation
    const isRelevantMessage = 
      (senderId === user._id && receiverId === selectedUser._id) ||
      (receiverId === user._id && senderId === selectedUser._id);
    
    if (isRelevantMessage) {
      set((state) => {
        const exists = state.messages.some(m => m._id === message._id);
        return exists ? state : { messages: [...state.messages, message] };
      });
    }
  });
},

// ... existing code ...

  // 🟢 Add/Edit this function
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

  // 🟢 Add/Edit this function
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

  subscribeToMessages: () => {
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;
    if (!selectedUser || !socket) return;

    // Unsubscribe previous
    if (dmMessageHandler) {
      socket.off("newMessage", dmMessageHandler);
    }
    dmMessageHandler = (newMessage) => {
      const { user } = useAuthStore.getState();
      const { selectedUser } = get();
    
      const senderId = newMessage.sender?._id || newMessage.sender;
      const receiverId = newMessage.receiver?._id || newMessage.receiver;
    
      const isBetweenSelectedUser =
        (senderId === user._id && receiverId === selectedUser._id) ||
        (receiverId === user._id && senderId === selectedUser._id);
    
      if (!isBetweenSelectedUser) return;
    
      set((state) => {
        const exists = state.messages.some((m) => m._id === newMessage._id);
        return exists ? state : { messages: [...state.messages, newMessage] };
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
