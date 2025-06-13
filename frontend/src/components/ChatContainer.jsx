import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { MessageOptionsMenu } from "./MessageOptionsMenu";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";

// Modal for editing message (unchanged)
const EditMessageModal = ({ isOpen, oldText, onClose, onSave }) => {
  // ... existing code ...
};

const ChatContainer = () => {
  // ... existing state and hooks ...

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-white">
      <ChatHeader />

      {/* 🔍 Search Bar */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <input
          type="text"
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isMessagesLoading ? (
        <MessageSkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
          {(searchTerm ? filteredMessages : messages).map((message) => {
            const own = isOwnMessage(message.senderId);
            const likes = Array.isArray(message.likes) ? message.likes : [];
            const likedByCurrentUser = likes.includes(authUser._id);

            return (
              <div
                key={message._id}
                className={`flex ${own ? "justify-end" : "justify-start"} group relative`}
              >
                {/* Sender avatar for others' messages */}
                {!own && (
                  <div className="mr-2 flex-shrink-0">
                    <div className="size-10 rounded-full overflow-hidden border-2 border-white shadow">
                      <img
                        src={selectedUser?.profilePic || "/avatar.png"}
                        alt="Profile"
                        className="size-full object-cover"
                      />
                    </div>
                  </div>
                )}
                
                <div className="max-w-[85%]">
                  {/* Sender name for others' messages */}
                  {!own && (
                    <div className="text-sm font-medium text-gray-700 mb-1 ml-1">
                      {selectedUser?.fullName || "Unknown"}
                    </div>
                  )}
                  
                  {/* Message bubble */}
                  <div
                    className={`rounded-2xl px-4 py-2 shadow-sm ${
                      own
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                    }`}
                  >
                    {/* Text message */}
                    {message.text && (
                      <>
                        <p className="break-words">
                          {message.text}
                          {message.edited && (
                            <span className="text-xs ml-2 opacity-70">(edited)</span>
                          )}
                        </p>

                        {/* Like button */}
                        {likedByCurrentUser && (
                          <button
                            onClick={() => handleLike(message._id)}
                            className={`mt-1 self-start ${own ? "text-blue-200" : "text-red-500"}`}
                          >
                            ❤️
                          </button>
                        )}
                      </>
                    )}

                    {/* Image attachment */}
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Attached"
                        className="mt-2 max-w-[200px] sm:max-w-xs rounded-lg object-cover border border-gray-200"
                      />
                    )}

                    {/* File attachment */}
                    {message.file && (
                      <a
                        href={message.file}
                        download={message.fileName || "file"}
                        className={`block mt-2 inline-flex items-center ${
                          own ? "text-blue-200" : "text-blue-600"
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="mr-1">📎</span>
                        <span className="truncate max-w-[160px]">
                          {message.fileName || "Download file"}
                        </span>
                      </a>
                    )}

                    {/* Audio attachment */}
                    {message.audio && (
                      <audio 
                        controls 
                        src={message.audio} 
                        className="mt-2 w-full max-w-xs" 
                      />
                    )}
                  </div>
                  
                  {/* Message time */}
                  <div className={`text-xs mt-1 ${own ? "text-right mr-1" : "ml-1"} text-gray-500`}>
                    {formatMessageTime(message.createdAt)}
                  </div>
                </div>
                
                {/* User avatar for own messages */}
                {own && (
                  <div className="ml-2 flex-shrink-0">
                    <div className="size-10 rounded-full overflow-hidden border-2 border-white shadow">
                      <img
                        src={authUser.profilePic || "/avatar.png"}
                        alt="Profile"
                        className="size-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Message options menu */}
                <div className={`hidden group-hover:block absolute top-0 ${own ? "right-14" : "left-14"}`}>
                  <MessageOptionsMenu
                    isOwnMessage={own}
                    message={message}
                    onEdit={() => handleEdit(message._id, message.text)}
                    onLike={() => handleLike(message._id)}
                  />
                </div>
              </div>
            );
          })}

          {/* No messages found */}
          {searchTerm && filteredMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="text-gray-400 mb-2">🔍</div>
              <p className="text-gray-500">No messages found for "{searchTerm}"</p>
            </div>
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