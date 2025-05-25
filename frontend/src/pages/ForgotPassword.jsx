import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore"; // adjust path accordingly

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const setResetEmail = useAuthStore((state) => state.setResetEmail);

  const handleSendOtp = async (e) => {
    e.preventDefault();

    const result = await forgotPassword(email);

    if (result.success) {
      setStatus("OTP sent!");
      setResetEmail(email);
      navigate("/verify-otp");
    } else {
      setStatus(result.message);
    }
  };

  return (
    <form onSubmit={handleSendOtp} className="space-y-4 p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold">Reset Password</h2>
      <input
        type="email"
        className="input input-bordered w-full"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button className="btn btn-primary w-full">Send OTP</button>
      {status && <p className="text-sm text-center mt-2">{status}</p>}
    </form>
  );
};

export default ForgotPassword;
