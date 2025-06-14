import { useEffect, useRef, useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import GroupMessageInput from "./GroupMessageInput";
import GroupChatHeader from "./GroupChatHeader";

// Audio Player
const AudioPlayer = ({ src, fileName }) => {
  const audioRef = useRef(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <div className="mt-2 w-full max-w-xs bg-base-100 rounded-lg p-2 shadow">
      {loading && !error && (
        <div className="flex items-center justify-center py-2">
          <span className="loading loading-spinner loading-sm mr-2" />
          <span className="text-sm">Loading audio...</span>
        </div>
      )}
      {error ? (
        <div className="text-error p-2 text-center">
          <p>Audio failed to load</p>
          <a
            href={src}
            className="link link-primary text-sm"
            download={fileName || "audio_message"}
          >
            Download instead
          </a>
        </div>
      ) : (
        <audio
          ref={audioRef}
          controls
          className={`w-full ${loading ? "hidden" : "block"}`}
          onLoadedMetadata={() => setLoading(false)}
          onCanPlay={() => setLoading(false)}
          onError={() => {
            console.error("Audio load error:", src);
            setError(true);
          }}
        >
          <source src={src} type="audio/mpeg" />
          <source src={src} type="audio/webm" />
          <source src={src} type="audio/ogg" />
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  );
};

const GroupChatContainer = () => {
  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    selectedGroup,
    groupMessages,
    getGroupMessages,
    setGroupMessages,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
    sendGroupMessage,
  } = useGroupStore();

  const socket = useAuthStore((state) => state.socket);
  const currentUser = useAuthStore((state) => state.authUser);

  const isOwnMessage = (senderId) =>
    senderId?.toString() === currentUser?._id?.toString();

  useEffect(() => {
    const container = messagesContainerRef.current;
    const checkScroll = () => {
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
    };
    container?.addEventListener("scroll", checkScroll);
    return () => container?.removeEventListener("scroll", checkScroll);
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedGroup) return;
      setLoading(true);
      try {
        const messages = await getGroupMessages(selectedGroup._id);
        setGroupMessages(Array.isArray(messages) ? messages : []);
      } catch (error) {
        console.error("Failed to fetch group messages:", error);
        setGroupMessages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [selectedGroup]);

  useEffect(() => {
    if (!selectedGroup?._id) return;
    subscribeToGroupMessages(selectedGroup._id);
    return () => unsubscribeFromGroupMessages();
  }, [selectedGroup?._id]);

  useEffect(() => {
    if (isAtBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [groupMessages, isAtBottom]);

  const filteredMessages = groupMessages.filter((msg) => {
    const content = msg.content || {};
    return (
      content.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSendMessage = async (messageData) => {
    if (!selectedGroup?._id) return;
    try {
      await sendGroupMessage(selectedGroup._id, messageData);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (!selectedGroup) {
    return (
      <div className="flex-1 flex items-center justify-center text-base-content opacity-50">
        Select a group to start chatting.
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full bg-base-100">
      <GroupChatHeader group={selectedGroup} />

      {/* Search bar */}
      <div className="px-4 py-2 bg-base-200 border-b border-base-300">
        <input
          type="text"
          placeholder="Search messages..."
          className="input input-bordered w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-2"
      >
        {loading ? (
          <div className="text-center text-base-content opacity-50">
            <span className="loading loading-spinner loading-md" />
            Loading messages...
          </div>
        ) : filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => {
            const isOwn = isOwnMessage(msg.sender?._id);
            const content = msg.content || {};
            return (
              <div
                key={msg._id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}
              >
                <div
                  className={`flex items-start ${
                    isOwn ? "flex-row-reverse" : ""
                  } gap-2 max-w-[85%]`}
                >
                  {!isOwn && (
                    <div className="avatar mt-1">
                      <div className="w-8 rounded-full">
                        <img
                          src={msg.sender?.profilePic || "/avatar.png"}
                          alt="avatar"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/avatar.png";
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <div
                    className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                  >
                    {!isOwn && (
                      <div className="text-xs text-base-content opacity-60 mb-1">
                        {msg.sender?.fullName}
                      </div>
                    )}
                    <div
                      className={`px-3 py-2 rounded-lg whitespace-pre-line ${
                        isOwn
                          ? "bg-primary text-primary-content"
                          : "bg-base-200 text-base-content"
                      }`}
                    >
                      {content.text && <p>{content.text}</p>}
                      {content.image && (
                        <div className="mt-1">
                          <img
                            src={content.image}
                            alt="sent image"
                            className="rounded-md max-w-xs max-h-48 object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.parentNode.innerHTML =
                                '<div class="bg-gray-200 border-2 border-dashed rounded-xl w-full h-32 flex items-center justify-center text-gray-500">Image failed to load</div>';
                            }}
                          />
                        </div>
                      )}
                      {content.audio && (
                        <AudioPlayer src={content.audio} fileName={content.fileName} />
                      )}
                    </div>
                    <div className="text-[10px] text-base-content opacity-50 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-base-content opacity-50">
            No messages found.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <GroupMessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default GroupChatContainer;
