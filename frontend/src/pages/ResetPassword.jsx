import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../store/useThemeStore";

const ResetPassword = () => {
  const resetEmail = useAuthStore((state) => state.resetEmail);
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  console.log("Current theme in ResetPassword:", theme);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resetEmail) {
      toast.error("No reset email found. Please verify OTP first.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const result = await resetPassword(newPassword);

    if (result.success) {
      toast.success("Password reset successfully! Please log in.");
      navigate("/login");
    } else {
      toast.error(result.message || "Failed to reset password");
    }
  };

  return (
    <div data-theme={theme} className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl p-6 border border-base-300">
        <h2 className="text-2xl font-bold mb-2 text-center">Reset Your Password</h2>
        <p className="text-sm text-base-content/70 text-center mb-4">Enter and confirm your new password</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input input-bordered w-full"
            required
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input input-bordered w-full"
            required
          />
          <button type="submit" className="btn btn-primary w-full">Reset Password</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
