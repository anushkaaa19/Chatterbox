import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useGroupStore } from "../store/useGroupStore";

import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, UsersRound, Plus, Search } from "lucide-react";
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
  const [showMobileSearch, setShowMobileSearch] = useState(false);

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
    <aside className="h-full w-20 md:w-48 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200 bg-base-100 text-base-content">
      {/* 🔼 Header */}
      <div className="border-b border-base-300 w-full p-3 lg:p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {showGroups ? (
              <UsersRound className="size-6 text-primary" />
            ) : (
              <Users className="size-6 text-primary" />
            )}
            <span className="font-medium hidden md:block lg:block">
              {showGroups ? "Groups" : "Contacts"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGroups(!showGroups)}
              className="text-primary hover:text-primary-focus flex items-center"
              aria-label={showGroups ? "Show Contacts" : "Show Groups"}
            >
              <span className="hidden md:inline text-sm font-medium">
                {showGroups ? "Contacts" : "Groups"}
              </span>
              <span className="md:hidden">
                {showGroups ? <Users className="size-5" /> : <UsersRound className="size-5" />}
              </span>
            </button>

            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="md:hidden text-primary"
            >
              <Search className="size-5" />
            </button>
          </div>
        </div>

        {/* 🔍 Search Inputs */}
        {showMobileSearch && (
          <div className="mt-3 md:hidden">
            <input
              type="text"
              placeholder={`Search ${showGroups ? "groups" : "contacts"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>
        )}
        <div className="mt-3 hidden md:block">
          <input
            type="text"
            placeholder={`Search ${showGroups ? "groups" : "contacts"}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full"
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
                className="checkbox checkbox-sm checkbox-primary"
              />
              <span className="text-sm">Show online only</span>
            </label>
            <span className="text-xs opacity-60">
              ({Math.max(0, onlineUsers.length - 1)} online)
            </span>
          </div>
        )}

        {/* ➕ Create Group */}
        {showGroups && (
          <div className="mt-3 hidden md:block">
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="btn btn-primary w-full"
            >
              <Plus className="size-4" />
              <span className="hidden lg:block">Create Group</span>
            </button>
          </div>
        )}
      </div>

      {/* 👥 List Section */}
      <div className="overflow-y-auto w-full py-2">
        {!showGroups &&
          filteredUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => {
                setSelectedUser(user);
                setSelectedGroup(null);
              }}
              className={`w-full p-3 flex items-center gap-3 transition-colors relative ${
                selectedUser?._id === user._id ? "bg-base-200" : "hover:bg-base-200"
              }`}
            >
              <div className="relative">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="size-12 object-cover rounded-full border border-base-300 shadow"
                />
                {onlineUsers.includes(user._id) && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-base-100" />
                )}
              </div>
              {/* Name and status always visible */}
              <div className="ml-2 text-left min-w-0 max-w-[calc(100%-80px)]">
                <div className="font-medium truncate">{user.fullName}</div>
                <div className="text-xs opacity-60">
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
                setSelectedUser(null);
              }}
              className={`w-full p-3 flex items-center gap-3 transition-colors relative ${
                selectedGroup?._id === group._id ? "bg-base-200" : "hover:bg-base-200"
              }`}
            >
              <div className="relative">
                <img
                  src={group.profilePic || "/avatar.png"}
                  alt={group.name}
                  className="size-12 object-cover rounded-full border border-base-300 shadow"
                />
              </div>
              {/* Name and member count always visible */}
              <div className="ml-2 text-left min-w-0 max-w-[calc(100%-80px)]">
                <div className="font-medium truncate">{group.name}</div>
                <div className="text-xs opacity-60">
                  {group.members.length} members
                </div>
              </div>
            </button>
          ))}

        {!showGroups && filteredUsers.length === 0 && (
          <div className="text-center opacity-50 py-4">No users found</div>
        )}
        {showGroups && filteredGroups.length === 0 && (
          <div className="text-center opacity-50 py-4">No groups found</div>
        )}
      </div>

      {showCreateGroupModal && (
        <CreateGroupModal
          onClose={() => {
            getGroups();
            setShowCreateGroupModal(false);
          }}
        />
      )}
    </aside>
  );
};

export default Sidebar;