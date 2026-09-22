import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/auth';
import { socketAuthMiddleware } from './socket/socketMiddleware';
import { setupSocketHandlers } from './socket/socketHandler';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from './types';

dotenv.config({ path: __dirname + '/../../.env' });

const app = express();
const server = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
  cors: {
    origin: '*',
  },
  transports: ['websocket']
});

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

io.use(socketAuthMiddleware);
setupSocketHandlers(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
