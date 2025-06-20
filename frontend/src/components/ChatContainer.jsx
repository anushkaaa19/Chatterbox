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
        <h2 className="text-xl font-semibold text-base-content mb-4">Edit Message</h2>

        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="textarea textarea-bordered w-full"
          rows={4}
          placeholder="Edit your message..."
        />

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
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
    typingUsers,
    editMessage,
    toggleLike,
    updateMessage,
  } = useChatStore();

  const {
    authUser,
    isCheckingAuth,
    socket,
    checkAuth,
  } = useAuthStore();

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
    if (!socket) return;

    const handleEdit = ({ message }) => updateMessage(message);
    const handleLike = ({ message }) => {
      console.log("🔥 messageLiked received:", message);
      useChatStore.getState().updateMessage(message);
    };
    
    
    socket.on("messageEdited", handleEdit);
    socket.on("messageLiked", handleLike);

    return () => {
      socket.off("messageEdited", handleEdit);
      socket.off("messageLiked", handleLike);
    };
  }, [socket]);

  useEffect(() => {
    if (messageEndRef.current && messages.length) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isCheckingAuth) return <div>Loading chat...</div>;
  if (!authUser?._id) return <div>Please log in to use the chat.</div>;

  const isOwnMessage = (senderId) =>
    typeof senderId === "string"
      ? senderId === authUser._id
      : senderId?._id === authUser._id;

  const handleEdit = (id, oldText) => {
    setEditingMessageId(id);
    setEditingOldText(oldText || "");
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
    msg.text?.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="px-4 pt-4">
        <input
          type="text"
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>

      {isMessagesLoading ? (
        <MessageSkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {(searchTerm ? filteredMessages : messages).map((message) => {
            const own = isOwnMessage(message.senderId);
            const likes = Array.isArray(message.likes) ? message.likes : [];
            const likedByCurrentUser = likes.includes(authUser._id);

            return (
              <div
                key={message._id}
                className={`chat ${own ? "chat-end" : "chat-start"} group`}
              >
                <div className="chat-image avatar">
                  <div className="w-10 rounded-full border border-base-300">
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

                <div className="chat-header text-xs text-base-content opacity-60 mb-1">
                  <time>{formatMessageTime(message.createdAt)}</time>
                </div>

                <div
                  className={`group flex flex-col relative p-3 rounded-2xl shadow max-w-xs md:max-w-sm ${
                    own
                      ? "bg-primary text-primary-content"
                      : "bg-base-200 text-base-content"
                  }`}
                >
                  {message.text && (
                    <p className="break-words">
                      {message.text}
                      {message.edited && (
                        <span className="text-xs ml-2 opacity-70">(edited)</span>
                      )}
                    </p>
                  )}

                  {message.image && (
                    <>
                      <img
                        src={message.image}
                        alt="Attached"
                        className="mt-2 rounded-lg border object-cover max-w-xs"
                      />
                      {own && (
                        <button
                          onClick={() => handleEdit(message._id, message.text)}
                          className="text-xs text-blue-200 hover:underline mt-1 self-end"
                        >
                          Edit caption
                        </button>
                      )}
                    </>
                  )}

                  {message.audio && (
                    <>
                      <audio controls src={message.audio} className="mt-2 max-w-xs" />
                      {own && (
                        <button
                          onClick={() => handleEdit(message._id, message.text)}
                          className="text-xs text-blue-200 hover:underline mt-1 self-end"
                        >
                          Edit transcript
                        </button>
                      )}
                    </>
                  )}

                  {message.file && (
                    <>
                      <a
                        href={message.file}
                        download={message.fileName || "file"}
                        className="block mt-2 underline text-blue-200"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📎 {message.fileName || "Download file"}
                      </a>
                      {own && (
                        <button
                          onClick={() => handleEdit(message._id, message.text)}
                          className="text-xs text-blue-200 hover:underline mt-1 self-end"
                        >
                          Edit note
                        </button>
                      )}
                    </>
                  )}

{likes.length > 0 && (
  <div
    className="text-xs text-red-400 mt-1 tooltip"
    data-tip={
      likes
        .map((user) => {
          if (typeof user === "string") return "Unknown";
          return user._id === authUser._id ? "You" : user.name;
        })
        .join(", ")
    }
  >
    ❤️ {likes.length}
  </div>
)}



                  <div className="hidden group-hover:block absolute top-0 right-0">
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
