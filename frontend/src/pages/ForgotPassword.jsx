import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const setResetEmail = useAuthStore((state) => state.setResetEmail);

  const handleSendOtp = async (e) => {
    e.preventDefault();

    const result = await forgotPassword(email);

    if (result.success) {
      toast.success("OTP sent to your email!");
      setResetEmail(email);
      navigate("/verify-otp");
    } else {
      toast.error(result.message || "Failed to send OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <form
        onSubmit={handleSendOtp}
        className="bg-[#1a1a1a] shadow-lg rounded-2xl p-8 w-full max-w-md space-y-6 border border-gray-700"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold">Forgot Password</h2>
          <p className="text-sm text-gray-400">Enter your email to receive an OTP</p>
        </div>

        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input w-full bg-gray-900 text-white border-gray-700 focus:border-blue-500"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
        >
          Send OTP
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
