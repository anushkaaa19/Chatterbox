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
  useEffect(() => setNewText(oldText), [oldText]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-base-100 rounded-xl p-6 shadow-2xl w-full max-w-md border border-base-300">
        <h2 className="text-xl font-semibold mb-4">Edit Message</h2>
        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="w-full p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          rows={4}
          placeholder="Edit your message..."
        />
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button
            onClick={() => onSave(newText)}
            disabled={!newText.trim()}
            className="btn btn-primary"
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
    if (messageEndRef.current && messages.length) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isCheckingAuth) return <div>Loading chat...</div>;
  if (!authUser?._id) return <div>Please log in to use the chat.</div>;

  const isOwnMessage = (senderId) =>
    senderId === authUser._id || senderId?._id === authUser._id;

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

  const handleLike = (id) => useChatStore.getState().toggleLike(id);

  const filteredMessages = messages.filter((msg) =>
    msg.text?.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 h-full bg-base-100">
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(searchTerm ? filteredMessages : messages).map((msg) => {
            const isOwn = isOwnMessage(msg.senderId);
            const likedByMe = msg.likes?.includes(authUser._id);

            return (
              <div
                key={msg._id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}
              >
                <div className={`flex items-start ${isOwn ? "flex-row-reverse" : ""} gap-2 max-w-[85%]`}>
                  <div className="avatar mt-1">
                    <div className="w-8 rounded-full">
                      <img
                        src={
                          isOwn
                            ? authUser.profilePic || "/avatar.png"
                            : selectedUser?.profilePic || "/avatar.png"
                        }
                        alt="avatar"
                      />
                    </div>
                  </div>

                  <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-3 py-2 rounded-lg relative ${
                        isOwn
                          ? "bg-primary text-primary-content"
                          : "bg-base-200 text-base-content"
                      }`}
                    >
                      {msg.text && (
                        <p>
                          {msg.text}
                          {msg.edited && (
                            <span className="text-xs ml-2">(edited)</span>
                          )}
                        </p>
                      )}

                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="Attachment"
                          className="mt-2 max-w-xs rounded-md border object-cover"
                        />
                      )}

                      {msg.file && (
                        <a
                          href={msg.file}
                          download={msg.fileName || "file"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mt-2 underline text-blue-600"
                        >
                          📎 {msg.fileName || "Download file"}
                        </a>
                      )}

                      {msg.audio && (
                        <audio controls src={msg.audio} className="mt-2 w-full max-w-xs" />
                      )}

                      <div className="absolute top-0 right-0 mt-1 mr-1 hidden group-hover:block">
                        <MessageOptionsMenu
                          isOwnMessage={isOwn}
                          message={msg}
                          onEdit={() => handleEdit(msg._id, msg.text)}
                          onLike={() => handleLike(msg._id)}
                        />
                      </div>
                    </div>
                    <div className="text-[10px] text-base-content opacity-50 mt-1">
                      {formatMessageTime(msg.createdAt)}
                    </div>
                    {likedByMe && (
                      <span className="text-red-500 text-sm mt-1">❤️</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {searchTerm && filteredMessages.length === 0 && (
            <p className="text-center text-base-content opacity-50 py-8">
              No messages found.
            </p>
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
