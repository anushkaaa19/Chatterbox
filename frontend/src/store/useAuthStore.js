import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { auth, provider, signInWithPopup, signOut } from "../firebase.jsx";

const API_URL ="https://chatterbox-backend-rus5.onrender.com/api";

const SOCKET_URL ="https://chatterbox-backend-rus5.onrender.com";

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
        const email = get().resetEmail;
        const token = get().resetToken;

        if (!email || !token) {
          const msg = "No email or token found, please verify OTP first.";
          toast.error(msg);
          return { success: false, message: msg };
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
          set({ authUser: res.data});
          get().connectSocket();
          return res.data;
        } catch (error) {
          if (error.response?.status === 401) {
            set({ authUser: null });
          } else {
            console.error("Auth check error:", error); // <-- Add this
          }
          return null;
        }
        finally {
          set({ isCheckingAuth: false });
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
      
          // set user from returned payload
          set({ authUser: res.data.user });
      
          // connect socket if needed
          get().connectSocket();
      
          toast.success("Signed in with Google!");
        } catch (error) {
          await signOut(auth);
          const message = error.response?.data?.message || error.message || "Google sign-in failed";
          toast.error(message);
          throw error;
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
          const res = await axiosInstance.post("/auth/login", data);
          await get().checkAuth();

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
          await signOut(auth);
          await axiosInstance.post("/auth/logout");
          set({
            authUser: null,
            onlineUsers: [],
            socket: null,
            resetEmail: null,
            resetToken: null,
          });
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
          // Use axiosInstance for consistency and automatic headers (including cookies)
          const response = await axiosInstance.put("/auth/update-profile", data);
          if (response.status !== 200) {
            throw new Error("Failed to update profile");
          }
          set({ authUser: response.data.user });
          toast.success("Profile updated successfully");
        } catch (err) {
          console.error("Update profile error:", err);
          toast.error(err.response?.data?.message || err.message || "Failed to update profile");
        } finally {
          set({ isUpdatingProfile: false });
        }
      },
      
      
      connectSocket: () => {
        const { authUser, socket } = get();
        if (!authUser?._id) return;
      
        if (socket?.connected) socket.disconnect(); // force disconnect if stale
      
        const sock = io(SOCKET_URL, {
          query: { userId: authUser._id },
          transports: ["websocket","polling"],
        });
      
        sock.on("connect", () => console.log("Socket connected"));
        sock.on("disconnect", () => console.log("Socket disconnected"));
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
      name: "auth-storage", // key in localStorage
      partialize: (state) => ({
        authUser: state.authUser,
      }), // persist only authUser
    }
  )
);
