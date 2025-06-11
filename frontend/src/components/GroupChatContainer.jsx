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
  const currentUser = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(false);

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

  if (!selectedGroup) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        Select a group to start chatting.
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <GroupChatHeader group={selectedGroup} />

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <p className="text-center text-zinc-500">Loading messages...</p>
        ) : groupMessages.length > 0 ? (
          groupMessages.map((msg) => {
            const isOwn = msg.sender?._id === currentUser?._id;

            return (
              <div
                key={msg._id}
                className={`flex items-end ${isOwn ? "justify-end" : "justify-start"}`}
              >
                {/* Avatar left (others) */}
                {!isOwn && (
                  <img
                    src={msg.sender?.profilePic || "/default-avatar.png"}
                    alt="avatar"
                    className="w-8 h-8 rounded-full mr-2"
                  />
                )}

                {/* Message bubble */}
                <div
                  className={`p-3 rounded-lg shadow max-w-sm ${
                    isOwn ? "bg-blue-600 text-white ml-2" : "bg-zinc-800 text-zinc-300 mr-2"
                  }`}
                >
                  {!isOwn && (
                    <div className="mb-1 text-sm font-medium">
                      {msg.sender?.fullName || "Unknown"}
                    </div>
                  )}
                  <div className="text-sm break-words">
                    {msg.content?.text && <p>{msg.content.text}</p>}
                    {msg.content?.image && (
                      <img
                        src={msg.content.image}
                        alt="sent"
                        className="mt-2 rounded-md max-w-full"
                      />
                    )}
                    {msg.content?.audio && (
                      <audio controls className="mt-2">
                        <source src={msg.content.audio} />
                      </audio>
                    )}
                  </div>
                </div>

                {/* Avatar right (own message) */}
                {isOwn && (
                  <img
                    src={currentUser?.profilePic || "/default-avatar.png"}
                    alt="your avatar"
                    className="w-8 h-8 rounded-full ml-2"
                  />
                )}
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
