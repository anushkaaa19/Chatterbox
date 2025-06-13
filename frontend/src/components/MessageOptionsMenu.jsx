// --- MessageOptionsMenu.jsx --- (no changes needed here)
import { MoreVertical, Edit2, ThumbsUp } from "lucide-react";
import { useState } from "react";

export const MessageOptionsMenu = ({ isOwnMessage, onEdit, onLike }) => {
  const [open, setOpen] = useState(false);

  const handleOptionClick = (handler) => {
    setOpen(false);
    handler();
  };

  return (
    <div className="relative">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }} 
        className="btn btn-ghost btn-xs"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-base-100 rounded-md shadow p-2 text-sm z-50 space-y-1 min-w-[100px]">
          {isOwnMessage && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleOptionClick(onEdit);
              }} 
              className="flex items-center gap-1 w-full text-left hover:bg-base-200 p-1 rounded"
            >
              <Edit2 size={14} /> Edit
            </button>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleOptionClick(onLike);
            }} 
            className="flex items-center gap-1 w-full text-left hover:bg-base-200 p-1 rounded"
            >
            <ThumbsUp size={14} /> Like
          </button>
        </div>
      )}
    </div>
  );
};