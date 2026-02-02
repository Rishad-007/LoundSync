/**
 * Type declarations for react-native-zeroconf
 */

declare module 'react-native-zeroconf' {
  export class Zeroconf {
    scan(type: string, domain: string, timeout: number): void;
    stop(): void;
    on(event: 'found' | 'lost' | 'error', callback: (key: string, result: any) => void): void;
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
