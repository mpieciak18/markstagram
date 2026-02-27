// --- Prisma Model Types ---
// These mirror the Prisma schema models. Defined here so shared-types
// doesn't depend on a generated Prisma client.

export interface User {
  id: number;
  createdAt: Date;
  email: string;
  username: string;
  password: string;
  name: string;
  bio: string | null;
  image: string | null;
}

export interface Follow {
  id: number;
  createdAt: Date;
  giverId: number;
  receiverId: number;
}

export interface Post {
  id: number;
  createdAt: Date;
  image: string;
  caption: string;
  userId: number;
}

export interface Comment {
  id: number;
  createdAt: Date;
  message: string;
  userId: number;
  postId: number;
}

export interface Like {
  id: number;
  createdAt: Date;
  userId: number;
  postId: number;
}

export interface Save {
  id: number;
  createdAt: Date;
  userId: number;
  postId: number;
}

export interface Conversation {
  id: number;
  createdAt: Date;
}

export interface Message {
  id: number;
  createdAt: Date;
  message: string;
  senderId: number;
  conversationId: number;
}

export interface Notification {
  id: number;
  createdAt: Date;
  userId: number;
  otherUserId: number;
  postId: number | null;
  type: string;
  read: boolean;
}

// --- Auth / User ---

export interface NewUserBody {
  email: string;
  username: string;
  password: string;
  name: string;
}

export interface UserUpdateData {
  email?: string;
  username?: string;
  password?: string;
  name?: string;
  image?: string;
  bio?: string;
}

// --- Posts ---

export interface PostUpdateData {
  id?: number;
  caption?: string;
}

export interface PostStatsCount {
  _count: {
    comments: number;
    likes: number;
  };
}

export interface UserStatsCount {
  _count: {
    posts: number;
    receivedFollows: number;
    givenFollows: number;
  };
}

// --- Composite types (model + relations) ---

export interface SaveFromPost extends Save {
  post: Post & PostStatsCount;
}

export interface NotificationWithOtherUser extends Notification {
  otherUser: User;
}

export interface CommentWithUser extends Comment {
  user: User;
}

export interface LikeWithUser extends Like {
  user: User;
}

export interface UserConversation extends Conversation {
  users: User[];
  messages: Message[];
}

// --- Notifications ---

export interface NewNotificationData {
  userId: number;
  otherUserId: number;
  type: string;
  read: boolean;
  postId?: number;
}

// --- Misc shared ---

export interface MayHaveImage {
  image: string;
}

export interface HasUsers {
  users: User[];
}

export interface SocketMessage {
  id: string;
  message: string;
}

export interface SocketMessageErr {
  message: string;
}

export interface SyncErr extends Error {
  type?: string;
}

export interface HasOtherUser {
  otherUser: User;
}

export * from './realtime.js';
