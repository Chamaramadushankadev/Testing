import express from 'express';
import mongoose from 'mongoose';
import Channel from '../models/Channel.js';
import Message from '../models/Message.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to check if user has permission
const hasPermission = (userRole, requiredRole) => {
  const roleHierarchy = { admin: 3, moderator: 2, member: 1 };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Get all channels user has access to
router.get('/', authenticate, async (req, res) => {
  try {
    const channels = await Channel.find({
      $or: [
        { type: 'public' },
        { 'members.user': req.user._id }
      ]
    })
    .populate('lastMessage', 'content sender createdAt')
    .populate('lastMessage.sender', 'name email')
    .populate('createdBy', 'name email')
    .sort({ lastActivity: -1 });

    // Add user's role and unread count for each channel
    const channelsWithUserData = await Promise.all(channels.map(async (channel) => {
      const member = channel.members.find(m => m.user.toString() === req.user._id.toString());
      const userRole = member ? member.role : (channel.type === 'public' ? 'member' : null);
      
      // Get unread message count (simplified - in production you'd track last read timestamp)
      const unreadCount = await Message.countDocuments({
        channel: channel._id,
        sender: { $ne: req.user._id },
        createdAt: { $gt: member?.joinedAt || channel.createdAt }
      });

      return {
        ...channel.toObject(),
        userRole,
        unreadCount
      };
    }));

    res.json(channelsWithUserData);
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new channel
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, type = 'public' } = req.body;

    const channel = new Channel({
      name,
      description,
      type,
      createdBy: req.user._id,
      members: [{
        user: req.user._id,
        role: 'admin'
      }]
    });

    await channel.save();
    await channel.populate('createdBy', 'name email');

    res.status(201).json(channel);
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update channel
router.put('/:id', authenticate, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Check if user has admin permission
    const member = channel.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member || !hasPermission(member.role, 'admin')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const { name, description, type } = req.body;
    
    if (name) channel.name = name;
    if (description !== undefined) channel.description = description;
    if (type) channel.type = type;

    await channel.save();
    await channel.populate('createdBy', 'name email');

    res.json(channel);
  } catch (error) {
    console.error('Error updating channel:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete channel
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Check if user has admin permission
    const member = channel.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member || !hasPermission(member.role, 'admin')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Delete all messages in the channel
    await Message.deleteMany({ channel: channel._id });
    
    // Delete the channel
    await Channel.findByIdAndDelete(req.params.id);

    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    console.error('Error deleting channel:', error);
    res.status(500).json({ message: error.message });
  }
});

// Join channel
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    if (channel.type === 'private') {
      return res.status(403).json({ message: 'Cannot join private channel without invitation' });
    }

    // Check if user is already a member
    const existingMember = channel.members.find(m => m.user.toString() === req.user._id.toString());
    if (existingMember) {
      return res.status(400).json({ message: 'Already a member of this channel' });
    }

    channel.members.push({
      user: req.user._id,
      role: 'member'
    });

    await channel.save();
    res.json({ message: 'Joined channel successfully' });
  } catch (error) {
    console.error('Error joining channel:', error);
    res.status(500).json({ message: error.message });
  }
});

// Leave channel
router.post('/:id/leave', authenticate, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    channel.members = channel.members.filter(m => m.user.toString() !== req.user._id.toString());
    await channel.save();

    res.json({ message: 'Left channel successfully' });
  } catch (error) {
    console.error('Error leaving channel:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update member role
router.put('/:id/members/:userId/role', authenticate, async (req, res) => {
  try {
    const { role } = req.body;
    const channel = await Channel.findById(req.params.id);
    
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Check if user has admin permission
    const member = channel.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member || !hasPermission(member.role, 'admin')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Find the member to update
    const targetMember = channel.members.find(m => m.user.toString() === req.params.userId);
    if (!targetMember) {
      return res.status(404).json({ message: 'Member not found' });
    }

    targetMember.role = role;
    await channel.save();

    res.json({ message: 'Member role updated successfully' });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;