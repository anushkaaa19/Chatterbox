import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const resetEmail = useAuthStore((state) => state.resetEmail);
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="bg-[#1a1a1a] p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6 border border-gray-700">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Reset Your Password</h2>
          <p className="text-sm text-gray-400">Enter and confirm your new password</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input w-full bg-gray-900 text-white border-gray-700 focus:border-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input w-full bg-gray-900 text-white border-gray-700 focus:border-blue-500"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
