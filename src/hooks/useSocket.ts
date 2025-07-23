import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { auth } from '../config/firebase';

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  error: string | null;
}

export const useSocket = (): UseSocketReturn => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        // Get authentication token
        let token = null;
        const user = auth.currentUser;
        
        if (user) {
          token = await user.getIdToken();
        } else {
          token = localStorage.getItem('authToken');
        }

        if (!token) {
          setError('No authentication token available');
          return;
        }

        // Initialize socket connection
        const socket = io('http://localhost:5002', {
          auth: {
            token
          },
          transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
          console.log('Connected to chat server');
          setConnected(true);
          setError(null);
          
          // Join user's channels
          socket.emit('join-channels');
        });

        socket.on('disconnect', () => {
          console.log('Disconnected from chat server');
          setConnected(false);
        });

        socket.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          setError(err.message);
          setConnected(false);
        });

        socketRef.current = socket;

      } catch (err: any) {
        console.error('Error initializing socket:', err);
        setError(err.message);
      }
    };

    initializeSocket();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    connected,
    error
  };
};