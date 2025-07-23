import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Channel from '../models/Channel.js';
import Message from '../models/Message.js';

// Store active users and their typing status
const activeUsers = new Map();
const typingUsers = new Map();

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected`);
    
    // Add user to active users
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      lastSeen: new Date()
    });

    // Join user to their channels
    socket.on('join-channels', async () => {
      try {
        const channels = await Channel.find({
          $or: [
            { type: 'public' },
            { 'members.user': socket.userId }
          ]
        });

        channels.forEach(channel => {
          socket.join(channel._id.toString());
        });

        // Emit updated user list to all channels
        socket.broadcast.emit('user-online', {
          userId: socket.userId,
          user: socket.user
        });
      } catch (error) {
        console.error('Error joining channels:', error);
      }
    });

    // Handle sending messages
    socket.on('send-message', async (data) => {
      try {
        const { content, channelId, replyTo } = data;

        // Validate channel access
        const channel = await Channel.findById(channelId);
        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        // Check if user has access to the channel
        const member = channel.members.find(m => m.user.toString() === socket.userId);
        if (channel.type === 'private' && !member) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Create message
        const message = new Message({
          content,
          sender: socket.userId,
          channel: channelId,
          replyTo: replyTo || undefined
        });

        await message.save();
        await message.populate('sender', 'name email avatar');
        
        if (replyTo) {
          await message.populate('replyTo', 'content sender');
        }

        // Update channel's last activity and last message
        channel.lastMessage = message._id;
        channel.lastActivity = new Date();
        await channel.save();

        // Emit message to all users in the channel
        io.to(channelId).emit('new-message', message);

        // Clear typing indicator for this user
        const channelTyping = typingUsers.get(channelId) || new Set();
        channelTyping.delete(socket.userId);
        typingUsers.set(channelId, channelTyping);
        
        socket.to(channelId).emit('user-stopped-typing', {
          userId: socket.userId,
          channelId
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message editing
    socket.on('edit-message', async (data) => {
      try {
        const { messageId, content } = data;
        const message = await Message.findById(messageId);

        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Check if user owns the message
        if (message.sender.toString() !== socket.userId) {
          socket.emit('error', { message: 'Cannot edit this message' });
          return;
        }

        message.content = content;
        message.edited = true;
        message.editedAt = new Date();
        await message.save();

        await message.populate('sender', 'name email avatar');

        // Emit updated message to all users in the channel
        io.to(message.channel.toString()).emit('message-edited', message);

      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Handle message deletion
    socket.on('delete-message', async (data) => {
      try {
        const { messageId } = data;
        const message = await Message.findById(messageId);

        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Check if user owns the message or has moderator permissions
        const channel = await Channel.findById(message.channel);
        const member = channel.members.find(m => m.user.toString() === socket.userId);
        const userRole = member ? member.role : 'member';
        const roleHierarchy = { admin: 3, moderator: 2, member: 1 };

        if (message.sender.toString() !== socket.userId && roleHierarchy[userRole] < 2) {
          socket.emit('error', { message: 'Cannot delete this message' });
          return;
        }

        message.deleted = true;
        message.deletedAt = new Date();
        await message.save();

        // Emit message deletion to all users in the channel
        io.to(message.channel.toString()).emit('message-deleted', { messageId });

      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      const { channelId } = data;
      
      // Add user to typing users for this channel
      const channelTyping = typingUsers.get(channelId) || new Set();
      channelTyping.add(socket.userId);
      typingUsers.set(channelId, channelTyping);

      // Emit to other users in the channel
      socket.to(channelId).emit('user-typing', {
        userId: socket.userId,
        user: socket.user,
        channelId
      });
    });

    socket.on('typing-stop', (data) => {
      const { channelId } = data;
      
      // Remove user from typing users for this channel
      const channelTyping = typingUsers.get(channelId) || new Set();
      channelTyping.delete(socket.userId);
      typingUsers.set(channelId, channelTyping);

      // Emit to other users in the channel
      socket.to(channelId).emit('user-stopped-typing', {
        userId: socket.userId,
        channelId
      });
    });

    // Handle joining a specific channel
    socket.on('join-channel', (channelId) => {
      socket.join(channelId);
    });

    // Handle leaving a specific channel
    socket.on('leave-channel', (channelId) => {
      socket.leave(channelId);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.name} disconnected`);
      
      // Remove user from active users
      activeUsers.delete(socket.userId);

      // Clear typing indicators for this user
      typingUsers.forEach((users, channelId) => {
        if (users.has(socket.userId)) {
          users.delete(socket.userId);
          socket.to(channelId).emit('user-stopped-typing', {
            userId: socket.userId,
            channelId
          });
        }
      });

      // Emit user offline status
      socket.broadcast.emit('user-offline', {
        userId: socket.userId
      });
    });
  });

  return io;
};