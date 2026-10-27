"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "./authStore";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  // RULE 3: Acknowledgments — function to send with custom "Got it!" logic
  emitWithAck: (event: string, data: any) => Promise<any>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: [],
  emitWithAck: async () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { accessToken, isAuthenticated } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    // RULE 4: Security (The "ID Card") — Only connect if authenticated
    if (!isAuthenticated || !accessToken) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketInstance = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001/chat",
      {
        auth: { token: accessToken },
        transports: ["websocket"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      },
    );

    socketInstance.on("connect", () => {
      console.log("🎬 Socket.IO Connected Successfully");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on("userOnline", ({ userId }) => {
      setOnlineUsers((prev) => [...new Set([...prev, userId])]);
    });

    socketInstance.on("userOffline", ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    // RULE 3: Handling "Ghost" Disconnects — listening for acks from server
    socketInstance.on("error", (err) => {
      console.error("❌ Socket Error:", err.message);

      // If the token is invalid, the user record might be gone or secret changed
      // Logout to force a fresh session
      if (
        err.message === "Invalid token. Connection refused." ||
        err.message === "Authentication required."
      ) {
        const { logout } = useAuthStore.getState();
        logout();
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [accessToken, isAuthenticated]);

  // RULE 3 helper: Send message and wait for "Got it!" (Ack)
  const emitWithAck = useCallback(
    (event: string, data: any) => {
      return new Promise((resolve, reject) => {
        if (!socket) return reject("Socket not connected");

        // Timeout if server doesn't respond — Rule 3 safety
        const timeout = setTimeout(() => {
          reject("Server acknowledgment timeout — Rule 3 fail");
        }, 5000);

        socket.emit(event, data, (response: any) => {
          clearTimeout(timeout);
          if (response?.error) reject(response.error);
          else resolve(response);
        });
      });
    },
    [socket],
  );

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, onlineUsers, emitWithAck }}
    >
      {children}
    </SocketContext.Provider>
  );
};
