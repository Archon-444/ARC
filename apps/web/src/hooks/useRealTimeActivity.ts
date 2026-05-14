/**
 * React Hook for Real-Time Activity Feed
 * Uses WebSocket service for live updates
 */

import { useState, useEffect } from 'react';
import websocketService, { Activity } from '../services/websocket';

const MAX_ACTIVITIES = 100;

export function useRealTimeActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe to WebSocket updates
    const unsubscribe = websocketService.subscribe((activity) => {
      setActivities(prev => {
        const updated = [activity, ...prev];
        // Keep only the most recent activities
        return updated.slice(0, MAX_ACTIVITIES);
      });
    });

    // Check connection status periodically
    const intervalId = setInterval(() => {
      setIsConnected(websocketService.isConnected());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  return {
    activities,
    isConnected,
  };
}

export default useRealTimeActivity;
