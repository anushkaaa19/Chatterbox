import React from "react";
import moment from "moment";

const UserProfileModal = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
      <div className="modal-box w-96 max-w-md p-6 relative">
        <button
          className="btn btn-sm btn-circle absolute right-4 top-4"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="avatar mb-4">
            <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img
                src={user.profilePic || "/avatar.png"}
                alt="Profile"
              />
            </div>
          </div>

          <h3 className="text-xl font-bold text-base-content">
            {user.fullName || "Unnamed User"}
          </h3>

          <p className="text-sm text-base-content/70 mt-1">
            {user.email || "No email provided"}
          </p>

          {user.bio && (
            <div className="mt-2 text-base text-base-content/80 italic">
              “{user.bio}”
            </div>
          )}

          <div className="divider mt-4 mb-2"></div>

          <div className="text-sm text-base-content/60">
            <p>
              <span className="font-medium text-base-content">Joined:</span>{" "}
              {user.createdAt
                ? moment(user.createdAt).format("MMMM D, YYYY")
                : "Unknown"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
