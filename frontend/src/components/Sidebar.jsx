import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useGroupStore } from "../store/useGroupStore";

import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, UsersRound, Plus } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const {
    groups,
    getGroups,
    selectedGroup,
    setSelectedGroup,
    isGroupLoading,
  } = useGroupStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showGroups, setShowGroups] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  useEffect(() => {
    getUsers();
    getGroups();
  }, [getUsers, getGroups]);

  const filteredUsers = users
    .filter((user) => user.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((user) => (showOnlineOnly ? onlineUsers.includes(user._id) : true));

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isUsersLoading || isGroupLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      {/* 🔼 Header */}
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {showGroups ? <UsersRound className="size-6" /> : <Users className="size-6" />}
            <span className="font-medium hidden lg:block">
              {showGroups ? "Groups" : "Contacts"}
            </span>
          </div>
          <button
            onClick={() => setShowGroups(!showGroups)}
            className="text-sm text-blue-500 underline hover:text-blue-600"
          >
            {showGroups ? "Contacts" : "Groups"}
          </button>
        </div>

        {/* 🔍 Search */}
        <div className="mt-3 hidden lg:block">
          <input
            type="text"
            placeholder={`Search ${showGroups ? "groups" : "contacts"}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-base-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* ✅ Online Filter */}
        {!showGroups && (
          <div className="mt-3 hidden lg:flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Show online only</span>
            </label>
            <span className="text-xs text-zinc-500">
              ({Math.max(0, onlineUsers.length - 1)} online)
            </span>
          </div>
        )}

        {/* ➕ Create Group */}
        {showGroups && (
          <div className="mt-3">
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="w-full flex items-center gap-2 text-sm text-white bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded-md"
            >
              <Plus className="size-4" />
              <span className="hidden lg:block">Create Group</span>
            </button>
          </div>
        )}
      </div>

      {/* 👥 Contact or Group List */}
      <div className="overflow-y-auto w-full py-3">
        {!showGroups &&
          filteredUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => {
                setSelectedUser(user);
                setSelectedGroup(null); // 🔄 clear group selection
              }}
              className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
                selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""
              }`}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                )}
              </div>
              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{user.fullName}</div>
                <div className="text-sm text-zinc-400">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
            </button>
          ))}

        {showGroups &&
          filteredGroups.map((group) => (
            <button
              key={group._id}
              onClick={() => {
                setSelectedGroup(group);
                setSelectedUser(null); // 🔄 clear user selection
              }}
              className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
                selectedGroup?._id === group._id ? "bg-base-300 ring-1 ring-base-300" : ""
              }`}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={group.profilePic || "/group.png"}
                  alt={group.name}
                  className="size-12 object-cover rounded-full"
                />
              </div>
              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{group.name}</div>
                <div className="text-sm text-zinc-400">
                  {group.members.length} members
                </div>
              </div>
            </button>
          ))}

        {/* 🔕 No results */}
        {!showGroups && filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No users found</div>
        )}
        {showGroups && filteredGroups.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No groups found</div>
        )}
      </div>

      {/* 🧩 Create Group Modal */}
      {showCreateGroupModal && (
        <CreateGroupModal onClose={() => setShowCreateGroupModal(false)} />
      )}
    </aside>
  );
};

export default Sidebar;
