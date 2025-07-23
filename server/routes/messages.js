import express from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import Channel from '../models/Channel.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to check if user has permission
const hasPermission = (userRole, requiredRole) => {
  const roleHierarchy = { admin: 3, moderator: 2, member: 1 };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Get messages for a channel
router.get('/channel/:channelId', authenticate, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if user has access to the channel
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Check access permissions
    const member = channel.members.find(m => m.user.toString() === req.user._id.toString());
    const isParticipant = channel.participants && channel.participants.includes(req.user._id);
    if (channel.type === 'private' && !member) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (channel.type === 'direct' && !isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({
      channel: channelId,
      deleted: false
    })
    .populate('sender', 'name email avatar')
    .populate('replyTo', 'content sender')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Message.countDocuments({
      channel: channelId,
      deleted: false
    });

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: error.message });
  }
});

// Send message (handled via Socket.IO, but keeping REST endpoint for fallback)
router.post('/', authenticate, async (req, res) => {
  try {
    const { content, channelId, replyTo } = req.body;

    // Check if user has access to the channel
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Check access permissions
    const member = channel.members.find(m => m.user.toString() === req.user._id.toString());
    const isParticipant = channel.participants && channel.participants.includes(req.user._id);
    if (channel.type === 'private' && !member) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (channel.type === 'direct' && !isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if user has permission to send messages
    const userRole = member ? member.role : (channel.type === 'direct' ? 'member' : 'member');
    if (!hasPermission(userRole, 'member')) {
      return res.status(403).json({ message: 'Insufficient permissions to send messages' });
    }

    const message = new Message({
      content,
      sender: req.user._id,
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

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(400).json({ message: error.message });
  }
});

// Edit message
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user owns the message or has moderator permissions
    const channel = await Channel.findById(message.channel);
    const member = channel.members.find(m => m.user.toString() === req.user._id.toString());
    const userRole = member ? member.role : 'member';

    if (message.sender.toString() !== req.user._id.toString() && !hasPermission(userRole, 'moderator')) {
      return res.status(403).json({ message: 'Cannot edit this message' });
    }

    message.content = content;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('sender', 'name email avatar');
    res.json(message);
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete message
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user owns the message or has moderator permissions
    const channel = await Channel.findById(message.channel);
    const member = channel.members.find(m => m.user.toString() === req.user._id.toString());
    const userRole = member ? member.role : 'member';

    if (message.sender.toString() !== req.user._id.toString() && !hasPermission(userRole, 'moderator')) {
      return res.status(403).json({ message: 'Cannot delete this message' });
    }

    message.deleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;