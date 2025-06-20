import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

// Global socket event handlers
let groupUpdateHandler = null;
let groupMessageHandler = null;

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupLoading: false,

  subscribeToGroupEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    if (groupUpdateHandler) socket.off("groupUpdated", groupUpdateHandler);

    groupUpdateHandler = ({ group }) => {
      set((state) => {
        const updatedGroups = state.groups.map((g) =>
          g._id === group._id ? group : g
        );
    
        const updatedSelectedGroup =
          state.selectedGroup?._id === group._id
            ? { ...group, _refresh: Date.now() } // 🔥 force update
            : state.selectedGroup;
    
        return {
          groups: updatedGroups,
          selectedGroup: updatedSelectedGroup,
        };
      });
    };
    

    socket.on("groupUpdated", groupUpdateHandler);
  },

  unsubscribeFromGroupEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (socket && groupUpdateHandler) {
      socket.off("groupUpdated", groupUpdateHandler);
      groupUpdateHandler = null;
    }
  },

  setSelectedGroup: (group) => {
    const socket = useAuthStore.getState().socket;
    const { selectedGroup } = get();

    if (socket && selectedGroup?._id) {
      socket.emit("leaveGroup", selectedGroup._id);
    }

    if (socket && group?._id) {
      socket.emit("joinGroup", group._id);
    }

    set({ selectedGroup: group });
  },

  setGroupMessages: (messages) => {
    set({ groupMessages: Array.isArray(messages) ? messages : [] });
  },

  getGroups: async () => {
    set({ isGroupLoading: true });
    try {
      const { data } = await axiosInstance.get("/groups");
      set({ groups: data.groups || [], isGroupLoading: false });
    } catch (err) {
      console.error("Error fetching groups", err);
      set({ isGroupLoading: false });
    }
  },

  createGroup: async (formData) => {
    try {
      const res = await axiosInstance.post("/groups", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const group = res.data?.group;
      toast.success("Group created successfully");

      set((state) => ({
        groups: [...state.groups, group],
      }));

      return group;
    } catch (err) {
      console.error("Create group failed:", err);
      toast.error("Failed to create group");
      throw err;
    }
  },

  getGroupMessages: async (groupId) => {
    try {
      const { data } = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ groupMessages: data.messages || [] });
      return data.messages;
    } catch (err) {
      console.error("Error loading group messages", err);
      return [];
    }
  },

  sendGroupMessage: async (groupId, messageData) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/messages`, messageData);
      return res.data?.message;
    } catch (err) {
      console.error("Error sending message", err);
      toast.error("Failed to send group message");
      throw err;
    }
  },

  subscribeToGroupMessages: (groupId) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    if (groupMessageHandler) {
      socket.off("receiveGroupMessage", groupMessageHandler);
    }

    groupMessageHandler = ({ groupId: gid, message }) => {
      if (gid === groupId) {
        set((state) => {
          const exists = state.groupMessages.some((m) => m._id === message._id);
          return exists
            ? state
            : { groupMessages: [...state.groupMessages, message] };
        });
      }
    };

    socket.on("receiveGroupMessage", groupMessageHandler);
  },

  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket && groupMessageHandler) {
      socket.off("receiveGroupMessage", groupMessageHandler);
      groupMessageHandler = null;
    }
  },
}));
