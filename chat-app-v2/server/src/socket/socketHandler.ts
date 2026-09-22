import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types';
import Message from '../models/Message';
import User from '../models/User';

export const setupSocketHandlers = (io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
  io.on('connection', (socket) => {
    
    socket.on('joinRoom', (room) => {
      socket.join(room);
    });

    socket.on('sendMessage', async (data) => {
      try {
        const user = await User.findById(socket.data.userId);
        if (!user) {
          socket.emit('error', 'User not found');
          return;
        }

        const newMessage = new Message({
          room: data.room,
          sender: user.username,
          content: data.content
        });

        await newMessage.save();

        io.to(data.room).emit('message', {
          sender: user.username,
          content: data.content,
          createdAt: newMessage.createdAt
        });
      } catch (err) {
        socket.emit('error', 'Failed to send message');
      }
    });

    socket.on('disconnect', () => {
      // Handle disconnect if needed
    });
  });
};
