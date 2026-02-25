import type { SafeUser } from '../modules/publicUser.js';
import type { Socket } from 'socket.io';

export interface SocketWithUser extends Socket {
  user: SafeUser;
}
