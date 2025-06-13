import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { MessageOptionsMenu } from "./MessageOptionsMenu";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";

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

  const isOwnMessage = (senderId) =>
    (typeof senderId === "string" && senderId === authUser._id) ||
    (senderId?._id === authUser._id);

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
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {(searchTerm ? filteredMessages : messages).map((message) => {
            const own = isOwnMessage(message.senderId);
            const likes = Array.isArray(message.likes) ? message.likes : [];
            const likedByCurrentUser = likes.includes(authUser._id);

            // Skip empty messages
            const hasContent =
              message.content?.text ||
              message.content?.image ||
              message.content?.file ||
              message.content?.audio;
            if (!hasContent) return null;

            return (
              <div
                key={message._id}
                className={`flex ${own ? "justify-end" : "justify-start"} mb-2`}
              >
                <div
                  className={`flex items-start ${
                    own ? "flex-row-reverse" : ""
                  } gap-2 max-w-[85%]`}
                >
                  {/* Avatar */}
                  <div className="avatar mt-1">
                    <div className="w-8 rounded-full">
                      <img
                        src={
                          own
                            ? authUser.profilePic || "/avatar.png"
                            : selectedUser?.profilePic || "/avatar.png"
                        }
                        alt="avatar"
                      />
                    </div>
                  </div>

                  {/* Message content */}
                  <div
                    className={`flex flex-col ${own ? "items-end" : "items-start"}`}
                  >
                    {/* Timestamp */}
                    <div className="text-xs text-base-content opacity-60 mb-1">
                      {formatMessageTime(message.createdAt)}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`px-3 py-2 rounded-lg ${
                        own
                          ? "bg-primary text-primary-content"
                          : "bg-base-200 text-base-content"
                      }`}
                    >
                      {message.content?.text && (
                        <>
                          <p>{message.content.text}</p>
                          {message.edited && (
                            <span className="text-xs ml-2">(edited)</span>
                          )}
                        </>
                      )}
                      {message.content?.image && (
                        <img
                          src={message.content.image}
                          alt="sent"
                          className="mt-1 rounded-md max-w-xs max-h-48 object-cover"
                        />
                      )}
                      {message.content?.file && (
                        <a
                          href={message.content.file}
                          download={message.fileName || "file"}
                          className="block mt-2 underline text-blue-600"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          📎 {message.fileName || "Download file"}
                        </a>
                      )}
                      {message.content?.audio && (
                        <audio controls className="mt-1 w-full max-w-xs">
                          <source src={message.content.audio} />
                        </audio>
                      )}
                    </div>

                    {/* Like / Menu */}
                    <div className="text-[10px] text-base-content opacity-50 mt-1 flex gap-2">
                      {likedByCurrentUser && (
                        <button
                          aria-label="Unlike message"
                          onClick={() => handleLike(message._id)}
                          className="text-red-500"
                        >
                          ❤
                        </button>
                      )}
                      <MessageOptionsMenu
                        isOwnMessage={own}
                        message={message}
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
