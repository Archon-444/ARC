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

type ClientMessage = {
  type?: string;
  room?: unknown;
  data?: {
    room?: unknown;
  };
};

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
    (ws as any).isAlive = true;

    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    // Parse room from URL path
    // Examples:
    // - /ws/activity/nft/abc123
    // - /ws/activity/collection/xyz789
    // - /ws/offers/nft/abc123
    // - /ws/token/0xabc123
    const pathRoom = roomFromPathParts(path.split('/').filter(Boolean));

    if (pathRoom) {
      const roomId = joinRoom(clientId, pathRoom);
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
function handleClientMessage(clientId: string, message: ClientMessage) {
  const client = clients.get(clientId);
  if (!client) return;

  switch (message.type) {
    case 'subscribe': {
      const room = extractRoom(message);
      if (room) {
        const normalizedRoom = joinRoom(clientId, room);
        send(client.ws, {
          type: 'subscribed',
          room: normalizedRoom,
        });
      }
      break;
    }

    case 'unsubscribe': {
      const room = extractRoom(message);
      if (room) {
        const normalizedRoom = leaveRoom(clientId, room);
        send(client.ws, {
          type: 'unsubscribed',
          room: normalizedRoom,
        });
      }
      break;
    }

    case 'ping':
      // Respond to ping
      send(client.ws, { type: 'pong' });
      break;

    default:
      console.warn(`Unknown message type: ${message.type}`);
  }
}

function roomFromPathParts(pathParts: string[]): string | null {
  if (pathParts.length < 2) return null;

  const [, first, second, third] = pathParts;

  if (first === 'token' && second) {
    return `token:${second}`;
  }

  if ((first === 'activity' || first === 'offers') && second && third) {
    return `${second}:${third}`;
  }

  if ((first === 'user' || first === 'collection' || first === 'nft') && second) {
    return `${first}:${second}`;
  }

  return null;
}

function extractRoom(message: ClientMessage): string | null {
  const rawRoom = message.room ?? message.data?.room;
  return typeof rawRoom === 'string' ? rawRoom : null;
}

function normalizeRoomId(roomId: string): string {
  const normalizedPathRoom = normalizePathRoom(roomId);
  return normalizedPathRoom.toLowerCase();
}

function normalizePathRoom(roomId: string): string {
  const parts = roomId.split('/').filter(Boolean);
  if (parts.length === 0) {
    return roomId;
  }

  if (parts[0] === 'activity' || parts[0] === 'offers') {
    const entityType = parts[1];
    const entityId = parts[2];
    if (entityType && entityId) {
      return `${entityType}:${entityId}`;
    }
  }

  if (parts[0] === 'token' && parts[1]) {
    return `token:${parts[1]}`;
  }

  if ((parts[0] === 'user' || parts[0] === 'collection' || parts[0] === 'nft') && parts[1]) {
    return `${parts[0]}:${parts[1]}`;
  }

  return roomId;
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
function joinRoom(clientId: string, roomId: string): string {
  const client = clients.get(clientId);
  const normalizedRoomId = normalizeRoomId(roomId);
  if (!client) return normalizedRoomId;

  client.rooms.add(normalizedRoomId);

  if (!rooms.has(normalizedRoomId)) {
    rooms.set(normalizedRoomId, new Set());
  }

  rooms.get(normalizedRoomId)!.add(clientId);
  return normalizedRoomId;
}

/**
 * Leave a room
 */
function leaveRoom(clientId: string, roomId: string): string {
  const client = clients.get(clientId);
  const normalizedRoomId = normalizeRoomId(roomId);
  if (!client) return normalizedRoomId;

  client.rooms.delete(normalizedRoomId);

  const room = rooms.get(normalizedRoomId);
  if (room) {
    room.delete(clientId);

    // Clean up empty rooms
    if (room.size === 0) {
      rooms.delete(normalizedRoomId);
    }
  }

  return normalizedRoomId;
}

/**
 * Broadcast message to all clients in a room
 */
export function broadcastToRoom(roomId: string, message: any) {
  const normalizedRoomId = normalizeRoomId(roomId);
  const room = rooms.get(normalizedRoomId);
  if (!room) {
    console.log(`No clients in room: ${normalizedRoomId}`);
    return;
  }

  console.log(`Broadcasting to room ${normalizedRoomId} (${room.size} clients)`);

  room.forEach((clientId) => {
    const client = clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      send(client.ws, {
        ...message,
        room: normalizedRoomId,
        timestamp: Date.now(),
      });
    }
  });
}

/**
 * Broadcast a token activity event to subscribers of `token:<address>` room.
 * Called by POST /v1/activity/token/broadcast when a trade/graduation occurs.
 */
export function broadcastTokenActivity(tokenAddress: string, data: Record<string, unknown>) {
  const roomId = `token:${tokenAddress}`;
  broadcastToRoom(roomId, { type: 'token_activity', ...data });
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
