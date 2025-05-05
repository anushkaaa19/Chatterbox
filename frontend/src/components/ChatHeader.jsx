import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  // Return early if no user is selected
  if (!selectedUser) {
    return (
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="size-10 rounded-full bg-base-300"></div>
            </div>
            <div>
              <h3 className="font-medium">No user selected</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar with null check */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img 
                src={selectedUser?.profilePic || "/avatar.png"} 
                alt={selectedUser?.fullName || "User avatar"} 
              />
            </div>
          </div>

          {/* User info with null checks */}
          <div>
            <h3 className="font-medium">
              {selectedUser?.fullName || "Unknown User"}
            </h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers?.includes(selectedUser?._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => setSelectedUser(null)}>
          <X />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;