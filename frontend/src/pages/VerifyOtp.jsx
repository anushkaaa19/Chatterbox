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
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="card w-full max-w-md shadow-xl bg-base-100 border border-base-300">
        <form onSubmit={handleVerify} className="card-body space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Verify OTP</h2>
            <p className="text-sm text-base-content/60">
              Enter the OTP sent to your email
            </p>
          </div>

          <input
            type="text"
            placeholder="Enter OTP"
            className="input input-bordered w-full"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />

          <button type="submit" className="btn btn-primary w-full">
            Verify OTP
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
