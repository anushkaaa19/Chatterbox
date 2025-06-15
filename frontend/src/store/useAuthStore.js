import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { auth, provider, signInWithPopup, signOut } from "../firebase.jsx";
import { createSocket } from "../lib/socket.js";

const API_URL = "https://chatterbox-backend-rus5.onrender.com/api";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      authUser: null,
      isSigningUp: false,
      isLoggingIn: false,
      isUpdatingProfile: false,
      isCheckingAuth: true,
      onlineUsers: [],
      socket: null,
      resetEmail: null,
      resetToken: null,

      setResetEmail: (email) => set({ resetEmail: email }),
      setResetToken: (token) => set({ resetToken: token }),
      setAuthUser: (user) => set({ authUser: user }),
      setIsCheckingAuth: (val) => set({ isCheckingAuth: val }),

      forgotPassword: async (email) => {
        try {
          const res = await axiosInstance.post("/auth/forgot-password", { email });
          toast.success(res.data.message || "OTP sent to your email");
          return { success: true, message: res.data.message };
        } catch (error) {
          const message = error.response?.data?.message || error.message || "Failed to send OTP";
          toast.error(message);
          return { success: false, message };
        }
      },

      verifyOtp: async (email, otp) => {
        try {
          const res = await axiosInstance.post("/auth/verify-otp", { email, otp });
          set({ resetEmail: email, resetToken: res.data.tempToken });
          toast.success("OTP verified! You can now reset your password.");
          return { success: true, data: res.data };
        } catch (error) {
          const message = error.response?.data?.message || error.message || "OTP verification failed";
          toast.error(message);
          return { success: false, message };
        }
      },

      resetPassword: async (newPassword) => {
        const { resetEmail: email, resetToken: token } = get();

        if (!email || !token) {
          toast.error("No email or token found, please verify OTP first.");
          return { success: false, message: "Missing email or token" };
        }

        try {
          const res = await axiosInstance.post(
            "/auth/reset-password",
            { email, newPassword, token },
            { withCredentials: true }
          );
          toast.success(res.data.message || "Password reset successful!");
          set({ resetEmail: null, resetToken: null });
          return { success: true, message: res.data.message };
        } catch (error) {
          const message = error.response?.data?.message || error.message || "Password reset failed";
          toast.error(message);
          return { success: false, message };
        }
      },

      checkAuth: async () => {
        try {
          const res = await axiosInstance.get("/auth/check");
          set({ authUser: res.data });
          get().connectSocket();
          return res.data;
        } catch (error) {
          if (error.response?.status === 401) {
            set({ authUser: null });
          } else {
            console.error("Auth check error:", error);
          }
          return null;
        } finally {
          set({ isCheckingAuth: false });
        }
      },

      signup: async (data) => {
        set({ isSigningUp: true });
        try {
          await axiosInstance.post("/auth/signup", data);
          await new Promise((r) => setTimeout(r, 500));
          await get().checkAuth();
          toast.success("Account created successfully");
        } catch (error) {
          if (error.response?.data?.errors) {
            error.response.data.errors.forEach((err) => toast.error(err.msg));
          } else {
            toast.error(error.response?.data?.message || "Signup failed");
          }
        } finally {
          set({ isSigningUp: false });
        }
      },

      login: async (data) => {
        set({ isLoggingIn: true });
        try {
          await axiosInstance.post("/auth/login", data);

          setTimeout(async () => {
            await get().checkAuth();
          }, 300);

          toast.success("Logged in successfully");
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "Login failed");
          return false;
        } finally {
          set({ isLoggingIn: false });
        }
      },

      logout: async () => {
        try {
          await signOut(auth); // Firebase logout
          await axiosInstance.post("/auth/logout");

          get().disconnectSocket();

          set({
            authUser: null,
            onlineUsers: [],
            socket: null,
            resetEmail: null,
            resetToken: null,
          });

          toast.success("Logged out successfully");
        } catch (error) {
          console.error("Logout error:", error);
          toast.error(error.response?.data?.message || error.message);
        }
      },

      updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
          const response = await axiosInstance.put("/auth/update-profile", data);
          set({ authUser: response.data.user });
          toast.success("Profile updated successfully");
        } catch (err) {
          console.error("Update profile error:", err);
          toast.error(err.response?.data?.message || err.message || "Failed to update profile");
        } finally {
          set({ isUpdatingProfile: false });
        }
      },

      signInWithGoogle: async () => {
        try {
          const result = await signInWithPopup(auth, provider);
          const user = result.user;

          const res = await axiosInstance.post("/auth/google", {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          });

          set({ authUser: res.data.user });
          get().connectSocket();

          toast.success("Signed in with Google!");
        } catch (error) {
          await signOut(auth);
          const message = error.response?.data?.message || error.message || "Google sign-in failed";
          toast.error(message);
          throw error;
        }
      },

      connectSocket: () => {
        const { authUser, socket } = get();
        if (!authUser?._id) return;
      
        if (socket?.connected) socket.disconnect();
      
        const sock = createSocket(authUser._id);
      
        sock.on("connect", () => {
          console.log("🔌 Socket connected");
      
          // ✅ Listen to incoming real-time messages
          useChatStore.getState().subscribeToMessageEvents();
        });
      
        sock.on("disconnect", () => console.log("❌ Socket disconnected"));
      
        sock.on("getOnlineUsers", (users) => set({ onlineUsers: users }));
      
        set({ socket: sock });
      },
      

      disconnectSocket: () => {
        const { socket } = get();
        if (socket?.connected) {
          socket.disconnect();
          set({ socket: null });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        authUser: state.authUser,
      }),
    }
  )
);
