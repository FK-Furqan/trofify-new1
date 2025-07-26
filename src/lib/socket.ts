import { io, Socket } from "socket.io-client";
import { getBackendUrl } from "./utils";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    try {
      socket = io(getBackendUrl(), {
        transports: ["websocket", "polling"],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket?.id);
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

    } catch (error) {
      console.error('Failed to initialize socket:', error);
      // Fallback to mock socket
      socket = {
        emit: () => {},
        on: () => {},
        off: () => {},
        connected: false,
        disconnect: () => {},
        connect: () => {}
      } as any;
    }
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
} 