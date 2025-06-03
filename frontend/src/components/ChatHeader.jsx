import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, typingUsers } = useChatStore();
  const { onlineUsers } = useAuthStore();

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

  const isTyping = typingUsers.includes(selectedUser._id);
  const isOnline = onlineUsers?.includes(selectedUser._id);

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar relative">
            <div className="size-10 rounded-full overflow-hidden">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName || "User avatar"}
                className="w-10 h-10 object-cover"
              />
            </div>
            {/* Online status green dot */}
            {isOnline && (
              <span
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-500"
                title="Online"
              />
            )}
          </div>

          <div>
            <h3 className="font-medium">{selectedUser.fullName || "Unknown User"}</h3>
            <p className="text-sm text-base-content/70">
              {isOnline ? "Online" : "Offline"}
            </p>
            {isTyping && <p className="text-xs text-blue-500 italic">Typing...</p>}
          </div>
        </div>

        <button
          onClick={() => setSelectedUser(null)}
          aria-label="Close chat"
          className="p-1 hover:bg-base-200 rounded"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
