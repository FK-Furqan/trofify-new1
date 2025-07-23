import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    // Temporarily disable Socket.IO to prevent connection errors
    // TODO: Re-enable when backend Socket.IO server is properly configured
    console.log('Socket.IO disabled - using mock implementation');
    
    // Return a mock socket object
    socket = {
      emit: () => {},
      on: () => {},
      off: () => {},
      connected: false,
      disconnect: () => {},
      connect: () => {}
    } as any;
    
    // Uncomment when Socket.IO backend is ready:
    // socket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5000", {
    //   transports: ["websocket"],
    // });
  }
  return socket;
} 