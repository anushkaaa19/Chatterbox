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

const MediaRenderer = ({ content }) => {
  if (!content) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Image */}
      {content.image && (
        <div className="relative">
          <img
            src={content.image}
            alt="Sent media"
            className="max-w-full max-h-64 rounded-lg border object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.parentNode.innerHTML = '<div class="bg-gray-200 border-2 border-dashed rounded-xl w-full h-32 flex items-center justify-center text-gray-500">Image failed to load</div>';
            }}
          />
        </div>
      )}

      {/* Audio */}
      {content.audio && (
        <div className="bg-base-300 rounded-lg p-2">
          <audio controls className="w-full">
            <source src={content.audio} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {/* File */}
      {content.file && (
        <a
          href={content.file}
          download={content.fileName || "file"}
          className="flex items-center gap-2 p-2 bg-base-300 rounded-lg hover:bg-base-200 transition"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="text-2xl">📎</span>
          <span className="truncate flex-1">
            {content.fileName || "Download file"}
          </span>
          <span className="text-xs opacity-75">Click to download</span>
        </a>
      )}
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
  const messagesContainerRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingOldText, setEditingOldText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Check scroll position
  const checkScrollPosition = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  };

  // Scroll to bottom if user was already there
  useEffect(() => {
    if (isAtBottom && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  // Initialize scroll position check
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollPosition);
      return () => container.removeEventListener("scroll", checkScrollPosition);
    }
  }, []);

  // Check auth status
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
      const message = data.message || data;
      if (!message) return;
      
      // Normalize IDs
      const senderId = message.sender?._id || message.sender;
      const receiverId = message.receiver?._id || message.receiver;
      
      // Check if message belongs to current conversation
      const isRelevantMessage = 
        (senderId === authUser._id && receiverId === selectedUser._id) ||
        (receiverId === authUser._id && senderId === selectedUser._id);
      
      if (isRelevantMessage) {
        addMessage(message);
      }
    };

    // Setup listeners for both formats
    socket.on("newMessage", messageHandler);
    socket.on("message", messageHandler);

    // Cleanup
    return () => {
      socket.off("newMessage", messageHandler);
      socket.off("message", messageHandler);
    };
  }, [socket, selectedUser?._id, authUser?._id]);

  const isOwnMessage = (sender) => {
    const senderId = sender?._id || sender;
    return senderId === authUser._id;
  };

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

  const filteredMessages = messages.filter((msg) => {
    const content = msg.content || {};
    return (
      content.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.fileName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (isCheckingAuth) return <div className="p-4">Loading chat...</div>;
  if (!authUser?._id) return <div className="p-4">Please log in to use the chat.</div>;

  return (
    <div className="flex-1 flex flex-col bg-base-100">
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
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          onScroll={checkScrollPosition}
        >
          {(searchTerm ? filteredMessages : messages).map((message) => {
            const own = isOwnMessage(message.sender);
            const content = message.content || {};
            const hasContent = content.text || content.image || content.file || content.audio;

            if (!hasContent) return null;

            const likedBy = Array.isArray(message.likedBy) ? message.likedBy : [];
            const likedByCurrentUser = likedBy.some(id => 
              id?.toString() === authUser._id.toString()
            );

            return (
              <div
                key={message._id || message.id}
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
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/avatar.png";
                      }}
                    />
                  </div>
                </div>

                <div className="chat-header text-xs mb-1 opacity-70">
                  {formatMessageTime(message.createdAt || message.timestamp)}
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
                  {/* Message options */}
                  <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MessageOptionsMenu
                      isOwnMessage={own}
                      onEdit={() => handleEdit(message._id, content.text)}
                      onLike={() => handleLike(message._id)}
                    />
                  </div>

                  {/* Text content */}
                  {content.text && (
                    <p className="whitespace-pre-line">{content.text}</p>
                  )}

                  {/* Media content */}
                  <MediaRenderer content={content} />

                  {/* Likes */}
                  {likedBy.length > 0 && (
                    <div className="flex justify-end mt-1">
                      <button
                        onClick={() => handleLike(message._id)}
                        className={`flex items-center gap-1 ${
                          likedByCurrentUser ? "text-red-500" : "text-gray-500"
                        }`}
                      >
                        <span>❤️</span>
                        <span className="text-xs">{likedBy.length}</span>
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