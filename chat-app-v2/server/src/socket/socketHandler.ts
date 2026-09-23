import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types';
import Message from '../models/Message';
import User from '../models/User';

const getUniqueRoomId = (user1: string, user2: string) => {
    return [user1, user2].sort().join('_');
};

export const setupSocketHandlers = (io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
    io.on('connection', async (socket) => {
        try {
            const user = await User.findById(socket.data.userId);
            if (user) {
                socket.join(`user_${user.username}`);
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                socket.emit('error', `Connection error: ${error.message}`);
            }
        }

        socket.on('joinRoom', (room) => {
            socket.join(room);
        });

        socket.on('sendMessage', async (data) => {
            try {
                const senderUser = await User.findById(socket.data.userId);
                if (!senderUser) {
                    socket.emit('error', 'Authentication error: user not found');
                    return;
                }

                const newMessage = new Message({
                    room: data.room,
                    sender: senderUser.username,
                    content: data.content
                });
                await newMessage.save();

                io.to(data.room).emit('message', {
                    sender: senderUser.username,
                    content: data.content,
                    createdAt: newMessage.createdAt,
                    room: data.room
                });
            } catch (error: unknown) {
                if (error instanceof Error) {
                    socket.emit('error', `Failed to send message: ${error.message}`);
                } else {
                    socket.emit('error', 'An unknown error occurred while sending message');
                }
            }
        });

        socket.on('sendDirectMessage', async (data) => {
            try {
                const senderUser = await User.findById(socket.data.userId);
                if (!senderUser) {
                    socket.emit('error', 'Authentication error: user not found');
                    return;
                }

                const roomString = getUniqueRoomId(senderUser.username, data.toUsername);

                const newMessage = new Message({
                    room: roomString,
                    sender: senderUser.username,
                    content: data.content
                });
                await newMessage.save();

                const messagePayload = {
                    sender: senderUser.username,
                    content: data.content,
                    createdAt: newMessage.createdAt,
                    room: roomString
                };

                io.to(`user_${data.toUsername}`).emit('message', messagePayload);
                io.to(`user_${senderUser.username}`).emit('message', messagePayload);
            } catch (error: unknown) {
                if (error instanceof Error) {
                    socket.emit('error', `Failed to send DM: ${error.message}`);
                } else {
                    socket.emit('error', 'An unknown error occurred while sending DM');
                }
            }
        });

        socket.on('disconnect', () => {});
    });
};
