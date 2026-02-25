import type { User } from '@markstagram/shared-types';
import type { Socket } from 'socket.io';

export interface SocketWithUser extends Socket {
  user: User;
}
