import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { MessageOptionsMenu } from "./MessageOptionsMenu";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";

// Edit Message Modal
const EditMessageModal = ({ isOpen, oldText, onClose, onSave }) => {
  const [newText, setNewText] = useState(oldText);

  useEffect(() => {
    setNewText(oldText);
  }, [oldText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-base-100 rounded-xl p-6 shadow-2xl w-full max-w-md border border-base-300">
        <h2 className="text-xl font-semibold mb-4">Edit Message</h2>
        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="w-full p-3 text-sm border border-base-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          rows={4}
          placeholder="Edit your message..."
        />
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            Cancel
          </button>
          <button
            onClick={() => onSave(newText)}
            disabled={newText.trim() === ""}
            className="btn btn-primary btn-sm"
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
    editMessage,
    toggleLike,
  } = useChatStore();

  const { authUser, isCheckingAuth, socket, checkAuth } = useAuthStore();

  const messageEndRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingOldText, setEditingOldText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isCheckingAuth) checkAuth();
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
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isCheckingAuth) return <div>Loading chat...</div>;
  if (!authUser?._id) return <div>Please log in to use the chat.</div>;

  const isOwnMessage = (sender) =>
    (typeof sender === "string" && sender === authUser._id) ||
    (sender?._id === authUser._id);

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

  const filteredMessages = messages.filter((msg) =>
    msg.content?.text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

            const likedBy = Array.isArray(message.likedBy) ? message.likedBy : [];
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
                      alt="Profile"
                    />
                  </div>
                </div>

                <div className="chat-header text-xs mb-1 opacity-70">
                  {formatMessageTime(message.createdAt)}
                </div>

                <div
                  className={`chat-bubble max-w-xs break-words space-y-2 p-3 ${
                    own
                      ? "bg-primary text-primary-content"
                      : "bg-base-200 text-base-content"
                  }`}
                >
                  {/* TEXT */}
                  {message.content?.text && (
                    <div>
                      <p className="whitespace-pre-line">{message.content.text}</p>
                      {message.edited && (
                        <span className="text-xs italic ml-1">(edited)</span>
                      )}
                    </div>
                  )}

                  {/* IMAGE */}
                  {message.content?.image && (
                    <img
                      src={message.content.image}
                      alt="Sent"
                      className="max-w-full rounded-lg border object-cover"
                    />
                  )}

                  {/* FILE */}
                  {message.content?.file && (
                    <a
                      href={message.content.file}
                      download={message.fileName || "file"}
                      className="block underline text-blue-400"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📎 {message.fileName || "Download file"}
                    </a>
                  )}

                  {/* AUDIO */}
                  {message.content?.audio && (
                    <audio controls src={message.content.audio} className="w-full" />
                  )}

                  {/* LIKE + MENU */}
                  <div className="flex justify-between items-center text-xs mt-2">
                    {/* Like (only if liked) */}
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

                    {/* 3-Dot Menu (hover) */}
                    <div
                      className={`absolute top-0 z-10 ${
                        own ? "left-[-1.5rem]" : "right-[-1.5rem]"
                      } hidden group-hover:block`}
                    >
                      <MessageOptionsMenu
                        isOwnMessage={own}
                        onEdit={() => handleEdit(message._id, message.content?.text)}
                        onLike={() => handleLike(message._id)}
                      />
                    </div>
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
