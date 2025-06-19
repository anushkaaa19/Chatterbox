import { useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";

const EditGroupModal = ({ group, onClose }) => {
  const [name, setName] = useState(group?.name || "");
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);

  const { getGroups, setSelectedGroup } = useGroupStore();
  const socket = useAuthStore.getState().socket;

  if (!group) return null;

  const handleUpdate = async () => {
    const formData = new FormData();
    formData.append("name", name);
    if (avatar) formData.append("avatar", avatar);

    try {
      setLoading(true);
      const { data } = await axiosInstance.put(`/groups/${group._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Group updated");
      await getGroups();
      setSelectedGroup(data.group);
      onClose();
    } catch {
      toast.error("Failed to update group");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;

    try {
      setLoading(true);
      await axiosInstance.delete(`/groups/${group._id}`);
      toast.success("Group deleted");
      if (socket && group._id) socket.emit("leaveGroup", group._id);

      await getGroups();
      setSelectedGroup(null);
      onClose();
    } catch {
      toast.error("Failed to delete group");
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    try {
      setLoading(true);

      // Leave socket.io room
      if (socket && group._id) socket.emit("leaveGroup", group._id);

      await axiosInstance.post(`/groups/${group._id}/leave`);
      toast.success("You left the group");

      await getGroups();
      setSelectedGroup(null);
      onClose();
    } catch {
      toast.error("Failed to leave group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
      <div className="modal-box w-full max-w-md bg-base-100 shadow-xl">
        <h3 className="font-bold text-xl mb-4">Edit Group</h3>

        <label className="form-control w-full mb-3">
          <span className="label-text font-medium">Group Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered w-full"
            disabled={loading}
          />
        </label>

        <label className="form-control w-full mb-4">
          <span className="label-text font-medium">Change Avatar</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatar(e.target.files[0])}
            className="file-input file-input-bordered w-full"
            disabled={loading}
          />
        </label>

        {/* Avatar Preview */}
        <div className="flex justify-center mb-4">
          <div className="avatar">
            <div className="w-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img
                src={
                  avatar
                    ? URL.createObjectURL(avatar)
                    : group.profilePic || "/avatar.png"
                }
                alt="Group Avatar"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 mt-4">
          <button
            onClick={handleUpdate}
            className="btn btn-primary"
            disabled={loading}
          >
            Save
          </button>
          <button
            onClick={handleLeave}
            className="btn btn-warning"
            disabled={loading}
          >
            Leave
          </button>
          <button
            onClick={handleDelete}
            className="btn btn-error"
            disabled={loading}
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="btn"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditGroupModal;
