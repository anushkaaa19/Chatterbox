import React, { useState } from "react";
import EditGroupModal from "./EditGroupModal";
import { useGroupStore } from "../store/useGroupStore";

import GroupInfoModal from "./GroupInfoModal";

const GroupChatHeader = () => {
  const group = useGroupStore((state) => state.selectedGroup); // ⬅️ use Zustand state directly

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);


  // Fallback avatar URL
  const fallbackAvatar = "/avatar.png"; // make sure this file exists in public/
  useEffect(() => {
    // force re-render on group._refresh
    setRefreshKey((prev) => prev + 1);
  }, [group?._refresh]);
  
  
  return (
    <>
      <div className="p-4 bg-base-200 border-b border-base-300 flex items-center gap-4 shadow-sm">
        {/* Group Avatar - opens Edit Modal */}
        <div
          className="avatar cursor-pointer hover:opacity-80 transition duration-200"
          onClick={() => setIsEditModalOpen(true)}
        >
          <div className="w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
            <img
              src={group?.profilePic?.trim() || fallbackAvatar}
              alt="Group Avatar"
              onError={(e) => (e.target.src = fallbackAvatar)}
            />
          </div>
        </div>

        {/* Group Info - name opens Info Modal */}
        <div className="flex flex-col">
          <h2
            className="text-xl font-bold text-primary cursor-pointer hover:underline"
            onClick={() => setIsInfoModalOpen(true)}
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
      <GroupInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        group={group}
      />
    </>
  );
};

export default GroupChatHeader;
