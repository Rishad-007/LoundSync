/**
 * Type declarations for react-native-zeroconf
 */

declare module "react-native-zeroconf" {
  export default class Zeroconf {
    scan(type: string, domain: string, timeout: number): void;
    stop(): void;
    on(event: "start" | "stop" | "update", callback: () => void): void;
    on(event: "found", callback: (name: string, result?: any) => void): void;
    on(event: "remove", callback: (name: string) => void): void;
    on(event: "resolved", callback: (result: any) => void): void;
    on(event: "error", callback: (err: any) => void): void;
    registerService(options: {
      name: string;
      type: string;
      domain: string;
      protocol: string;
      port: number;
      addresses: string[];
      txt: Record<string, string>;
    }): Promise<void>;
    unregisterService(options: {
      name: string;
      type: string;
      domain: string;
    }): Promise<void>;
  }
}
