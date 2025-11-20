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

export type WebSocketEvent = 
  | { type: 'activity'; data: ActivityEvent }
  | { type: 'offer_created'; data: { offerId: string; nftId: string; price: string } }
  | { type: 'offer_accepted'; data: { offerId: string; nftId: string } }
  | { type: 'offer_cancelled'; data: { offerId: string; nftId: string } }
  | { type: 'connected'; data: { message: string } }
  | { type: 'error'; data: { message: string } }
  | { type: 'pong'; data: {} };

export type RoomType = 'nft' | 'collection';

export interface WebSocketOptions {
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
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

  constructor(url?: string, options?: WebSocketOptions) {
    this.url = url || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
    this.options = {
      autoReconnect: true,
      reconnectDelay: 2000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...options,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
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
   * Get connection status
   */
  get isConnected(): boolean {
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
      websocket.disconnect();
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

export { WebSocketClient };
