import { useEffect, useRef, useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import GroupMessageInput from "./GroupMessageInput";
import GroupChatHeader from "./GroupChatHeader";

const GroupChatContainer = () => {
  const bottomRef = useRef(null);
  const {
    selectedGroup,
    groupMessages,
    getGroupMessages,
    setGroupMessages,
  } = useGroupStore();

  const socket = useAuthStore((state) => state.socket);
  const currentUser = useAuthStore((state) => state.authUser); // Changed to authUser
  const [loading, setLoading] = useState(false);

  // Debug logs
  useEffect(() => {
    console.log("--- DEBUG INFO ---");
    console.log("Current User ID:", currentUser?._id);
    console.log("Group Messages:", groupMessages.map(msg => ({
      id: msg._id,
      senderId: msg.sender?._id,
      isOwn: msg.sender?._id?.toString() === currentUser?._id?.toString(),
      content: msg.content?.text || "[media]"
    })));
  }, [groupMessages, currentUser]);

  // Load messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedGroup) return;
      setLoading(true);
      try {
        const messages = await getGroupMessages(selectedGroup._id);
        setGroupMessages(messages);
      } catch (error) {
        console.error("Failed to fetch group messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedGroup, getGroupMessages, setGroupMessages]);

  // Listen to incoming messages
  useEffect(() => {
    if (!socket || !selectedGroup) return;

    const handleNewGroupMessage = ({ groupId, message }) => {
      if (groupId === selectedGroup._id) {
        console.log("New message received:", message);
        setGroupMessages((prev) => [...prev, message]);
      }
    };

    socket.on("receiveGroupMessage", handleNewGroupMessage);
    return () => socket.off("receiveGroupMessage", handleNewGroupMessage);
  }, [socket, selectedGroup, setGroupMessages]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages]);

  const isOwnMessage = (senderId) => {
    if (!senderId || !currentUser?._id) return false;
    return senderId.toString() === currentUser._id.toString();
  };

  if (!selectedGroup) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        Select a group to start chatting.
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        Please login to view messages.
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full">
      <GroupChatHeader group={selectedGroup} />

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <p className="text-center text-zinc-500">Loading messages...</p>
        ) : groupMessages.length > 0 ? (
          groupMessages.map((msg) => {
            const isOwn = isOwnMessage(msg.sender?._id);
            
            return (
              <div
                key={msg._id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex ${isOwn ? "flex-row-reverse" : ""} max-w-[80%] gap-2`}>
                  {/* Avatar */}
                  {!isOwn && (
                    <div className="flex-shrink-0">
                      <img
                        src={msg.sender?.profilePic || "/avatar.png"}
                        alt="avatar"
                        className="w-8 h-8 rounded-full"
                      />
                    </div>
                  )}

                  {/* Message Content */}
                  <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                    {!isOwn && (
                      <span className="text-xs text-zinc-400 mb-1">
                        {msg.sender?.fullName || "User"}
                      </span>
                    )}

                    <div
                      className={`p-3 rounded-lg ${
                        isOwn
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none"
                      }`}
                    >
                      {msg.content?.text && <p>{msg.content.text}</p>}
                      {msg.content?.image && (
                        <img
                          src={msg.content.image}
                          alt="sent"
                          className="mt-2 rounded-md max-w-[200px] max-h-[200px] object-cover"
                        />
                      )}
                      {msg.content?.audio && (
                        <audio controls className="mt-2 w-full max-w-[250px]">
                          <source src={msg.content.audio} />
                        </audio>
                      )}
                    </div>

                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Your avatar on the right */}
                  {isOwn && (
                    <div className="flex-shrink-0">
                      <img
                        src={currentUser.profilePic || "/avatar.png"}
                        alt="your avatar"
                        className="w-8 h-8 rounded-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-zinc-500">No messages yet.</p>
        )}
        <div ref={bottomRef} />
      </div>

      <GroupMessageInput />
    </div>
  );
};

export default GroupChatContainer;