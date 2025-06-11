import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { X } from "lucide-react";

const CreateGroupModal = ({ onClose }) => {
  const { users } = useChatStore();
  const { createGroup } = useGroupStore();

  const [groupName, setGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [avatar, setAvatar] = useState(null);

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!groupName.trim() || selectedUserIds.length < 2) {
      alert("Enter a group name and select at least 2 members.");
      return;
    }

    const formData = new FormData();
    formData.append("name", groupName);
    formData.append("members", JSON.stringify(selectedUserIds));
    if (avatar) formData.append("avatar", avatar);

    await createGroup(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-xl shadow-lg w-full max-w-lg relative p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-base-content hover:text-error"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center">Create New Group</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Name */}
          <div>
            <label className="label">
              <span className="label-text">Group Name</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          {/* Avatar Upload */}
          <div>
            <label className="label">
              <span className="label-text">Group Avatar (optional)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files[0])}
              className="file-input file-input-bordered w-full"
            />
          </div>

          {/* User List */}
          <div className="max-h-60 overflow-y-auto space-y-2 border border-base-300 rounded-md p-3">
            {users.map((user) => (
              <label
                key={user._id}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={selectedUserIds.includes(user._id)}
                  onChange={() => toggleUserSelection(user._id)}
                />
                <div className="avatar">
                  <div className="w-8 rounded-full">
                    <img src={user.profilePic || "/avatar.png"} alt="avatar" />
                  </div>
                </div>
                <span className="text-sm">{user.fullName}</span>
              </label>
            ))}
          </div>

          {/* Submit */}
          <button type="submit" className="btn btn-primary w-full">
            Create Group
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
