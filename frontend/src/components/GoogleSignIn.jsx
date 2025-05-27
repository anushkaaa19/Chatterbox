import React from "react";
import { useAuthStore } from "../store/useAuthStore";

const GoogleSignIn = () => {
  const { signInWithGoogle } = useAuthStore();

  return (
    <div className="w-full mt-4">
      <button
        onClick={signInWithGoogle}
        className="btn btn-outline w-full flex items-center justify-center gap-3 normal-case"
      >
        <img
          src="https://developers.google.com/identity/images/g-logo.png"
          alt="Google logo"
          className="w-5 h-5"
        />
        <span>Sign in with Google</span>
      </button>
    </div>
  );
};

export default GoogleSignIn;
