import React from "react";

const GroupMessage = ({ message }) => {
    const sender = message?.sender;
    const text = message?.content?.text;
  
    return (
      <div className="flex gap-2 items-start">
        <img
          src={sender?.profilePic || "/default-avatar.png"}
          alt="avatar"
          className="w-8 h-8 rounded-full"
        />
  
        <div>
          <div className="text-sm font-semibold text-white">
            {sender?.fullName || "Unknown"}
          </div>
          <div className="text-sm text-zinc-300">{text || "[No content]"}</div>
        </div>
      </div>
    );
  };
  

export default GroupMessage;
