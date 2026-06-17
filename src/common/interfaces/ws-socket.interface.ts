import { Socket } from 'socket.io';

/**
 * WebSocket authenticated user interface.
 * 
 * Represents a user authenticated via WebSocket connection.
 * Contains user information extracted from JWT token.
 * 
 * **Key Properties:**
 * - `id`: String representation of user ID (for WebSocket operations)
 * - `dbId`: Original database ID as BigInt (for database queries)
 * - Other user profile information (email, name, role)
 * 
 * @example
 * ```typescript
 * const user: WsAuthenticatedUser = {
 *   id: "123",
 *   dbId: 123n,
 *   email: "user@example.com",
 *   fullName: "John Doe",
 *   role: UserRole.USER
 * };
 * ```
 */
export interface WsAuthenticatedUser {
  /** String representation of user ID (used in WebSocket room names and client communication) */
  id: string;
  /** Original database ID as BigInt (used for database queries and Prisma operations) */
  dbId: bigint;
  /** User email address */
  email: string;
  /** User full name */
  /** User full name */
  fullName: string;
}

/**
 * Authenticated Socket.IO socket interface.
 * 
 * Extends Socket.IO's Socket interface with user information and connection metadata.
 * This interface provides type safety for WebSocket operations and ensures that
 * authenticated sockets always have user information available.
 * 
 * **Key Features:**
 * - User authentication information
 * - Room membership tracking
 * - Activity monitoring (lastActivity, connectionTime)
 * - Type-safe WebSocket operations
 * 
 * @example
 * ```typescript
 * // In WebSocket gateway
 * @WebSocketGateway()
 * export class ChatGateway {
 *   @SubscribeMessage('message')
 *   handleMessage(client: AuthenticatedSocket, payload: MessageDto) {
 *     // client.user is guaranteed to exist
 *     const userId = client.user.dbId;
 *     const userName = client.user.fullName;
 *     // ...
 *   }
 * }
 * ```
 */
export interface AuthenticatedSocket extends Socket {
  /** Authenticated user information (set during WebSocket authentication) */
  user: WsAuthenticatedUser;
  /** Set of room names the socket has joined (for efficient room management) */
  joinedRooms: Set<string>;
  /** Timestamp of last activity (updated on each message/event) */
  lastActivity: Date;
  /** Timestamp of connection establishment (set when socket connects) */
  connectionTime: Date;
}

/**
 * WebSocket room types.
 * 
 * Defines the types of rooms available in the WebSocket system.
 */
export enum WsRoomType {
  /** User-specific room */
  USER = 'user',
  /** Conversation-specific room */
  CONVERSATION = 'conversation',
}

/**
 * WebSocket room utility functions.
 * 
 * Provides helper functions for creating and parsing room names.
 */
export const WsRoomUtils = {
  /**
   * Creates a user room name.
   * 
   * @param userId - User ID (string or bigint)
   * @returns Room name in format "user:{userId}"
   */
  userRoom: (userId: string | bigint): string => `user:${userId.toString()}`,
  
  /**
   * Creates a conversation room name.
   * 
   * @param conversationId - Conversation ID (string or bigint)
   * @returns Room name in format "conversation:{conversationId}"
   */
  conversationRoom: (conversationId: string | bigint): string =>
    `conversation:${conversationId.toString()}`,
  
  /**
   * Parses a room name into type and ID.
   * 
   * @param roomName - Room name (e.g., "user:123" or "conversation:456")
   * @returns Object with type and id, or null if invalid format
   */
  parseRoom: (roomName: string): { type: WsRoomType; id: string } | null => {
    const [type, id] = roomName.split(':');
    if (!type || !id) return null;
    return { type: type as WsRoomType, id };
  },
};

/**
 * WebSocket connection metadata interface.
 * 
 * Stores metadata about a WebSocket connection for monitoring and debugging.
 */
export interface WsConnectionMetadata {
  /** Socket.IO socket ID */
  socketId: string;
  /** User ID */
  userId: string;
  /** Connection timestamp */
  connectedAt: Date;
  /** Last activity timestamp */
  lastActivity: Date;
  /** Optional user agent string */
  userAgent?: string;
  /** Optional IP address */
  ipAddress?: string;
}

/**
 * WebSocket event names enumeration.
 * 
 * Defines all WebSocket event names used in the application for type safety.
 */
export enum WsEventName {
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  AUTH_SUCCESS = 'auth:success',
  AUTH_ERROR = 'auth:error',

  MESSAGE_NEW = 'message:new',
  MESSAGE_SENT = 'message:sent',
  MESSAGE_DELIVERED = 'message:delivered',
  MESSAGE_READ = 'message:read',
  MESSAGE_READ_ACK = 'message:read:ack',

  TYPING_START = 'typing:start',
  TYPING_STOP = 'typing:stop',
  USER_TYPING = 'user:typing',

  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',
  PRESENCE_UPDATE = 'presence:update',

  CONVERSATION_NEW = 'conversation:new',
  CONVERSATION_UPDATE = 'conversation:update',
  CONVERSATION_BLOCKED = 'conversation:blocked',
  CONVERSATION_UNBLOCKED = 'conversation:unblocked',
  CONVERSATION_DELETED = 'conversation:deleted',

  JOIN_CONVERSATION = 'join:conversation',
  LEAVE_CONVERSATION = 'leave:conversation',
  ROOM_JOINED = 'room:joined',
  ROOM_LEFT = 'room:left',

  HEARTBEAT = 'heartbeat',
  HEARTBEAT_ACK = 'heartbeat:ack',
  RATE_LIMITED = 'rate:limited',
}

/**
 * WebSocket acknowledgment callback type.
 * 
 * Callback function for WebSocket events that support acknowledgment.
 * 
 * @template T - Type of the response data
 */
export type WsAckCallback<T = unknown> = (response: WsResponse<T>) => void;

/**
 * WebSocket response interface.
 * 
 * Standardized format for WebSocket responses (success or error).
 * 
 * @template T - Type of the response data
 */
export interface WsResponse<T = unknown> {
  /** Whether the operation was successful */
  success: boolean;
  /** Response data (for success responses) */
  data?: T;
  /** Error message (for error responses) */
  error?: string;
  /** ISO timestamp of the response */
  timestamp: string;
}

/**
 * Creates a standardized WebSocket success response.
 * 
 * @template T - Type of the response data
 * @param data - Response data
 * @returns Standardized success response object
 */
export const createWsSuccessResponse = <T>(data: T): WsResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

/**
 * Creates a standardized WebSocket error response.
 * 
 * @param error - Error message
 * @returns Standardized error response object
 */
export const createWsErrorResponse = (error: string): WsResponse<null> => ({
  success: false,
  error,
  timestamp: new Date().toISOString(),
});



