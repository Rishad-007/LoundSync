/**
 * Device Slice - Phase 1
 * Manages members/devices in a session
 */

import { StateCreator } from "zustand";
import type {
  DeviceActions,
  DeviceHelpers,
  DeviceState,
  LoudSyncStore,
  Member,
} from "../types";

export type DeviceSlice = DeviceState & DeviceActions & DeviceHelpers;

export const createDeviceSlice: StateCreator<
  LoudSyncStore,
  [],
  [],
  DeviceSlice
> = (set, get) => ({
  // ============================================================================
  // INITIAL STATE
  // ============================================================================
  members: [],
  host: null,
  connectedCount: 0,
  pendingRequests: [],

  // ============================================================================
  // MEMBER MANAGEMENT ACTIONS
  // ============================================================================

  /**
   * Add a member to the session
   */
  addMember: (member: Member) => {
    set((state) => {
      // Check if member already exists
      const exists = state.members.find((m) => m.id === member.id);
      if (exists) {
        console.warn("[DeviceSlice] Member already exists:", member.name);
        return state;
      }

      const newMembers = [...state.members, member];
      const connected = newMembers.filter(
        (m) => m.connectionStatus === "connected",
      ).length;

      console.log("[DeviceSlice] Member added:", member.name);

      return {
        members: newMembers,
        connectedCount: connected,
      };
    });
  },

  /**
   * Remove a member from the session
   */
  removeMember: (memberId: string) => {
    set((state) => {
      const member = state.members.find((m) => m.id === memberId);
      if (!member) {
        console.warn(
          "[DeviceSlice] Cannot remove non-existent member:",
          memberId,
        );
        return state;
      }

      const newMembers = state.members.filter((m) => m.id !== memberId);
      const connected = newMembers.filter(
        (m) => m.connectionStatus === "connected",
      ).length;

      console.log("[DeviceSlice] Member removed:", member.name);

      return {
        members: newMembers,
        connectedCount: connected,
      };
    });
  },

  /**
   * Update specific fields of a member
   */
  updateMember: (memberId: string, updates: Partial<Member>) => {
    set((state) => {
      const member = state.members.find((m) => m.id === memberId);
      if (!member) {
        console.warn(
          "[DeviceSlice] Cannot update non-existent member:",
          memberId,
        );
        return state;
      }

      const newMembers = state.members.map((m) =>
        m.id === memberId ? { ...m, ...updates } : m,
      );

      const connected = newMembers.filter(
        (m) => m.connectionStatus === "connected",
      ).length;

      return {
        members: newMembers,
        connectedCount: connected,
      };
    });
  },

  /**
   * Set the host device
   */
  setHost: (member: Member | null) => {
    set({ host: member });
    if (member) {
      console.log("[DeviceSlice] Host set:", member.name);
    }
  },

  /**
   * Clear all members (when leaving session)
   */
  clearMembers: () => {
    set({
      members: [],
      host: null,
      connectedCount: 0,
      pendingRequests: [],
    });
    console.log("[DeviceSlice] All members cleared");
  },

  // ============================================================================
  // JOIN REQUEST HANDLING (HOST ONLY)
  // ============================================================================

  /**
   * Add a pending join request
   * Called when a client requests to join (host only)
   */
  addPendingRequest: (member: Member) => {
    set((state) => {
      const exists = state.pendingRequests.find((m) => m.id === member.id);
      if (exists) {
        return state;
      }

      console.log("[DeviceSlice] New join request from:", member.name);

      return {
        pendingRequests: [...state.pendingRequests, member],
      };
    });
  },

  /**
   * Accept a join request
   * MOCK: Adds member to session
   */
  acceptRequest: async (memberId: string) => {
    try {
      const request = get().pendingRequests.find((m) => m.id === memberId);
      if (!request) {
        throw new Error("Request not found");
      }

      console.log("[DeviceSlice] Accepting join request from:", request.name);

      // TODO: Send acceptance message to client
      // await NetworkLayer.sendAcceptance(request);

      // Remove from pending
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((m) => m.id !== memberId),
      }));

      // Add as member
      get().addMember({
        ...request,
        connectionStatus: "connected",
      });

      // TODO: Broadcast member list update to all clients
      // await NetworkLayer.broadcastMemberUpdate();

      console.log("[DeviceSlice] Request accepted");
    } catch (error) {
      console.error("[DeviceSlice] Failed to accept request:", error);
      throw error;
    }
  },

  /**
   * Reject a join request
   * MOCK: Removes from pending list
   */
  rejectRequest: async (memberId: string) => {
    try {
      const request = get().pendingRequests.find((m) => m.id === memberId);
      if (!request) {
        throw new Error("Request not found");
      }

      console.log("[DeviceSlice] Rejecting join request from:", request.name);

      // TODO: Send rejection message to client
      // await NetworkLayer.sendRejection(request);

      // Remove from pending
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((m) => m.id !== memberId),
      }));

      console.log("[DeviceSlice] Request rejected");
    } catch (error) {
      console.error("[DeviceSlice] Failed to reject request:", error);
      throw error;
    }
  },

  /**
   * Kick a member from the session (host only)
   * MOCK: Removes member and notifies them
   */
  kickMember: async (memberId: string) => {
    try {
      const member = get().getMember(memberId);
      if (!member) {
        throw new Error("Member not found");
      }

      if (member.role === "host") {
        throw new Error("Cannot kick the host");
      }

      console.log("[DeviceSlice] Kicking member:", member.name);

      // TODO: Send kick notification to member
      // await NetworkLayer.sendKickNotification(member);

      // Remove member
      get().removeMember(memberId);

      // TODO: Broadcast member list update
      // await NetworkLayer.broadcastMemberUpdate();

      console.log("[DeviceSlice] Member kicked");
    } catch (error) {
      console.error("[DeviceSlice] Failed to kick member:", error);
      throw error;
    }
  },

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Get a specific member by ID
   */
  getMember: (memberId: string) => {
    return get().members.find((m) => m.id === memberId);
  },

  /**
   * Get all members
   */
  getAllMembers: () => {
    return get().members;
  },

  /**
   * Get only connected members
   */
  getConnectedMembers: () => {
    return get().members.filter((m) => m.connectionStatus === "connected");
  },

  /**
   * Get only client members (exclude host)
   */
  getClientMembers: () => {
    return get().members.filter((m) => m.role === "client");
  },

  /**
   * Check if current device is the host
   */
  isHost: () => {
    const localDevice = get().localDevice;
    const role = get().role;
    return role === "host" && localDevice !== null;
  },

  /**
   * Check if a specific member is in the session
   */
  isMemberInSession: (memberId: string) => {
    return get().members.some((m) => m.id === memberId);
  },
});
