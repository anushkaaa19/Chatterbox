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
  } = useGroupStore();

  const socket = useAuthStore((state) => state.socket);
  const currentUser = useAuthStore((state) => state.authUser);
  const [loading, setLoading] = useState(false);

  // Fetch group messages on group change
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

  // Subscribe to real-time messages for current group
  useEffect(() => {
    if (!selectedGroup?._id) return;

    subscribeToGroupMessages(selectedGroup._id);

    return () => {
      unsubscribeFromGroupMessages();
    };
  }, [selectedGroup?._id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages]);

  const isOwnMessage = (senderId) => {
    return senderId?.toString() === currentUser?._id?.toString();
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
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
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
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex items-end ${
                    isOwn ? "flex-row-reverse" : ""
                  } gap-3 max-w-[85%]`}
                >
                  {/* Avatar */}
                  <div className="avatar">
                    <div className="w-8 rounded-full">
                      <img
                        src={
                          isOwn
                            ? currentUser?.profilePic || "/avatar.png"
                            : msg.sender?.profilePic || "/avatar.png"
                        }
                        alt="avatar"
                      />
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className={`chat ${isOwn ? "chat-end" : "chat-start"}`}>
                    {!isOwn && (
                      <div className="text-xs text-base-content opacity-60">
                        {msg.sender?.fullName}
                      </div>
                    )}
                    <div
                      className={`chat-bubble ${
                        isOwn
                          ? "chat-bubble-primary"
                          : "bg-base-200 text-base-content"
                      }`}
                    >
                      {msg.content?.text && <p>{msg.content.text}</p>}

                      {msg.content?.image && (
                        <img
                          src={msg.content.image}
                          alt="sent"
                          className="mt-2 rounded-md max-w-xs max-h-48 object-cover"
                        />
                      )}

                      {msg.content?.audio && (
                        <audio controls className="mt-2 w-full max-w-xs">
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

      <GroupMessageInput />
    </div>
  );
};

export default GroupChatContainer;
