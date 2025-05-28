import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { MessageOptionsMenu } from "./MessageOptionsMenu";
import ChatHeader from "./ChatHeader";
import MessageInput from "./Messageinput"; // fixed import case
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";

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

  const authUser = useAuthStore((state) => state.authUser);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const socket = useAuthStore((state) => state.socket);

  const messageEndRef = useRef(null);

  useEffect(() => {
    if (!selectedUser?._id || !socket) return;

    getMessages(selectedUser._id);
    subscribeToMessages();
    subscribeToTypingEvents();

    return () => {
      unsubscribeFromMessages();
      unsubscribeFromTypingEvents();
    };
  }, [selectedUser?._id, socket, getMessages, subscribeToMessages, unsubscribeFromMessages, subscribeToTypingEvents, unsubscribeFromTypingEvents]);

  useEffect(() => {
    if (messageEndRef.current && messages.length) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isCheckingAuth) return <div>Loading chat...</div>;
  if (!authUser?._id) return <div>Please log in to use the chat.</div>;

  const isOwnMessage = (senderId) => {
    // senderId can be string or object
    if (!senderId) return false;
    if (typeof senderId === "string") {
      return senderId === authUser._id;
    }
    if (typeof senderId === "object" && senderId._id) {
      return senderId._id === authUser._id;
    }
    return false;
  };

  const handleEdit = (id, oldText) => {
    const newText = prompt("Edit your message", oldText);
    if (newText && newText !== oldText) {
      useChatStore.getState().editMessage(id, newText);
    }
  };

  const handleLike = (id) => {
    useChatStore.getState().toggleLike(id);
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      {isMessagesLoading ? (
        <MessageSkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => {
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

          {/* Typing indicator below messages */}
          {typingUsers.length > 0 && (
            <div className="p-2 italic text-sm text-gray-500">
              {typingUsers
                .filter((userId) => userId !== authUser._id)
                .map((userId, i, arr) => (
                  <span key={userId}>
                    {i > 0 && ", "}Typing...
                  </span>
                ))}
            </div>
          )}

          <div ref={messageEndRef} />
        </div>
      )}

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
