import type {
  Comment,
  Conversation,
  Like,
  Message,
  Notification,
  Post,
  Save,
  User,
  Follow,
} from '@prisma/client';

export type {
  Comment,
  Conversation,
  Like,
  Message,
  Notification,
  Post,
  Save,
  User,
  Follow,
} from '@prisma/client';

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

// --- Composite types (Prisma model + relations) ---

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

export interface HasUsers {
  users: User[];
}
export interface HasOtherUser {
  otherUser: User;
}
