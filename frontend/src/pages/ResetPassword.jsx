import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const resetEmail = useAuthStore(state => state.resetEmail);
  const resetPassword = useAuthStore(state => state.resetPassword);
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
  
    const result = await resetPassword(newPassword); // ✅ fixed this line
  
    if (result.success) {
      toast.success("Password reset successfully! Please log in.");
      navigate("/login");
    } else {
      toast.error(result.message || "Failed to reset password");
    }
  };
  

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">Reset Your Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Reset Password
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
