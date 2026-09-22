import { JwtPayload } from 'jsonwebtoken';
export interface IJwtPayload extends JwtPayload{
  userId: string;
}
export interface ServerToClientEvents{
  message: (data: { sender: string; content: string; createdAt: Date; room?: string }) => void;
  error: (msg: string) => void;
}
export interface ClientToServerEvents{
  joinRoom: (room: string) => void;
  sendMessage: (data: { room: string; content: string }) => void;
  sendDirectMessage: (data: { toUsername: string; content: string }) => void;
}

export interface InterServerEvents{
  ping: () => void;
}

export interface SocketData{
  userId: string;
}
