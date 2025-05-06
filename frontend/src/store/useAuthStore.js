import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { auth, provider, signInWithPopup, signOut } from "../firebase.jsx"; // Updated import

// Separate URL for REST API and WebSocket
const API_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5001/api"
    : "/api";

const SOCKET_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5001"
    : undefined; // Update with production socket URL if needed

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  signInWithGoogle: async () => {
    try {
      // 1. Sign in with Firebase
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // 2. Authenticate with your backend
      const res = await axiosInstance.post("/auth/google", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
      
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      // If backend auth fails, sign out from Firebase too
      await signOut(auth);
      throw error;
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },
  logout: async () => {
    try {
      // Sign out from Firebase (works for all auth methods)
      await signOut(auth);
      
      // Clear backend session
      await axiosInstance.post("/auth/logout");
      
      // Reset local state
      set({ authUser: null, onlineUsers: [] });
      get().disconnectSocket();
      
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(error.response?.data?.message || error.message);
    }
  },
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser?._id || socket?.connected) return;

    const sock = io(SOCKET_URL, {
      query: { userId: authUser._id },
      transports: ["websocket"]
    });

    sock.on("connect", () => {
      console.log("Socket connected:", sock.id);
    });

    sock.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    sock.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    set({ socket: sock });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },
}));
