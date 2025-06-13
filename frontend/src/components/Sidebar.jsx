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
    <aside className="h-full w-20 md:w-48 lg:w-72 border-r border-gray-200 flex flex-col transition-all duration-200 bg-white">
      {/* 🔼 Header */}
      <div className="border-b border-gray-200 w-full p-3 lg:p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {showGroups ? <UsersRound className="size-6 text-blue-600" /> : <Users className="size-6 text-blue-600" />}
            <span className="font-medium hidden md:block lg:block text-gray-800">
              {showGroups ? "Groups" : "Contacts"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Groups/Contacts toggle for all screen sizes */}
            <button
              onClick={() => setShowGroups(!showGroups)}
              className="text-blue-600 hover:text-blue-700 flex items-center"
              aria-label={showGroups ? "Show Contacts" : "Show Groups"}
            >
              {/* Text for medium screens and above */}
              <span className="hidden md:inline text-sm font-medium">
                {showGroups ? "Contacts" : "Groups"}
              </span>
              
              {/* Icon for mobile screens */}
              <span className="md:hidden">
                {showGroups ? <Users className="size-5" /> : <UsersRound className="size-5" />}
              </span>
            </button>
            
            <button 
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="md:hidden text-blue-600"
            >
              <Search className="size-5" />
            </button>
          </div>
        </div>

        {/* 🔍 Search - Mobile (toggled) */}
        {showMobileSearch && (
          <div className="mt-3 md:hidden">
            <input
              type="text"
              placeholder={`Search ${showGroups ? "groups" : "contacts"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        )}

        {/* 🔍 Search - Medium and Large screens */}
        <div className="mt-3 hidden md:block">
          <input
            type="text"
            placeholder={`Search ${showGroups ? "groups" : "contacts"}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* ✅ Online Filter - Large screens only */}
        {!showGroups && (
          <div className="mt-3 hidden lg:flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show online only</span>
            </label>
            <span className="text-xs text-gray-500">
              ({Math.max(0, onlineUsers.length - 1)} online)
            </span>
          </div>
        )}

        {/* ➕ Create Group - Medium and Large screens */}
        {showGroups && (
          <div className="mt-3 hidden md:block">
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <Plus className="size-4" />
              <span className="hidden lg:block">Create Group</span>
            </button>
          </div>
        )}
      </div>

      {/* 👥 Contact or Group List */}
      <div className="overflow-y-auto w-full py-2">
        {!showGroups &&
          filteredUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => {
                setSelectedUser(user);
                setSelectedGroup(null);
              }}
              className={`w-full p-3 flex items-center gap-3 hover:bg-blue-50 transition-colors relative ${
                selectedUser?._id === user._id ? "bg-blue-50" : ""
              }`}
            >
              <div className="relative">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="size-12 object-cover rounded-full border-2 border-white shadow"
                />
                {onlineUsers.includes(user._id) && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-white" />
                )}
              </div>
              
              {/* Name and status for all screens */}
              <div className="absolute left-16 ml-2 text-left min-w-0 max-w-[calc(100%-80px)]">
                <div className="font-medium truncate text-gray-800">{user.fullName}</div>
                <div className="text-xs text-gray-500">
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
              className={`w-full p-3 flex items-center gap-3 hover:bg-blue-50 transition-colors relative ${
                selectedGroup?._id === group._id ? "bg-blue-50" : ""
              }`}
            >
              <div className="relative">
                <img
                  src={group.profilePic || "/avatar.png"}
                  alt={group.name}
                  className="size-12 object-cover rounded-full border-2 border-white shadow"
                />
              </div>
              
              {/* Name and member count for all screens */}
              <div className="absolute left-16 ml-2 text-left min-w-0 max-w-[calc(100%-80px)]">
                <div className="font-medium truncate text-gray-800">{group.name}</div>
                <div className="text-xs text-gray-500">
                  {group.members.length} members
                </div>
              </div>
            </button>
          ))}

        {!showGroups && filteredUsers.length === 0 && (
          <div className="text-center text-gray-500 py-4">No users found</div>
        )}
        {showGroups && filteredGroups.length === 0 && (
          <div className="text-center text-gray-500 py-4">No groups found</div>
        )}
      </div>

      {/* 🧩 Create Group Modal */}
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