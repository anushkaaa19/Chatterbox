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
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
    sendGroupMessage,
  } = useGroupStore();

  const socket = useAuthStore((state) => state.socket);
  const currentUser = useAuthStore((state) => state.authUser);

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedGroup?._id) return;
      setLoading(true);
      try {
        const messages = await getGroupMessages(selectedGroup._id);
        setGroupMessages(messages);
      } catch (error) {
        console.error("Failed to fetch group messages:", error);
        setGroupMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedGroup?._id]);

  useEffect(() => {
    if (!selectedGroup?._id) return;

    subscribeToGroupMessages(selectedGroup._id);
    return () => {
      unsubscribeFromGroupMessages();
    };
  }, [selectedGroup?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages]);

  const isOwnMessage = (senderId) =>
    senderId?.toString() === currentUser?._id?.toString();

  const handleSendMessage = async (messageData) => {
    if (!selectedGroup?._id) return;
    try {
      const newMessage = await sendGroupMessage(selectedGroup._id, messageData);
      if (newMessage && !groupMessages.some((msg) => msg._id === newMessage._id)) {
        setGroupMessages([...groupMessages, newMessage]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const filteredMessages = groupMessages.filter((msg) =>
    msg?.content?.text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-base-content opacity-50">
        Please login to view messages.
      </div>
    );
  }

  if (!selectedGroup) {
    return (
      <div className="flex-1 flex items-center justify-center text-base-content opacity-50">
        Select a group to start chatting.
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full bg-base-100">
      <GroupChatHeader group={selectedGroup} />

      {/* Search Bar */}
      <div className="px-4 py-2 bg-base-200 border-b border-base-300">
        <input
          type="text"
          placeholder="Search messages..."
          className="input input-bordered w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {loading ? (
          <div className="text-center text-base-content opacity-50">
            <span className="loading loading-spinner loading-md" />
            Loading messages...
          </div>
        ) : filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => {
            const isOwn = isOwnMessage(msg.sender?._id);
            return (
              <div
                key={msg._id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}
              >
                <div
                  className={`flex items-start ${isOwn ? "flex-row-reverse" : ""} gap-2 max-w-[85%]`}
                >
                  {!isOwn && (
                    <div className="avatar mt-1">
                      <div className="w-8 rounded-full">
                        <img
                          src={msg.sender?.profilePic || "/avatar.png"}
                          alt="avatar"
                        />
                      </div>
                    </div>
                  )}
                  <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                    {!isOwn && (
                      <div className="text-xs text-base-content opacity-60 mb-1">
                        {msg.sender?.fullName}
                      </div>
                    )}
                    <div
  className={`px-3 py-2 rounded-lg max-w-xs break-words ${
    isOwn
      ? "bg-primary text-primary-content"
      : "bg-base-200 text-base-content"
  }`}
>
  {/* Render text if available */}
  {msg.content?.text && msg.content.text.trim() !== "" && (
    <p>{msg.content.text}</p>
  )}

  {/* Render image if available */}
  {msg.content?.image && msg.content.image.trim() !== "" && (
    <img
      src={msg.content.image}
      alt="sent"
      className="mt-1 rounded-md max-w-xs max-h-48 object-cover"
    />
  )}

  {/* Render audio if available */}
  {msg.content?.audio && msg.content.audio.trim() !== "" && (
    <audio controls className="mt-1 w-full max-w-xs">
      <source
        src={msg.content.audio}
        type={`audio/${msg.content.audio.split(".").pop() || "webm"}`}
      />
      Your browser does not support the audio element.
    </audio>
  )}

  {/* Fallback: If no valid content */}
  {!msg.content?.text?.trim() &&
    !msg.content?.image?.trim() &&
    !msg.content?.audio?.trim() && (
      <p className="italic opacity-50">Empty message</p>
    )}
</div>


                    <div className="text-[10px] text-base-content opacity-50 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-base-content opacity-50">
            No messages found.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <GroupMessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default GroupChatContainer;
