import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { getAccessToken } from '../api/client.js';

const SocketContext = createContext({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState(null);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = getAccessToken();
    const serverUrl = import.meta.env.VITE_WS_URL || window.location.origin.replace(':5173', ':5000');

    const newSocket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      console.log('⚡ Connected to Smart Budget WebSocket');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('WebSocket connection error:', err.message);
      setIsConnected(false);
    });

    // Global listener for urgent campus announcements
    newSocket.on('new_announcement', (announcement) => {
      setLiveAnnouncement(announcement);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {/* Real-time Broadcast Banner */}
      {liveAnnouncement && (
        <div className="fixed top-16 inset-x-0 z-50 p-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-lg flex items-center justify-between px-6 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              Live Campus Alert
            </span>
            <p className="text-sm font-semibold">
              <strong className="underline mr-1">{liveAnnouncement.title}:</strong>
              {liveAnnouncement.body}
            </p>
          </div>
          <button
            onClick={() => setLiveAnnouncement(null)}
            className="text-white/80 hover:text-white font-bold text-lg ml-4"
          >
            &times;
          </button>
        </div>
      )}
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
