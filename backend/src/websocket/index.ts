import { WebSocketServer, WebSocket } from 'ws';

/**
 * WebSocket Server Setup
 *
 * Provides real-time updates for:
 * - Activity feed
 * - Offer updates
 * - Floor price changes
 * - New listings
 */

interface Client {
  ws: WebSocket;
  rooms: Set<string>;
  id: string;
}

const clients: Map<string, Client> = new Map();
const rooms: Map<string, Set<string>> = new Map(); // roomId -> clientIds

export function setupWebSocket(wss: WebSocketServer) {
  console.log('✅ WebSocket server initialized');

  wss.on('connection', (ws: WebSocket, req) => {
    const clientId = generateClientId();
    const path = req.url || '/';

    console.log(`WebSocket client connected: ${clientId} (${path})`);

    const client: Client = {
      ws,
      rooms: new Set(),
      id: clientId,
    };

    clients.set(clientId, client);

    // Parse room from URL path
    // Examples:
    // - /ws/activity/nft/abc123
    // - /ws/activity/collection/xyz789
    // - /ws/offers/nft/abc123
    const pathParts = path.split('/').filter(Boolean);

    if (pathParts.length >= 3) {
      const roomType = pathParts[1]; // 'activity' or 'offers'
      const entityType = pathParts[2]; // 'nft' or 'collection'
      const entityId = pathParts[3]; // actual ID

      const roomId = `${entityType}:${entityId}`;
      joinRoom(clientId, roomId);

      console.log(`Client ${clientId} joined room: ${roomId}`);
    }

    // Handle messages from client
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        handleClientMessage(clientId, message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      console.log(`WebSocket client disconnected: ${clientId}`);
      handleClientDisconnect(clientId);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
    });

    // Send welcome message
    send(ws, {
      type: 'connected',
      clientId,
      timestamp: Date.now(),
    });
  });

  // Heartbeat to detect broken connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if ((ws as any).isAlive === false) {
        return ws.terminate();
      }

      (ws as any).isAlive = false;
      ws.ping();
    });
  }, 30000); // 30 seconds

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}

/**
 * Handle messages from clients
 */
function handleClientMessage(clientId: string, message: any) {
  const client = clients.get(clientId);
  if (!client) return;

  switch (message.type) {
    case 'subscribe':
      // Subscribe to a room
      if (message.room) {
        joinRoom(clientId, message.room);
        send(client.ws, {
          type: 'subscribed',
          room: message.room,
        });
      }
      break;

    case 'unsubscribe':
      // Unsubscribe from a room
      if (message.room) {
        leaveRoom(clientId, message.room);
        send(client.ws, {
          type: 'unsubscribed',
          room: message.room,
        });
      }
      break;

    case 'ping':
      // Respond to ping
      send(client.ws, { type: 'pong' });
      break;

    default:
      console.warn(`Unknown message type: ${message.type}`);
  }
}

/**
 * Handle client disconnect
 */
function handleClientDisconnect(clientId: string) {
  const client = clients.get(clientId);
  if (!client) return;

  // Leave all rooms
  client.rooms.forEach((roomId) => {
    leaveRoom(clientId, roomId);
  });

  // Remove client
  clients.delete(clientId);
}

/**
 * Join a room
 */
function joinRoom(clientId: string, roomId: string) {
  const client = clients.get(clientId);
  if (!client) return;

  client.rooms.add(roomId);

  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }

  rooms.get(roomId)!.add(clientId);
}

/**
 * Leave a room
 */
function leaveRoom(clientId: string, roomId: string) {
  const client = clients.get(clientId);
  if (!client) return;

  client.rooms.delete(roomId);

  const room = rooms.get(roomId);
  if (room) {
    room.delete(clientId);

    // Clean up empty rooms
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  }
}

/**
 * Broadcast message to all clients in a room
 */
export function broadcastToRoom(roomId: string, message: any) {
  const room = rooms.get(roomId);
  if (!room) {
    console.log(`No clients in room: ${roomId}`);
    return;
  }

  console.log(`Broadcasting to room ${roomId} (${room.size} clients)`);

  room.forEach((clientId) => {
    const client = clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      send(client.ws, {
        ...message,
        room: roomId,
        timestamp: Date.now(),
      });
    }
  });
}

/**
 * Broadcast to all connected clients
 */
export function broadcast(message: any) {
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      send(client.ws, {
        ...message,
        timestamp: Date.now(),
      });
    }
  });
}

/**
 * Send message to a specific WebSocket
 */
function send(ws: WebSocket, message: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Generate unique client ID
 */
function generateClientId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get room statistics
 */
export function getRoomStats() {
  const stats: any = {};

  rooms.forEach((clientIds, roomId) => {
    stats[roomId] = clientIds.size;
  });

  return {
    totalClients: clients.size,
    totalRooms: rooms.size,
    rooms: stats,
  };
}
