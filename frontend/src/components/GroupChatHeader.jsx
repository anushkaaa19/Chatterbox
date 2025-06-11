import React, { useState } from "react";
import EditGroupModal from "./EditGroupModal";

const GroupChatHeader = ({ group }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAvatarClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="p-4 bg-base-200 border-b border-base-300 flex items-center gap-4 shadow-sm">
        {/* Group Avatar */}
        <div className="avatar cursor-pointer hover:opacity-80 transition duration-200" onClick={handleAvatarClick}>
          <div className="w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
            <img
              src={group?.profilePic || "/default-avatar.png"}
              alt="Group Avatar"
            />
          </div>
        </div>

        {/* Group Info */}
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-base-content">{group?.name || "Group Chat"}</h2>
          <p className="text-sm text-base-content/60">
            {group?.members?.length || 0} member{group?.members?.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <EditGroupModal
          group={group}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default GroupChatHeader;
