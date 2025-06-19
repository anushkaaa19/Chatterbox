import { useGroupStore } from "../store/useGroupStore";

const GroupInfoModal = ({ isOpen, onClose }) => {
  const group = useGroupStore((state) => state.selectedGroup);

  if (!isOpen || !group) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg text-center">Group Info</h3>

        <div className="mt-4">
          <div className="avatar flex justify-center">
            <div className="w-24 rounded-full">
              <img
                src={group.profilePic || "/avatar.png"}
                alt="Group Avatar"
              />
            </div>
          </div>

          <h4 className="text-center mt-2 text-xl font-semibold">{group.name}</h4>

          <div className="divider">Members</div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {group.members?.map((member) => (
              <div
                key={member?._id}
                className="flex items-center gap-2 p-2 hover:bg-base-200 rounded"
              >
                <div className="avatar">
                  <div className="w-8 rounded-full">
                    <img
                      src={member?.profilePic || "/avatar.png"}
                      alt={member?.fullName || "Member"}
                    />
                  </div>
                </div>
                <div>
                  <p className="font-medium">{member?.fullName || "Unknown"}</p>
                  {group.admin?._id === member?._id && (
                    <span className="badge badge-primary badge-xs ml-1">Admin</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-action">
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;
