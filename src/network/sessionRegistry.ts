/**
 * Session Registry
 * In-memory store for active sessions (host-side only)
 * Tracks session codes and validates guest access
 */

interface ActiveSession {
  sessionId: string;
  sessionCode: string; // XXX-XXX format
  sessionName: string;
  hostId: string;
  hostName: string;
  createdAt: number;
  expiresAt: number;
  members: Set<string>;
  maxMembers: number;
}

class SessionRegistry {
  private activeSessions: Map<string, ActiveSession> = new Map();
  private sessionCodeMap: Map<string, string> = new Map(); // code -> sessionId
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Start periodic cleanup of expired sessions
    this.startCleanup();
  }

  /**
   * Register a new session
   */
  registerSession(params: {
    sessionId: string;
    sessionCode: string;
    sessionName: string;
    hostId: string;
    hostName: string;
    maxMembers?: number;
  }): void {
    const {
      sessionId,
      sessionCode,
      sessionName,
      hostId,
      hostName,
      maxMembers = 10,
    } = params;

    // Clean the code (remove dashes)
    const cleanCode = sessionCode.replace(/-/g, "").toUpperCase();

    const session: ActiveSession = {
      sessionId,
      sessionCode: cleanCode,
      sessionName,
      hostId,
      hostName,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      members: new Set([hostId]),
      maxMembers,
    };

    this.activeSessions.set(sessionId, session);
    this.sessionCodeMap.set(cleanCode, sessionId);

    console.log(
      `[SessionRegistry] Registered session: ${sessionId} (${cleanCode})`,
    );
  }

  /**
   * Validate a session code
   */
  validateSessionCode(code: string): {
    valid: boolean;
    sessionId?: string;
    sessionName?: string;
    reason?: string;
  } {
    const cleanCode = code.replace(/-/g, "").toUpperCase();

    // Check if code exists
    const sessionId = this.sessionCodeMap.get(cleanCode);
    if (!sessionId) {
      return { valid: false, reason: "Invalid session code" };
    }

    // Check if session still active
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      this.sessionCodeMap.delete(cleanCode);
      return { valid: false, reason: "Session no longer exists" };
    }

    // Check if session expired
    if (Date.now() > session.expiresAt) {
      this.removeSession(sessionId);
      return { valid: false, reason: "Session has expired" };
    }

    // Check if session is full
    if (session.members.size >= session.maxMembers) {
      return { valid: false, reason: "Session is full" };
    }

    return {
      valid: true,
      sessionId: session.sessionId,
      sessionName: session.sessionName,
    };
  }

  /**
   * Add a member to a session
   */
  addMember(sessionId: string, memberId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    if (session.members.size >= session.maxMembers) {
      return false;
    }

    session.members.add(memberId);
    return true;
  }

  /**
   * Remove a member from a session
   */
  removeMember(sessionId: string, memberId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.members.delete(memberId);

    // If host leaves, remove session
    if (memberId === session.hostId) {
      this.removeSession(sessionId);
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): ActiveSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get session by code
   */
  getSessionByCode(code: string): ActiveSession | undefined {
    const cleanCode = code.replace(/-/g, "").toUpperCase();
    const sessionId = this.sessionCodeMap.get(cleanCode);
    if (!sessionId) return undefined;
    return this.activeSessions.get(sessionId);
  }

  /**
   * Remove a session
   */
  removeSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      this.sessionCodeMap.delete(session.sessionCode);
      this.activeSessions.delete(sessionId);
      console.log(`[SessionRegistry] Removed session: ${sessionId}`);
    }
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): ActiveSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get all active (non-expired) sessions
   * Useful for discovery simulation
   */
  getAllActiveSessions(): ActiveSession[] {
    const now = Date.now();
    return Array.from(this.activeSessions.values()).filter(
      (session) => now <= session.expiresAt,
    );
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const expired: string[] = [];

      this.activeSessions.forEach((session, sessionId) => {
        if (now > session.expiresAt) {
          expired.push(sessionId);
        }
      });

      expired.forEach((sessionId) => this.removeSession(sessionId));

      if (expired.length > 0) {
        console.log(
          `[SessionRegistry] Cleaned up ${expired.length} expired sessions`,
        );
      }
    }, 60000); // Check every minute
  }

  /**
   * Stop cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.activeSessions.clear();
    this.sessionCodeMap.clear();
  }
}

/**
 * Singleton instance
 */
export const sessionRegistry = new SessionRegistry();
