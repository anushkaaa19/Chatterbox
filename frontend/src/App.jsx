import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import LearnPage from "./pages/LearnPage";
import DemoPage from "./pages/DemoPage";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOtp from "./pages/VerifyOtp";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";

import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useGroupStore } from "./store/useGroupStore";

const App = () => {
  // ✅ Call all hooks at top-level
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();
  const { subscribeToGroupEvents } = useGroupStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const checkAuthState = async () => {
      if (!document.cookie.includes("jwt")) {
        useAuthStore.setState({ authUser: null, isCheckingAuth: false });
        return;
      }
      await useAuthStore.getState().checkAuth();
    };
    checkAuthState();
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ✅ Safe: conditional logic AFTER hooks
  useEffect(() => {
    subscribeToGroupEvents();
  }, []);

  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Home />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/verify-otp" element={!authUser ? <VerifyOtp /> : <Navigate to="/" />} />
        <Route path="/password" element={!authUser ? <ForgotPassword /> : <Navigate to="/" />} />
        <Route path="/reset-password" element={!authUser ? <ResetPassword /> : <Navigate to="/" />} />
      </Routes>
      <Toaster />
    </>
  );
};

export default App;
