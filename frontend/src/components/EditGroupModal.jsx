import { useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";

const EditGroupModal = ({ group, onClose }) => {
  const [name, setName] = useState(group.name);
  const [avatar, setAvatar] = useState(null);
  const { getGroups, setSelectedGroup } = useGroupStore();

  const handleUpdate = async () => {
    const formData = new FormData();
    formData.append("name", name);
    if (avatar) formData.append("avatar", avatar);

    try {
      const { data } = await axiosInstance.put(`/groups/${group._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Group updated");

      await getGroups();
      setSelectedGroup(data.group); // ✅ Update selected group state for immediate UI sync
      onClose();
    } catch {
      toast.error("Failed to update group");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;
    try {
      await axiosInstance.delete(`/groups/${group._id}`);
      toast.success("Group deleted");

      await getGroups();
      setSelectedGroup(null); // ✅ Clear selected group if deleted
      onClose();
    } catch {
      toast.error("Failed to delete group");
    }
  };

  const handleLeave = async () => {
    try {
      await axiosInstance.post(`/groups/${group._id}/leave`);
      toast.success("You left the group");

      await getGroups();
      setSelectedGroup(null); // ✅ Clear selected group if left
      onClose();
    } catch {
      toast.error("Failed to leave group");
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
          />
        </label>

        <label className="form-control w-full mb-4">
          <span className="label-text font-medium">Change Avatar</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatar(e.target.files[0])}
            className="file-input file-input-bordered w-full"
          />
        </label>

        <div className="flex justify-end space-x-2 mt-4">
          <button onClick={handleUpdate} className="btn btn-primary">Save</button>
          <button onClick={handleLeave} className="btn btn-warning">Leave</button>
          <button onClick={handleDelete} className="btn btn-error">Delete</button>
          <button onClick={onClose} className="btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default EditGroupModal;
