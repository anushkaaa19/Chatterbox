import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { MessageOptionsMenu } from "./MessageOptionsMenu";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";

// Modal for editing message
const EditMessageModal = ({ isOpen, oldText, onClose, onSave }) => {
  const [newText, setNewText] = useState(oldText);

  useEffect(() => {
    setNewText(oldText);
  }, [oldText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl p-6 shadow-2xl w-full max-w-md border border-zinc-200">
        <h2 className="text-xl font-semibold text-zinc-800 mb-4">Edit Message</h2>

        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="w-full p-3 text-sm border border-zinc-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Edit your message..."
        />

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm text-zinc-600 hover:bg-zinc-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(newText)}
            disabled={newText.trim() === ""}
            className={`px-4 py-2 text-sm rounded-md transition font-medium ${
              newText.trim() === ""
                ? "bg-blue-300 text-white cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    subscribeToTypingEvents,
    unsubscribeFromTypingEvents,
    typingUsers,
  } = useChatStore();

  const {
    authUser,
    isCheckingAuth,
    socket,
    setAuthUser,
    setIsCheckingAuth,
    checkAuth,
  } = useAuthStore();

  const messageEndRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingOldText, setEditingOldText] = useState("");

  const [searchTerm, setSearchTerm] = useState(""); // ✅ Search bar state

  useEffect(() => {
    if (isCheckingAuth) {
      checkAuth();
    }
  }, [isCheckingAuth, checkAuth]);

  useEffect(() => {
    if (!selectedUser?._id || !socket) return;

    getMessages(selectedUser._id);
    subscribeToMessages();
    subscribeToTypingEvents();

    return () => {
      unsubscribeFromMessages();
      unsubscribeFromTypingEvents();
    };
  }, [selectedUser?._id, socket]);

  useEffect(() => {
    if (messageEndRef.current && messages.length) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isCheckingAuth) return <div>Loading chat...</div>;
  if (!authUser?._id) return <div>Please log in to use the chat.</div>;

  const isOwnMessage = (senderId) => {
    if (!senderId) return false;
    if (typeof senderId === "string") return senderId === authUser._id;
    if (typeof senderId === "object" && senderId._id)
      return senderId._id === authUser._id;
    return false;
  };

  const handleEdit = (id, oldText) => {
    setEditingMessageId(id);
    setEditingOldText(oldText);
    setIsEditing(true);
  };

  const handleSaveEdit = (newText) => {
    if (newText && newText !== editingOldText) {
      useChatStore.getState().editMessage(editingMessageId, newText);
    }
    setIsEditing(false);
  };

  const handleLike = (id) => {
    useChatStore.getState().toggleLike(id);
  };

  const filteredMessages = messages.filter((msg) =>
    msg.text?.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      {/* ✅ Search Bar */}
      <div className="px-4 pt-4">
        <input
          type="text"
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isMessagesLoading ? (
        <MessageSkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(searchTerm ? filteredMessages : messages).map((message) => {
            const own = isOwnMessage(message.senderId);
            const likes = Array.isArray(message.likes) ? message.likes : [];
            const likedByCurrentUser = likes.includes(authUser._id);

            return (
              <div
                key={message._id}
                className={`chat ${own ? "chat-end" : "chat-start"} group relative`}
              >
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border">
                    <img
                      src={
                        own
                          ? authUser.profilePic || "/avatar.png"
                          : selectedUser?.profilePic || "/avatar.png"
                      }
                      alt="Profile pic"
                    />
                  </div>
                </div>

                <div className="chat-header mb-1">
                  <time className="text-xs opacity-50 ml-1">
                    {formatMessageTime(message.createdAt)}
                  </time>
                </div>

                <div className="chat-bubble flex flex-col relative">
                  {message.text && (
                    <>
                      <p>
                        {message.text}
                        {message.edited && (
                          <span className="text-xs ml-2">(edited)</span>
                        )}
                      </p>

                      {likedByCurrentUser && (
                        <button
                          aria-label="Unlike message"
                          onClick={() => handleLike(message._id)}
                          className="mt-1 text-red-500 self-start"
                        >
                          ❤️
                        </button>
                      )}
                    </>
                  )}

                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attached"
                      className="mt-2 max-w-xs rounded-lg border object-cover"
                    />
                  )}
                  {message.file && (
                    <a
                      href={message.file}
                      download={message.fileName || "file"}
                      className="block mt-2 underline text-blue-600"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📎 {message.fileName || "Download file"}
                    </a>
                  )}
                  {message.audio && (
                    <audio controls src={message.audio} className="mt-2 max-w-xs" />
                  )}

                  <div className="hidden group-hover:block ml-2 absolute top-0 right-0">
                    <MessageOptionsMenu
                      isOwnMessage={own}
                      message={message}
                      onEdit={() => handleEdit(message._id, message.text)}
                      onLike={() => handleLike(message._id)}
                    />
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
