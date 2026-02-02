/**
 * Type declarations for react-native-udp
 */

declare module "react-native-udp" {
  export interface DatagramSocket {
    bind(port: number, address: string, callback?: () => void): void;
    setBroadcast(flag: boolean): void;
    send(
      buffer: Buffer,
      offset: number,
      length: number,
      port: number,
      address: string,
      callback?: (error?: Error) => void,
    ): void;
    on(event: "message", callback: (msg: Buffer, rinfo: any) => void): void;
    on(event: "error", callback: (error: Error) => void): void;
    close(): void;
  }

  export default class UDP {
    constructor(options: { type: "udp4" | "udp6" }): DatagramSocket;
    static createSocket(options: { type: "udp4" | "udp6" }): DatagramSocket;
  }
}
