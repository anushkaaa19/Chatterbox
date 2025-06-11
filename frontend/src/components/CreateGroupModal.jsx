import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { X } from "lucide-react";

const CreateGroupModal = ({ onClose }) => {
  const { users } = useChatStore();
  const { createGroup } = useGroupStore();

  const [groupName, setGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [avatar, setAvatar] = useState(null); // New

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!groupName.trim() || selectedUserIds.length < 2) {
      alert("Please enter a group name and select at least 2 members.");
      return;
    }

    const formData = new FormData();
    formData.append("name", groupName);
    formData.append("members", JSON.stringify(selectedUserIds));
    if (avatar) formData.append("avatar", avatar);

    await createGroup(formData); // expects FormData
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-11/12 max-w-md relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-zinc-600 hover:text-zinc-900">
          <X className="size-5" />
        </button>

        <h2 className="text-lg font-semibold mb-4">Create New Group</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full border border-zinc-300 rounded-md px-4 py-2"
          />

          {/* Avatar Upload */}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatar(e.target.files[0])}
            className="w-full"
          />

          <div className="max-h-64 overflow-y-auto space-y-2">
            {users.map((user) => (
              <label key={user._id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(user._id)}
                  onChange={() => toggleUserSelection(user._id)}
                />
                <img src={user.profilePic || "/avatar.png"} className="w-8 h-8 rounded-full" alt={user.fullName} />
                <span>{user.fullName}</span>
              </label>
            ))}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Create Group
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;

