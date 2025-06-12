import React, { useState } from "react";
import EditGroupModal from "./EditGroupModal";
import GroupInfoModal from "./GroupInfoModal";

const GroupChatHeader = ({ group }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  return (
    <>
      <div className="p-4 bg-base-200 border-b border-base-300 flex items-center gap-4 shadow-sm">
        {/* Group Avatar */}
        <div
          className="avatar cursor-pointer hover:opacity-80 transition duration-200"
          onClick={() => setIsEditModalOpen(true)}
        >
          <div className="w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
            <img src={group?.profilePic || "/default-avatar.png"} alt="Group Avatar" />
          </div>
        </div>

        {/* Group Info */}
        <div className="flex flex-col">
          <h2
            className="text-xl font-bold text-primary cursor-pointer hover:underline"
            onClick={() => setIsEditModalOpen(true)} // ← CHANGED HERE
          >
            {group?.name || "Group Chat"}
          </h2>
          <p className="text-sm text-base-content/60">
            {group?.members?.length || 0} member{group?.members?.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Modals */}
      {isEditModalOpen && (
        <EditGroupModal group={group} onClose={() => setIsEditModalOpen(false)} />
      )}
      {isInfoModalOpen && (
        <GroupInfoModal group={group} onClose={() => setIsInfoModalOpen(false)} />
      )}
    </>
  );
};

export default GroupChatHeader;
