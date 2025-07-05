import express from 'express';
import mongoose from 'mongoose';
import YouTubeChannel from '../models/YouTubeChannel.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to transform channel data
const transformChannel = (channel) => {
  const channelObj = channel.toObject();
  return {
    ...channelObj,
    id: channelObj._id.toString(),
    userId: channelObj.userId.toString()
  };
};

// Get all channels for user
router.get('/', authenticate, async (req, res) => {
  try {
    const { isActive = 'true' } = req.query;
    const filter = { userId: req.user._id };
    
    if (isActive !== 'all') {
      filter.isActive = isActive === 'true';
    }

    const channels = await YouTubeChannel.find(filter).sort({ createdAt: -1 });
    const transformedChannels = channels.map(transformChannel);
    res.json(transformedChannels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single channel
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid channel ID format' });
    }

    const channel = await YouTubeChannel.findOne({ _id: id, userId: req.user._id });
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    res.json(transformChannel(channel));
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new channel
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, channelId, description, url, subscriberCount, color, tags } = req.body;

    const channelData = {
      name,
      channelId: channelId || '',
      description: description || '',
      url: url || '',
      subscriberCount: subscriberCount || 0,
      color: color || '#3B82F6',
      tags: tags || [],
      userId: req.user._id
    };

    const channel = new YouTubeChannel(channelData);
    await channel.save();
    
    res.status(201).json(transformChannel(channel));
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update channel
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, channelId, description, url, subscriberCount, color, tags, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid channel ID format' });
    }

    const updateData = {
      name,
      channelId: channelId || '',
      description: description || '',
      url: url || '',
      subscriberCount: subscriberCount || 0,
      color: color || '#3B82F6',
      tags: tags || [],
      isActive: isActive !== undefined ? isActive : true
    };

    const channel = await YouTubeChannel.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    
    res.json(transformChannel(channel));
  } catch (error) {
    console.error('Error updating channel:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete channel
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid channel ID format' });
    }

    const channel = await YouTubeChannel.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    
    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    console.error('Error deleting channel:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;