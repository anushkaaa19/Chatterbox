import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import MessageInput from "./MessageInput";
import ChatHeader from "./ChatHeader";

const ChatContainer = () => {
  const bottomRef = useRef(null);

  const {
    selectedUser,
    messages,
    getMessages,
    setMessages,
    sendMessage,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const currentUser = useAuthStore((state) => state.authUser);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;
      setLoading(true);
      try {
        const res = await getMessages(selectedUser._id);
        setMessages(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedUser, getMessages, setMessages]);

  useEffect(() => {
    if (!selectedUser?._id) return;

    subscribeToMessages(selectedUser._id);
    return () => unsubscribeFromMessages();
  }, [selectedUser?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isOwnMessage = (senderId) =>
    senderId?.toString() === currentUser?._id?.toString();

  const handleSendMessage = async (messageData) => {
    if (!selectedUser?._id) return;
    try {
      await sendMessage(selectedUser._id, messageData);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const filteredMessages = messages.filter((msg) =>
    msg.content?.text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-base-content opacity-50">
        Select a user to start chatting.
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
      <ChatHeader user={selectedUser} />

      {/* 🔍 Search Bar */}
      <div className="px-4 py-2 bg-base-200 border-b border-base-300">
        <input
          type="text"
          placeholder="Search messages..."
          className="input input-bordered w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 💬 Messages */}
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
                  className={`flex items-start ${
                    isOwn ? "flex-row-reverse" : ""
                  } gap-2 max-w-[85%]`}
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
                  <div
                    className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                  >
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
            No messages found.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ✍️ Input */}
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatContainer;
