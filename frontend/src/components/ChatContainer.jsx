import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { MessageOptionsMenu } from "./MessageOptionsMenu";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./MessageSkeleton";
import EditMessageModal from "./EditMessageModal";

const ChatContainer = () => {
  const {
    messages,
    selectedUser,
    isMessagesLoading,
    fetchMessages,
    editMessage,
    toggleLike,
  } = useChatStore();

  const { authUser, isCheckingAuth } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingOldText, setEditingOldText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const messageEndRef = useRef(null);

  useEffect(() => {
    if (selectedUser?._id) {
      fetchMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isOwnMessage = (sender) =>
    sender === authUser._id || sender?._id === authUser._id;

  const handleEdit = (id, oldText) => {
    setEditingMessageId(id);
    setEditingOldText(oldText);
    setIsEditing(true);
  };

  const handleSaveEdit = (newText) => {
    if (newText && newText !== editingOldText) {
      editMessage(editingMessageId, newText);
    }
    setIsEditing(false);
  };

  const handleLike = (id) => {
    toggleLike(id);
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const filteredMessages = messages.filter((msg) =>
    msg.content?.text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isCheckingAuth) return <div>Loading chat...</div>;
  if (!authUser?._id) return <div>Please log in to use the chat.</div>;

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-base-100">
      <ChatHeader />

      <div className="px-4 pt-4">
        <input
          type="text"
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full input input-bordered input-sm"
        />
      </div>

      {isMessagesLoading ? (
        <MessageSkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(searchTerm ? filteredMessages : messages).map((message) => {
            const own = isOwnMessage(message.sender);
            const hasContent =
              message.content?.text ||
              message.content?.image ||
              message.content?.file ||
              message.content?.audio;

            if (!hasContent) return null;

            const likedBy = Array.isArray(message.likedBy)
              ? message.likedBy
              : [];
            const likedByCurrentUser = likedBy.includes(authUser._id);

            return (
              <div
                key={message._id}
                className={`chat ${own ? "chat-end" : "chat-start"} group relative`}
              >
                <div className="chat-image avatar">
                  <div className="w-10 rounded-full border">
                    <img
                      src={
                        own
                          ? authUser.profilePic || "/avatar.png"
                          : selectedUser?.profilePic || "/avatar.png"
                      }
                      alt="User"
                    />
                  </div>
                </div>

                <div className="chat-header text-xs mb-1 opacity-70">
                  {formatMessageTime(message.createdAt)}
                </div>

                <div
                  className={`chat-bubble max-w-xs break-words p-3 relative ${
                    own
                      ? "bg-primary text-primary-content"
                      : "bg-base-200 text-base-content"
                  }`}
                >
                  {/* 3-dot menu */}
                  <div className="absolute top-1 right-1 z-10">
                    <div className="invisible group-hover:visible">
                      <MessageOptionsMenu
                        isOwnMessage={own}
                        onEdit={() => handleEdit(message._id, message.content?.text)}
                        onLike={() => handleLike(message._id)}
                      />
                    </div>
                  </div>

                  {/* Text */}
                  {message.content?.text && (
                    <div>
                      <p className="whitespace-pre-line">{message.content.text}</p>
                      {message.edited && (
                        <span className="text-xs italic ml-1">(edited)</span>
                      )}
                    </div>
                  )}

                  {/* Image */}
                  {message.content?.image && (
                    <img
                      src={message.content.image}
                      alt="sent"
                      className="max-w-full rounded border mt-1"
                    />
                  )}

                  {/* File */}
                  {message.content?.file && (
                    <a
                      href={message.content.file}
                      download={message.fileName || "file"}
                      className="block underline text-blue-400 mt-1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📎 {message.fileName || "Download file"}
                    </a>
                  )}

                  {/* Audio */}
                  {message.content?.audio && (
                    <audio controls src={message.content.audio} className="w-full mt-2" />
                  )}

                  {/* Likes */}
                  <div className="flex justify-between items-center text-xs mt-2">
                    {likedBy.length > 0 && (
                      <button
                        onClick={() => handleLike(message._id)}
                        className={`transition-transform hover:scale-110 ${
                          likedByCurrentUser ? "text-red-500" : "text-gray-500"
                        }`}
                      >
                        ❤️ {likedBy.length}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {searchTerm && filteredMessages.length === 0 && (
            <p className="text-center text-zinc-500 py-8">No messages found.</p>
          )}

          <div ref={messageEndRef} />
        </div>
      )}

      <MessageInput />

      <EditMessageModal
        isOpen={isEditing}
        oldText={editingOldText}
        onClose={() => setIsEditing(false)}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default ChatContainer;
