/**
 * WebSocket Client for Real-Time Updates
 * 
 * Connects to backend WebSocket server for:
 * - Real-time activity feed
 * - Offer notifications
 * - Collection updates
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_WS_URL: WebSocket URL (default: ws://localhost:3001/ws)
 * 
 * Usage:
 * ```typescript
 * import { websocket, useActivityFeed } from '@/services/websocket';
 * 
 * // In component
 * const { activities } = useActivityFeed('nft-id');
 * 
 * // Manual usage
 * websocket.subscribeToNFT('nft-id', (event) => {
 *   console.log('New activity:', event);
 * });
 * ```
 */

import { useEffect, useState, useRef } from 'react';
import type { ActivityEvent } from './api';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationEvent = {
  id: string;
  type: 'sale' | 'offer' | 'bid' | 'outbid' | 'listing_sold';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  link?: string;
  image?: string;
};

export type WebSocketEvent =
  | { type: 'activity'; data: ActivityEvent }
  | { type: 'notification'; data: NotificationEvent }
  | { type: 'offer_created'; data: { offerId: string; nftId: string; price: string } }
  | { type: 'offer_accepted'; data: { offerId: string; nftId: string } }
  | { type: 'offer_cancelled'; data: { offerId: string; nftId: string } }
  | { type: 'connected'; data: { message: string } }
  | { type: 'error'; data: { message: string } }
  | { type: 'pong'; data: {} };

export type RoomType = 'nft' | 'collection' | 'user';

export interface WebSocketOptions {
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  mockMode?: boolean; // Enable mock mode for testing
}

// ============================================================================
// WEBSOCKET CLIENT
// ============================================================================

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private options: Required<WebSocketOptions>;
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private subscribers = new Map<string, Set<(event: WebSocketEvent) => void>>();
  private rooms = new Set<string>();
  private mockInterval: NodeJS.Timeout | null = null;

  constructor(url?: string, options?: WebSocketOptions) {
    this.url = url || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
    this.options = {
      autoReconnect: true,
      reconnectDelay: 2000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      mockMode: !process.env.NEXT_PUBLIC_WS_URL, // Default to mock if no URL
      ...options,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.options.mockMode) {
        console.log('[WebSocket] Starting in MOCK mode');
        this.startMockGenerator();
        resolve();
        return;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();

          // Re-subscribe to all rooms
          this.rooms.forEach(room => {
            this.send({ type: 'subscribe', data: { room } });
          });

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketEvent = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          this.stopHeartbeat();

          if (this.options.autoReconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.stopHeartbeat();
    this.stopMockGenerator();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send message to server
   */
  private send(message: { type: string; data: unknown }): void {
    if (this.options.mockMode) return;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message: not connected');
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WebSocketEvent): void {
    // Notify all subscribers
    this.subscribers.get('*')?.forEach(callback => callback(message));

    // Notify type-specific subscribers
    this.subscribers.get(message.type)?.forEach(callback => callback(message));

    // Handle room-specific messages
    if (message.type === 'activity' || message.type.startsWith('offer_')) {
      const nftId = (message.data as { nftId?: string }).nftId;
      if (nftId) {
        this.subscribers.get(`nft:${nftId}`)?.forEach(callback => callback(message));
      }
    }

    if (message.type === 'notification') {
      // Notifications are usually user-specific, handled by subscribeToUser
      // But we can also broadcast to general notification listeners if needed
      this.subscribers.get('notification')?.forEach(callback => callback(message));
    }
  }

  /**
   * Subscribe to events
   */
  subscribe(event: string, callback: (event: WebSocketEvent) => void): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(event)?.delete(callback);
    };
  }

  /**
   * Subscribe to NFT activity
   */
  subscribeToNFT(nftId: string, callback: (event: WebSocketEvent) => void): () => void {
    const room = `activity/nft/${nftId}`;

    if (!this.rooms.has(room)) {
      this.rooms.add(room);
      this.send({ type: 'subscribe', data: { room } });
    }

    return this.subscribe(`nft:${nftId}`, callback);
  }

  /**
   * Subscribe to collection activity
   */
  subscribeToCollection(collectionId: string, callback: (event: WebSocketEvent) => void): () => void {
    const room = `activity/collection/${collectionId}`;

    if (!this.rooms.has(room)) {
      this.rooms.add(room);
      this.send({ type: 'subscribe', data: { room } });
    }

    return this.subscribe(`collection:${collectionId}`, callback);
  }

  /**
   * Subscribe to user notifications
   */
  subscribeToUser(address: string, callback: (event: WebSocketEvent) => void): () => void {
    const room = `user/${address}`;

    if (!this.rooms.has(room)) {
      this.rooms.add(room);
      this.send({ type: 'subscribe', data: { room } });
    }

    // Subscribe to generic 'notification' events which will be filtered/routed here in a real app
    // For now, we just use the 'notification' event type
    return this.subscribe('notification', callback);
  }

  /**
   * Subscribe to offer updates for NFT
   */
  subscribeToOffers(nftId: string, callback: (event: WebSocketEvent) => void): () => void {
    const room = `offers/nft/${nftId}`;

    if (!this.rooms.has(room)) {
      this.rooms.add(room);
      this.send({ type: 'subscribe', data: { room } });
    }

    return this.subscribe(`nft:${nftId}`, callback);
  }

  /**
   * Unsubscribe from room
   */
  private unsubscribeFromRoom(room: string): void {
    if (this.rooms.has(room)) {
      this.rooms.delete(room);
      this.send({ type: 'unsubscribe', data: { room } });
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping', data: {} });
    }, this.options.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    const delay = this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts);

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.options.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(() => {
        // Will retry again if autoReconnect is enabled
      });
    }, delay);
  }

  /**
   * Mock Data Generator
   */
  private startMockGenerator() {
    if (this.mockInterval) return;

    this.mockInterval = setInterval(() => {
      // 1. Mock Activity
      if (Math.random() > 0.7) {
        const activityEvent: WebSocketEvent = {
          type: 'activity',
          data: {
            id: `act-${Math.random()}`,
            type: ['sale', 'listing', 'offer', 'transfer', 'mint'][Math.floor(Math.random() * 5)] as any,
            nftId: `nft-${Math.floor(Math.random() * 100)}`,
            nftName: `Mock NFT #${Math.floor(Math.random() * 1000)}`,
            nftImage: `https://via.placeholder.com/100`,
            collectionName: 'Mock Collection',
            price: Math.random() > 0.5 ? `${(Math.random() * 100).toFixed(2)}` : undefined,
            timestamp: Date.now(),
            from: '0x123...abc',
            to: '0x456...def',
            txHash: '0x...'
          }
        };
        this.handleMessage(activityEvent);
      }

      // 2. Mock Notification
      if (Math.random() > 0.85) {
        const notificationEvent: WebSocketEvent = {
          type: 'notification',
          data: {
            id: Math.random().toString(36).substr(2, 9),
            type: ['sale', 'offer', 'bid'][Math.floor(Math.random() * 3)] as any,
            title: 'New Update',
            message: 'Something happened with your NFT',
            timestamp: Date.now(),
            read: false,
            image: `https://via.placeholder.com/100`,
          }
        };
        this.handleMessage(notificationEvent);
      }
    }, 5000);
  }

  private stopMockGenerator() {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    if (this.options.mockMode) return true;
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const websocket = new WebSocketClient();

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Hook to manage WebSocket connection
 */
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    websocket.connect()
      .then(() => setIsConnected(true))
      .catch(console.error);

    const checkInterval = setInterval(() => {
      setIsConnected(websocket.isConnected);
    }, 1000);

    return () => {
      clearInterval(checkInterval);
      // Don't disconnect on unmount as it's a singleton used by multiple components
      // websocket.disconnect(); 
    };
  }, []);

  return { isConnected };
}

/**
 * Hook to subscribe to NFT activity feed
 */
export function useActivityFeed(nftId: string) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    const unsubscribe = websocket.subscribeToNFT(nftId, (event) => {
      if (event.type === 'activity') {
        setActivities(prev => [event.data, ...prev].slice(0, 50)); // Keep last 50
      }
    });

    setIsLoading(false);

    return unsubscribe;
  }, [nftId]);

  return { activities, isLoading };
}

/**
 * Hook to subscribe to offer notifications
 */
export function useOfferNotifications(nftId: string) {
  const [offers, setOffers] = useState<Array<{ type: string; data: unknown }>>([]);

  useEffect(() => {
    const unsubscribe = websocket.subscribeToOffers(nftId, (event) => {
      if (event.type.startsWith('offer_')) {
        setOffers(prev => [...prev, event]);
      }
    });

    return unsubscribe;
  }, [nftId]);

  return { offers };
}

/**
 * Hook to subscribe to user notifications
 */
export function useUserNotifications(address?: string) {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!address) return;

    const unsubscribe = websocket.subscribeToUser(address, (event) => {
      if (event.type === 'notification') {
        setNotifications(prev => [event.data, ...prev].slice(0, 50));
        setUnreadCount(prev => prev + 1);
      }
    });

    return unsubscribe;
  }, [address]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}

export { WebSocketClient };
