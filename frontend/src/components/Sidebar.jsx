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
    <aside className="h-full w-full border-r border-base-300 flex flex-col">
      {/* Header */}
      <div className="border-b border-base-300 w-full p-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {showGroups ? <UsersRound className="size-5" /> : <Users className="size-5" />}
            <span className="font-medium">
              {showGroups ? "Groups" : "Contacts"}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="sm:hidden"
            >
              <Search className="size-5" />
            </button>
            <button
              onClick={() => setShowGroups(!showGroups)}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              {showGroups ? "Contacts" : "Groups"}
            </button>
          </div>
        </div>

        {/* Desktop Search - Always visible */}
        <div className="mt-2 hidden sm:block">
          <input
            type="text"
            placeholder={`Search ${showGroups ? "groups" : "contacts"}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-md border border-base-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Mobile Search - Conditionally shown */}
        {showMobileSearch && (
          <div className="mt-2 sm:hidden">
            <input
              type="text"
              placeholder={`Search ${showGroups ? "groups" : "contacts"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-md border border-base-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
        )}

        {/* Online Filter */}
        {!showGroups && (
          <div className="mt-2 flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-1">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Online only</span>
            </label>
            <span className="text-xs text-zinc-500">
              ({Math.max(0, onlineUsers.length - 1)} online)
            </span>
          </div>
        )}

        {/* Create Group Button */}
        {showGroups && (
          <div className="mt-2">
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="btn btn-primary btn-sm w-full flex items-center justify-center gap-1"
            >
              <Plus className="size-4" />
              <span>Create Group</span>
            </button>
          </div>
        )}
      </div>

      {/* Contact or Group List */}
      <div className="overflow-y-auto w-full">
        {!showGroups &&
          filteredUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => {
                setSelectedUser(user);
                setSelectedGroup(null);
                setShowMobileSearch(false);
              }}
              className={`w-full p-3 text-left hover:bg-base-300 transition-colors ${
                selectedUser?._id === user._id ? "bg-base-300" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium truncate">
                  {user.fullName}
                </span>
                {onlineUsers.includes(user._id) && (
                  <span className="size-2 bg-green-500 rounded-full" />
                )}
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
                setShowMobileSearch(false);
              }}
              className={`w-full p-3 text-left hover:bg-base-300 transition-colors ${
                selectedGroup?._id === group._id ? "bg-base-300" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium truncate">
                  {group.name}
                </span>
                <span className="text-xs text-zinc-500">
                  {group.members.length}
                </span>
              </div>
            </button>
          ))}

        {!showGroups && filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4 text-sm">No users found</div>
        )}
        {showGroups && filteredGroups.length === 0 && (
          <div className="text-center text-zinc-500 py-4 text-sm">No groups found</div>
        )}
      </div>

      {/* Create Group Modal */}
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