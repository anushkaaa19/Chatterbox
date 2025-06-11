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
            const isOwn = msg.sender?._id?.toString() === currentUser?._id?.toString();

            return (
              <div
                key={msg._id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"} gap-2`}
              >
                {!isOwn && (
                  <div className="flex flex-col items-center">
                    <img
                      src={msg.sender?.profilePic || "/avatar.png"}
                      alt="avatar"
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-xs text-zinc-400 mt-1">
                      {msg.sender?.fullName?.split(" ")[0] || "User"}
                    </span>
                  </div>
                )}

                <div className="flex flex-col max-w-xs">
                  <div
                    className={`p-3 rounded-xl shadow break-words ${
                      isOwn
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-zinc-800 text-zinc-300 rounded-bl-none"
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

                  <p className={`text-[10px] text-zinc-400 mt-1 ${isOwn ? "text-right" : "text-left"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {isOwn && (
                  <div className="flex flex-col items-center">
                    <img
                      src={currentUser?.profilePic || "/avatar.png"}
                      alt="your avatar"
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-xs text-zinc-400 mt-1">You</span>
                  </div>
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