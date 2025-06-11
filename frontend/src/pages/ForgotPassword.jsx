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
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="card w-full max-w-md shadow-xl bg-base-100 border border-base-300">
        <form onSubmit={handleSendOtp} className="card-body space-y-5">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Forgot Password</h2>
            <p className="text-sm text-base-content/60">
              Enter your email to receive an OTP
            </p>
          </div>

          <label className="form-control w-full">
            <span className="label-text font-medium">Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input input-bordered w-full"
            />
          </label>

          <button type="submit" className="btn btn-primary w-full">
            Send OTP
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
