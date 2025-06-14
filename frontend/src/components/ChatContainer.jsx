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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur">
      <div className="bg-base-100 p-6 rounded-xl shadow-lg w-full max-w-md">
        <h3 className="text-lg font-bold mb-2">Edit Message</h3>
        <textarea
          className="textarea textarea-bordered w-full h-24"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <div className="flex justify-end mt-4 gap-2">
          <button className="btn btn-sm btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onSave(newText)}
            disabled={!newText.trim()}
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
    addMessage,
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
  }, [isCheckingAuth]);

  // Fetch messages when user changes
  useEffect(() => {
    if (!selectedUser?._id) return;
    getMessages(selectedUser._id);
    subscribeToTypingEvents();

    return () => {
      unsubscribeFromTypingEvents();
    };
  }, [selectedUser?._id]);

  // Setup socket listener for real-time messages
  useEffect(() => {
    if (!socket || !selectedUser?._id || !authUser?._id) return;
    
    const messageHandler = (data) => {
      const { message } = data;
      if (!message) return;
      
      // Check if message belongs to current conversation
      const senderId = message.sender?._id || message.sender;
      const receiverId = message.receiver?._id || message.receiver;
      
      const isRelevantMessage = 
        (senderId === authUser._id && receiverId === selectedUser._id) ||
        (receiverId === authUser._id && senderId === selectedUser._id);
      
      if (isRelevantMessage) {
        addMessage(message);
      }
    };

    // Setup listener
    socket.on("newMessage", messageHandler);

    // Cleanup on unmount or conversation change
    return () => {
      socket.off("newMessage", messageHandler);
    };
  }, [socket, selectedUser?._id, authUser?._id]);

  // Scroll to bottom when messages change
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

  const handleLike = (id) => toggleLike(id);

  const filteredMessages = messages.filter((msg) =>
    msg.content?.text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isCheckingAuth) return <div className="p-4">Loading chat...</div>;
  if (!authUser?._id) return <div className="p-4">Please log in to use the chat.</div>;

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
                      alt="User"
                    />
                  </div>
                </div>

                <div className="chat-header text-xs mb-1 opacity-70">
                  {formatMessageTime(message.createdAt)}
                  {message.edited && (
                    <span className="text-xs italic ml-1">(edited)</span>
                  )}
                </div>

                <div
                  className={`chat-bubble max-w-xs break-words p-3 relative ${
                    own
                      ? "bg-primary text-primary-content"
                      : "bg-base-200 text-base-content"
                  }`}
                >
                  {/* 3-dot menu */}
                  <div className="absolute top-1 right-1 z-10 hidden group-hover:block">
                    <div className="bg-base-200 rounded-md shadow-lg">
                      <MessageOptionsMenu
                        isOwnMessage={own}
                        onEdit={() => handleEdit(message._id, message.content?.text)}
                        onLike={() => handleLike(message._id)}
                      />
                    </div>
                  </div>

                  {/* Text */}
                  {message.content?.text && (
                    <p className="whitespace-pre-line">{message.content.text}</p>
                  )}

                  {/* Image */}
                  {message.content?.image && (
                    <div className="mt-2">
                      <img
                        src={message.content.image}
                        alt="sent"
                        className="max-w-full max-h-64 rounded-lg border object-contain"
                      />
                    </div>
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
                    <div className="mt-2">
                      <audio
                        controls
                        className="w-full"
                      >
                        <source src={message.content.audio} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  {/* Likes */}
                  {likedBy.length > 0 && (
                    <div className="flex justify-end mt-1">
                      <button
                        onClick={() => handleLike(message._id)}
                        className={`flex items-center gap-1 transition-transform hover:scale-110 ${
                          likedByCurrentUser ? "text-red-500" : "text-gray-500"
                        }`}
                      >
                        <span className="text-xs">❤️ {likedBy.length}</span>
                      </button>
                    </div>
                  )}
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