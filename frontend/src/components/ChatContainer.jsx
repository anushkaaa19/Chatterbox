import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import {MessageOptionsMenu} from "./MessageOptionsMenu";
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
      useChatStore.getState().editMessage(editingMessageId, newText);
    }
    setIsEditing(false);
  };

  const handleLike = (id) => {
    useChatStore.getState().toggleLike(id);
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
            const own = isOwnMessage(message.senderId);
            const hasContent =
              message.content?.text ||
              message.content?.image ||
              message.content?.file ||
              message.content?.audio;

            if (!hasContent) return null;

            const likes = Array.isArray(message.likes) ? message.likes : [];
            const likedByCurrentUser = likes.includes(authUser._id);

            return (
              <div
                key={message._id}
                className={`chat ${own ? "chat-end" : "chat-start"} group`}
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

                <div className="chat-bubble relative space-y-2">
                  {/* TEXT */}
                  {message.content?.text && (
                    <>
                      <p>
                        {message.content.text}
                        {message.edited && (
                          <span className="text-xs ml-2">(edited)</span>
                        )}
                      </p>
                      {likedByCurrentUser && (
                        <button
                          onClick={() => handleLike(message._id)}
                          className="text-red-500 text-sm"
                          aria-label="Unlike message"
                        >
                          ❤
                        </button>
                      )}
                    </>
                  )}

                  {/* IMAGE */}
                  {message.content?.image && (
                    <img
                      src={message.content.image}
                      alt="Sent"
                      className="max-w-xs rounded-lg border object-cover"
                    />
                  )}

                  {/* FILE */}
                  {message.content?.file && (
                    <a
                      href={message.content.file}
                      download={message.fileName || "file"}
                      className="block underline text-blue-600"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📎 {message.fileName || "Download file"}
                    </a>
                  )}

                  {/* AUDIO */}
                  {message.content?.audio && (
                    <audio controls src={message.content.audio} className="max-w-xs" />
                  )}

                  {/* MENU */}
                  <div className={`hidden group-hover:block absolute ${own ? 'top-0 left-0' : 'top-0 right-0'} z-10`}>
                    <MessageOptionsMenu
                      isOwnMessage={own}
                      onEdit={() => handleEdit(message._id, message.content?.text)}
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
