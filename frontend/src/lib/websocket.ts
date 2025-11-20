/**
 * WebSocket Real-Time Updates
 *
 * Provides real-time activity feed and price updates
 * with automatic reconnection and error handling
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export interface ActivityEvent {
  type: 'sale' | 'listing' | 'offer' | 'transfer' | 'mint';
  nft: {
    id: string;
    name: string;
    image: string;
    collection: string;
  };
  price?: string;
  from?: string;
  to?: string;
  timestamp: number;
}

interface WebSocketMessage {
  type: 'activity' | 'price_update' | 'listing_update';
  data: any;
}

/**
 * Hook for real-time activity feed
 *
 * Connects to WebSocket server and receives live activity events
 * Features:
 * - Auto-reconnection on disconnect
 * - Activity deduplication
 * - Max 50 activities stored
 * - Mock data fallback when WS not available
 */
export function useRealtimeActivity() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      // Use environment variable or fallback to mock mode
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL;

      // If no WebSocket URL configured, use mock data
      if (!wsUrl) {
        console.log('WebSocket URL not configured, using mock data');
        setIsConnected(false);

        // Generate mock activity periodically
        const mockInterval = setInterval(() => {
          const mockActivity: ActivityEvent = {
            type: ['sale', 'listing', 'offer', 'transfer', 'mint'][Math.floor(Math.random() * 5)] as any,
            nft: {
              id: `nft-${Math.random()}`,
              name: `Mock NFT #${Math.floor(Math.random() * 1000)}`,
              image: `https://via.placeholder.com/100`,
              collection: 'Mock Collection',
            },
            price: Math.random() > 0.5 ? `${(Math.random() * 100).toFixed(2)}` : undefined,
            timestamp: Date.now(),
          };

          setActivities((prev) => [mockActivity, ...prev].slice(0, 50));
        }, 5000); // New mock activity every 5 seconds

        return () => clearInterval(mockInterval);
      }

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Subscribe to activity feed
        ws.send(JSON.stringify({ type: 'subscribe', channel: 'activity' }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === 'activity') {
            setActivities((prev) => {
              // Deduplicate by nft.id and timestamp
              const exists = prev.some(
                (a) =>
                  a.nft.id === message.data.nft.id &&
                  a.timestamp === message.data.timestamp
              );

              if (exists) return prev;

              return [message.data, ...prev].slice(0, 50);
            });
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;

          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.log('Max reconnection attempts reached. WebSocket will not reconnect automatically.');
        }
      };

      wsRef.current = ws;

      return () => {
        ws.close();
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);

      // Retry connection with exponential backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    }
  }, []);

  useEffect(() => {
    const cleanup = connect();

    return () => {
      if (cleanup) cleanup();
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { activities, isConnected };
}

/**
 * Hook for real-time price updates
 *
 * Subscribes to price updates for a specific NFT
 */
export function useRealtimePrice(nftId: string) {
  const [price, setPrice] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;

    // If no WebSocket URL, don't connect
    if (!wsUrl) {
      console.log('WebSocket URL not configured for price updates');
      return;
    }

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'subscribe',
          channel: 'price',
          nftId,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'price_update' && message.nftId === nftId) {
          setPrice(message.data.price);
        }
      } catch (error) {
        console.error('Failed to parse price update:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [nftId]);

  return price;
}

/**
 * Hook for real-time listing updates
 *
 * Subscribes to new listings in a collection
 */
export function useRealtimeListings(collectionAddress?: string) {
  const [listings, setListings] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!collectionAddress) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(
        JSON.stringify({
          type: 'subscribe',
          channel: 'listings',
          collectionAddress,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'listing_update') {
          setListings((prev) => [message.data, ...prev].slice(0, 20));
        }
      } catch (error) {
        console.error('Failed to parse listing update:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [collectionAddress]);

  return { listings, isConnected };
}
