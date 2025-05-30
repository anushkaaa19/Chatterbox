import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const email = useAuthStore((state) => state.resetEmail);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);

  useEffect(() => {
    if (!email) {
      navigate("/password");
    }
  }, [email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    const result = await verifyOtp(email, otp);

    if (result.success) {
      toast.success("OTP verified. You can now reset your password.");
      navigate("/reset-password");
    } else {
      toast.error(result.message || "Invalid OTP");
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <form
        onSubmit={handleVerify}
        className="bg-[#1a1a1a] shadow-lg rounded-2xl p-8 w-full max-w-md space-y-6 border border-gray-700"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold">Verify OTP</h2>
          <p className="text-sm text-gray-400">Enter the OTP sent to your email</p>
        </div>

        <input
          type="text"
          className="input w-full bg-gray-900 text-white border-gray-700 focus:border-blue-500"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
        >
          Verify OTP
        </button>
      </form>
    </div>
  );
};

export default VerifyOtp;
