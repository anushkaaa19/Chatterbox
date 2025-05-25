import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const email = useAuthStore((state) => state.resetEmail);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);

  useEffect(() => {
    if (!email) {
      navigate("/password"); // redirect if no email in store
    }
  }, [email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    const result = await verifyOtp(email, otp);

    if (result.success) {
      navigate("/reset-password");
    } else {
      alert(result.message || "Invalid OTP");
    }
  };

  if (!email) return null; // Or loading spinner

  return (
    <form onSubmit={handleVerify} className="space-y-4 p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold">Verify OTP</h2>
      <input
        type="text"
        className="input input-bordered w-full"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        required
      />
      <button className="btn btn-primary w-full">Verify</button>
    </form>
  );
};

export default VerifyOtp;
