import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { IJwtPayload, SocketData } from '../types';

export const socketAuthMiddleware = (socket: Socket<any, any, any, SocketData>, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token || socket.handshake.headers['token'];

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as IJwtPayload;
    socket.data.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
};
