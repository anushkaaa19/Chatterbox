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

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedGroup) return;
      setLoading(true);
      try {
        const messages = await getGroupMessages(selectedGroup._id);
        setGroupMessages(Array.isArray(messages) ? messages : []);
      } catch (error) {
        console.error("Failed to fetch group messages:", error);
        setGroupMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedGroup, getGroupMessages, setGroupMessages]);

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

  const isOwnMessage = (senderId) => {
    return senderId?.toString() === currentUser?._id?.toString();
  };

  const handleSendMessage = async (messageData) => {
    if (!selectedGroup?._id) return;
    try {
      await sendGroupMessage(selectedGroup._id, messageData);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (!selectedGroup) {
    return (
      <div className="flex-1 flex items-center justify-center text-base-content opacity-50">
        Select a group to start chatting.
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-base-content opacity-50">
        Please login to view messages.
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full bg-base-100">
      <GroupChatHeader group={selectedGroup} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {loading ? (
          <div className="text-center text-base-content opacity-50">
            <span className="loading loading-spinner loading-md" />
            Loading messages...
          </div>
        ) : Array.isArray(groupMessages) && groupMessages.length > 0 ? (
          groupMessages.map((msg) => {
            const isOwn = isOwnMessage(msg.sender?._id);
            return (
              <div
                key={msg._id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}
              >
                <div
                  className={`flex items-start ${
                    isOwn ? "flex-row-reverse" : ""
                  } gap-2 max-w-[85%]`}
                >
                  {/* Avatar */}
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

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                    {!isOwn && (
                      <div className="text-xs text-base-content opacity-60 mb-1">
                        {msg.sender?.fullName}
                      </div>
                    )}
                    <div
                      className={`px-3 py-2 rounded-lg ${
                        isOwn
                          ? "bg-primary text-primary-content"
                          : "bg-base-200 text-base-content"
                      }`}
                    >
                      {msg.content?.text && <p>{msg.content.text}</p>}

                      {msg.content?.image && (
                        <img
                          src={msg.content.image}
                          alt="sent"
                          className="mt-1 rounded-md max-w-xs max-h-48 object-cover"
                        />
                      )}

                      {msg.content?.audio && (
                        <audio controls className="mt-1 w-full max-w-xs">
                          <source src={msg.content.audio} />
                        </audio>
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
            No messages yet.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <GroupMessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default GroupChatContainer;