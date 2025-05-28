// --- MessageOptionsMenu.jsx ---
import { MoreVertical, Edit2, ThumbsUp } from "lucide-react";
import { useState } from "react";

export const MessageOptionsMenu = ({ isOwnMessage, onEdit, onLike }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="btn btn-ghost btn-xs">
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-base-100 rounded-md shadow p-2 text-sm z-50 space-y-1">
          {isOwnMessage && (
            <button onClick={onEdit} className="flex items-center gap-1">
              <Edit2 size={14} /> Edit
            </button>
          )}
          <button onClick={onLike} className="flex items-center gap-1">
            <ThumbsUp size={14} /> Like
          </button>
        </div>
      )}
    </div>
  );
};
