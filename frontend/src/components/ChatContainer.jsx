import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import { MessageOptionsMenu } from "./MessageOptionsMenu";
import ChatHeader from "./ChatHeader";
import MessageInput from "./Messageinput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const authUser = useAuthStore((state) => state.authUser);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  const messageEndRef = useRef(null);

  // Hooks must always be called unconditionally and in the same order
  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessages(selectedUser._id);
    const socket = useAuthStore.getState().socket;
    if (socket) subscribeToMessages();

    return () => {
      if (socket) unsubscribeFromMessages();
    };
  }, [selectedUser?._id]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Early returns after hooks
  if (isCheckingAuth) {
    return <div>Loading chat...</div>;
  }

  if (!authUser || !authUser._id) {
    return <div>Please log in to use the chat.</div>;
  }

  const isOwnMessage = (senderId) => {
    const id = senderId?._id || senderId;
    return id?.toString() === authUser._id?.toString();
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

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

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
                    alt="profile pic"
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
                      {message.text}{" "}
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

        <div ref={messageEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
