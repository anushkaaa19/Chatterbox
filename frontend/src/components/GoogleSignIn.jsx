import React from 'react'
import { useAuthStore } from "../store/useAuthStore";


const GoogleSignIn = () => {
  const { signInWithGoogle } = useAuthStore();
  return (
    <div>
      <button onClick={signInWithGoogle} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:shadow-md transition duration-200">
  <img
    src="https://developers.google.com/identity/images/g-logo.png"
    alt="Google logo"
    className="w-5 h-5"
  />
  <span className="text-sm text-gray-700">Sign in with Google</span>
</button>

    </div>
  )
}

export default GoogleSignIn
