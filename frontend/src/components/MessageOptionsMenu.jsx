import { useState } from "react";

export const MessageOptionsMenu = ({ isOwnMessage, onEdit, onLike }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="text-gray-600 hover:text-gray-800"
        onClick={() => setOpen((prev) => !prev)}
      >
        ⋮
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-32 rounded-lg bg-white border shadow-lg z-10"
          onMouseLeave={() => setOpen(false)}
        >
          <ul className="py-1 text-sm text-gray-700">
            <li
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onLike();
                setOpen(false);
              }}
            >
              ❤️ Like
            </li>
            {isOwnMessage && (
              <li
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onEdit();
                  setOpen(false);
                }}
              >
                ✏️ Edit
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
