import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create socket connection
    const socketInstance = io(process.env.REACT_APP_SOCKET_URL || '', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    // Set up event listeners
    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('jobs', (data) => {
      console.log('Received jobs:', data);
      setJobs(data);
    });

    socketInstance.on('job_added', (job) => {
      setJobs((prevJobs) => [...prevJobs, job]);
    });

    socketInstance.on('job_removed', (data) => {
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== data.id));
    });

    socketInstance.on('job_state_changed', (data) => {
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === data.id ? { ...job, state: data.state } : job
        )
      );
    });

    // Save socket instance
    setSocket(socketInstance);

    // Clean up on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const value = {
    socket,
    jobs,
    isConnected,
    subscribeToJob: (jobId) => {
      if (socket) {
        socket.emit('subscribe_to_job', { id: jobId });
      }
    },
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}
