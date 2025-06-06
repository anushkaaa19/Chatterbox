import { useEffect, useRef, useState } from "react";
// ... existing imports

const ChatContainer = () => {
  // ... all your existing code

  const [searchTerm, setSearchTerm] = useState(""); // ✅ New

  // Filter messages based on search term
  const filteredMessages = messages.filter(
    (msg) =>
      msg.text &&
      msg.text.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      {/* ✅ Search Bar */}
      <div className="px-4 pt-4">
        <input
          type="text"
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isMessagesLoading ? (
        <MessageSkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(searchTerm ? filteredMessages : messages).map((message) => {
            const own = isOwnMessage(message.senderId);
            const likes = Array.isArray(message.likes) ? message.likes : [];
            const likedByCurrentUser = likes.includes(authUser._id);

            return (
              <div
                key={message._id}
                className={`chat ${own ? "chat-end" : "chat-start"} group relative`}
              >
                {/* ... same message display UI as before */}
                {/* truncated for brevity */}
              </div>
            );
          })}

          {/* ✅ If no messages match search */}
          {(searchTerm && filteredMessages.length === 0) && (
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
