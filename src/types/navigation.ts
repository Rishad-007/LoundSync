/**
 * Navigation types for LOUDSYNC
 * Provides type-safe navigation params across the app
 */

export type RootStackParamList = {
  index: undefined;
  home: undefined;
  "create-session": undefined;
  "join-session": undefined;
  "player-room": {
    sessionId: string;
    sessionName: string;
    isHost: boolean;
  };
  modal: undefined;
};

export type ModalStackParamList = {
  "device-list": {
    sessionId?: string;
  };
};

// Helper type for navigation props
export type NavigationParams<T extends keyof RootStackParamList> =
  RootStackParamList[T];
