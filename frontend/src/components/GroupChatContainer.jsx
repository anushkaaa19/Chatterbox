import { useEffect, useRef, useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import GroupMessageInput from "./GroupMessageInput";
import GroupChatHeader from "./GroupChatHeader";
import { FiEdit3 } from "react-icons/fi";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";

const GroupChatContainer = () => {
  const bottomRef = useRef(null);

  const {
    selectedGroup,
    groupMessages,
    getGroupMessages,
    setGroupMessages,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
    sendGroupMessage,
    likeGroupMessage,
    editGroupMessage,
  } = useGroupStore();

  const socket = useAuthStore((state) => state.socket);
  const currentUser = useAuthStore((state) => state.authUser);

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editedText, setEditedText] = useState("");

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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages]);

  const isOwnMessage = (senderId) =>
    senderId?.toString() === currentUser?._id?.toString();

  const handleSendMessage = async (messageData) => {
    if (!selectedGroup?._id) return;
    try {
      await sendGroupMessage(selectedGroup._id, messageData);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleLike = async (messageId) => {
    try {
      await likeGroupMessage(messageId);
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleEdit = async (msgId) => {
    try {
      await editGroupMessage(msgId, editedText);
      setEditingMsgId(null);
      setEditedText("");
    } catch (err) {
      console.error("Edit error:", err);
    }
  };

  const filteredMessages = groupMessages.filter((msg) =>
    msg.content?.text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!selectedGroup) {
    return (
      <div className="flex-1 flex items-center justify-center text-base-content opacity-50">
        Select a group to start chatting.
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-base-content opacity-50">
        Please login to view messages.
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
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {loading ? (
          <div className="text-center text-base-content opacity-50">
            <span className="loading loading-spinner loading-md" />
            Loading messages...
          </div>
        ) : filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => {
            const isOwn = isOwnMessage(msg.sender?._id);
            const hasLiked = msg.likes?.includes(currentUser._id);
            const audioUrl = msg.content?.audio;

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
                        />
                      </div>
                    </div>
                  )}

                  <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                    {!isOwn && (
                      <div className="text-xs text-base-content opacity-60 mb-1">
                        {msg.sender?.fullName}
                      </div>
                    )}

                    <div
                      className={`px-3 py-2 rounded-lg whitespace-pre-line group relative ${
                        isOwn
                          ? "bg-primary text-primary-content"
                          : "bg-base-200 text-base-content"
                      }`}
                    >
                      {editingMsgId === msg._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            className="input input-sm w-full"
                          />
                          <button
                            onClick={() => handleEdit(msg._id)}
                            className="btn btn-xs btn-success"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <>
                          {msg.content?.text && <p>{msg.content.text}</p>}

                          {msg.content?.image && (
                            <img
                              src={msg.content.image}
                              alt="sent image"
                              className="mt-1 rounded-md max-w-xs max-h-48 object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/image-placeholder.png";
                              }}
                            />
                          )}

                          {audioUrl && (
                            <div className="mt-2 w-full max-w-xs bg-base-100 rounded p-1 shadow">
                              <audio
                                controls
                                preload="metadata"
                                className="w-full"
                                onCanPlay={() => console.log("Audio loaded:", audioUrl)}
                                onError={(e) => {
                                  console.error("Audio failed to load:", audioUrl);
                                  console.error("Error details:", e);
                                }}
                              >
                                <source src={audioUrl} type="audio/webm" />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          )}
                        </>
                      )}

                      <div className="absolute right-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        {isOwn && (
                          <button
                            className="btn btn-xs btn-circle btn-ghost"
                            onClick={() => {
                              setEditingMsgId(msg._id);
                              setEditedText(msg.content.text);
                            }}
                          >
                            <FiEdit3 />
                          </button>
                        )}
                        <button
                          className="btn btn-xs btn-circle btn-ghost"
                          onClick={() => handleLike(msg._id)}
                        >
                          {hasLiked ? <AiFillHeart className="text-error" /> : <AiOutlineHeart />}
                        </button>
                      </div>
                    </div>

                    <div className="text-[10px] text-base-content opacity-50 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {msg.likes?.length > 0 && (
                        <span className="ml-2 text-error">❤️ {msg.likes.length}</span>
                      )}
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
