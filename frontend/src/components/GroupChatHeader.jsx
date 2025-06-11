// components/GroupChatHeader.jsx
import React from "react";

const GroupChatHeader = ({ group }) => {
  return (
    <div className="p-4 border-b bg-base-200 flex items-center gap-4">
      <img
        src={group?.profilePic || "/default-avatar.png"}
        alt="Group Avatar"
        className="w-10 h-10 rounded-full"
      />
      <div>
        <h2 className="text-lg font-semibold">{group?.name || "Group Chat"}</h2>
        <p className="text-sm text-gray-500">{group?.members?.length || 0} members</p>
      </div>
    </div>
  );
};

export default GroupChatHeader;
