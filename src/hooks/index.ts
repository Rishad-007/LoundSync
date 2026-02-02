/**
 * Custom Hooks for LOUDSYNC
 * Phase 1: Session Hosting & Joining Only
 */

import { useCallback } from "react";
import {
  useCurrentSession,
  useDiscoveredSessions,
  useIsHost,
  useMembers,
  useSessionActions,
  useSessionRole,
  useSessionStatus,
} from "../state";

/**
 * useSession Hook
 * Combines session state and provides convenient helpers
 *
 * @example
 * const { isInSession, isHosting, createAndStartSession } = useSession();
 */
export function useSession() {
  const status = useSessionStatus();
  const role = useSessionRole();
  const session = useCurrentSession();
  const { createSession, startHosting, leaveSession } = useSessionActions();

  const isInSession = status === "hosting" || status === "connected";
  const isHosting = status === "hosting";
  const isJoining = status === "joining";
  const isDiscovering = status === "discovering";
  const isIdle = status === "idle";

  /**
   * Create and start hosting in one call
   */
  const createAndStartSession = useCallback(
    async (name: string) => {
      await createSession(name);
      await startHosting();
    },
    [createSession, startHosting],
  );

  return {
    status,
    role,
    session,
    isInSession,
    isHosting,
    isJoining,
    isDiscovering,
    isIdle,
    createSession,
    startHosting,
    leaveSession,
    createAndStartSession,
  };
}

/**
 * useSessionDiscovery Hook
 * Simplifies session discovery flow
 *
 * @example
 * const { sessions, isDiscovering, discover } = useSessionDiscovery();
 */
export function useSessionDiscovery() {
  const discoveredSessions = useDiscoveredSessions();
  const status = useSessionStatus();
  const { discoverSessions, stopDiscovery, joinSession } = useSessionActions();

  const isDiscovering = status === "discovering";

  /**
   * Sort sessions by signal strength
   */
  const sortedSessions = [...discoveredSessions].sort(
    (a, b) => b.signalStrength - a.signalStrength,
  );

  return {
    sessions: sortedSessions,
    isDiscovering,
    discover: discoverSessions,
    stopDiscovery,
    joinSession,
  };
}

/**
 * useMemberList Hook
 * Provides sorted and filtered member lists
 *
 * @example
 * const { members, hostMember, clientMembers } = useMemberList();
 */
export function useMemberList() {
  const members = useMembers();
  const isHost = useIsHost();

  /**
   * Sort members: host first, then by join time
   */
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === "host") return -1;
    if (b.role === "host") return 1;
    return a.joinedAt - b.joinedAt;
  });

  const hostMember = members.find((m) => m.role === "host");
  const clientMembers = members.filter((m) => m.role === "client");
  const connectedMembers = members.filter(
    (m) => m.connectionStatus === "connected",
  );

  return {
    members: sortedMembers,
    hostMember,
    clientMembers,
    connectedMembers,
    totalCount: members.length,
    clientCount: clientMembers.length,
    isHost,
  };
}

/**
 * useSessionInfo Hook
 * Provides formatted session information
 *
 * @example
 * const { sessionName, memberCountText, duration } = useSessionInfo();
 */
export function useSessionInfo() {
  const session = useCurrentSession();
  const members = useMembers();

  if (!session) {
    return {
      sessionName: null,
      memberCountText: "0 members",
      duration: null,
      durationText: "0s",
    };
  }

  const duration = Date.now() - session.createdAt;
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  let durationText = "";
  if (hours > 0) {
    durationText = `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    durationText = `${minutes}m`;
  } else {
    durationText = `${seconds}s`;
  }

  const memberCountText = `${members.length} member${members.length !== 1 ? "s" : ""}`;

  return {
    sessionName: session.name,
    memberCountText,
    duration,
    durationText,
  };
}

// Re-export all store hooks for convenience
export * from "../state";
