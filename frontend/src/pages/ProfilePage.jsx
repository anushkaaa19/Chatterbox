import { useState } from "react";
import { User, Mail, Camera } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg,setSelectedImg]=useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload=async()=>{
        const base64Image=reader.result;
        setSelectedImg(base64Image);
        await updateProfile({profilePic:base64Image});

    }
}


  return (
    <div className="min-h-screen pt-20 bg-base-100">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8 shadow-sm">
          {/* Profile Header */}
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-base-content">Profile</h1>
            <p className="mt-2 text-base-content/70">Your profile information</p>
          </div>

          {/* Avatar Upload Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img 
                src={selectedImg||authUser.profilePic || "/avatar.png"} 
                alt="Profile" 
                className="size-32 rounded-full object-cover border-4 border-base-100 shadow-md"
              />
              <label 
                htmlFor="avatar-upload"
                className={`
                  absolute -bottom-2 -right-2
                  bg-primary hover:bg-primary-focus
                  p-2 rounded-full cursor-pointer
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-primary-content" />
              </label>
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUpdatingProfile}
              />
            </div>
            <p className="text-sm text-base-content/60">
              {isUpdatingProfile ? "Uploading..." : "Click to update profile photo"}
            </p>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            {/* Full Name Section */}
            <div className="space-y-1.5">
              <div className="text-sm text-base-content/60 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border border-base-300 text-base-content">
                {authUser?.fullName || "Not provided"}
              </p>
            </div>

            {/* Email Section */}
            <div className="space-y-1.5">
              <div className="text-sm text-base-content/60 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border border-base-300 text-base-content">
                {authUser?.email || "Not provided"}
              </p>
            </div>
          </div>

          {/* Account Information */}
          <div className="mt-6 bg-base-200 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4 text-base-content">Account Information</h2>
            
            <div className="space-y-3 text-sm">
              {/* Member Since */}
              <div className="flex items-center justify-between py-2 border-b border-base-300">
                <span className="text-base-content/70">Member Since</span>
                <span className="text-base-content">
                  {authUser.createdAt ?.split("T")[0]}

                </span>
              </div>

              {/* Account Status */}
              <div className="flex items-center justify-between py-2">
                <span className="text-base-content/70">Account Status</span>
                <span className="text-green-500 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;