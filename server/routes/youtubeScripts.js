import express from 'express';
import mongoose from 'mongoose';
import YouTubeScript from '../models/YouTubeScript.js';
import YouTubeChannel from '../models/YouTubeChannel.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to transform script data
const transformScript = (script) => {
  const scriptObj = script.toObject();
  return {
    ...scriptObj,
    id: scriptObj._id.toString(),
    userId: scriptObj.userId.toString(),
    channelId: scriptObj.channelId.toString()
  };
};

// Get all scripts for user
router.get('/', authenticate, async (req, res) => {
  try {
    const { channelId, tone, status, search } = req.query;
    const filter = { userId: req.user._id };

    if (channelId && channelId !== 'all') {
      if (!mongoose.Types.ObjectId.isValid(channelId)) {
        return res.status(400).json({ message: 'Invalid channel ID format' });
      }
      filter.channelId = channelId;
    }
    if (tone && tone !== 'all') filter.tone = tone;
    if (status && status !== 'all') filter.status = status;

    let query = YouTubeScript.find(filter).populate('channelId', 'name color');

    if (search) {
      query = query.find({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { keywords: { $in: [new RegExp(search, 'i')] } }
        ]
      });
    }

    const scripts = await query.sort({ createdAt: -1 });
    const transformedScripts = scripts.map(transformScript);
    res.json(transformedScripts);
  } catch (error) {
    console.error('Error fetching scripts:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single script
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid script ID format' });
    }

    const script = await YouTubeScript.findOne({ _id: id, userId: req.user._id })
      .populate('channelId', 'name color');
    
    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }

    res.json(transformScript(script));
  } catch (error) {
    console.error('Error fetching script:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new script
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      channelId, 
      title, 
      content, 
      tone, 
      source, 
      keywords, 
      status, 
      tags, 
      notes 
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({ message: 'Invalid channel ID format' });
    }

    // Verify channel belongs to user
    const channel = await YouTubeChannel.findOne({ _id: channelId, userId: req.user._id });
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const scriptData = {
      channelId,
      title,
      content,
      tone: tone || 'informative',
      source: source || 'Manual Entry',
      keywords: keywords || [],
      status: status || 'draft',
      tags: tags || [],
      notes: notes || '',
      userId: req.user._id,
      isGenerated: false
    };

    const script = new YouTubeScript(scriptData);
    await script.save();
    await script.populate('channelId', 'name color');
    
    res.status(201).json(transformScript(script));
  } catch (error) {
    console.error('Error creating script:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update script
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      channelId, 
      title, 
      content, 
      tone, 
      source, 
      keywords, 
      status, 
      tags, 
      notes 
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid script ID format' });
    }

    if (channelId && !mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({ message: 'Invalid channel ID format' });
    }

    // If channelId is being updated, verify it belongs to user
    if (channelId) {
      const channel = await YouTubeChannel.findOne({ _id: channelId, userId: req.user._id });
      if (!channel) {
        return res.status(404).json({ message: 'Channel not found' });
      }
    }

    const updateData = {
      title,
      content,
      tone: tone || 'informative',
      source: source || 'Manual Entry',
      keywords: keywords || [],
      status: status || 'draft',
      tags: tags || [],
      notes: notes || ''
    };

    if (channelId) {
      updateData.channelId = channelId;
    }

    const script = await YouTubeScript.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    ).populate('channelId', 'name color');
    
    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }
    
    res.json(transformScript(script));
  } catch (error) {
    console.error('Error updating script:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete script
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid script ID format' });
    }

    const script = await YouTubeScript.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }
    
    res.json({ message: 'Script deleted successfully' });
  } catch (error) {
    console.error('Error deleting script:', error);
    res.status(500).json({ message: error.message });
  }
});

// Generate script with AI (mock implementation)
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { channelId, topic, tone, keywords } = req.body;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({ message: 'Invalid channel ID format' });
    }

    // Verify channel belongs to user
    const channel = await YouTubeChannel.findOne({ _id: channelId, userId: req.user._id });
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const hooks = {
      witty: `🎯 **Hook**: "What if I told you that ${topic} could change everything... in just 60 seconds?"`,
      emotional: `💫 **Hook**: "This ${topic} story gave me chills... and it might change your life too."`,
      informative: `📚 **Hook**: "Here's everything you need to know about ${topic} in under a minute."`,
      casual: `👋 **Hook**: "Hey everyone! Let's talk about why ${topic} is actually pretty amazing..."`
    };

    const generatedContent = `${hooks[tone]}

**Value**: 
- Key point 1: ${topic} fundamentals
- Key point 2: Practical applications  
- Key point 3: Real-world examples
- Key point 4: Pro tips and tricks

**CTA**: "Which tip surprised you most? Drop a comment below and don't forget to subscribe for more content like this!"

---
*Generated with AI • ${tone} tone • ${new Date().toLocaleDateString()}*`;

const scriptData = {
  channelId,
  title: `${topic} - AI Generated Script`,
  content: generatedContent,
  tone,
  source: `Generated from: ${topic}`,
  keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
  userId: req.user._id,
  isGenerated: true,
  generationPrompt: `Topic: ${topic}, Tone: ${tone}, Keywords: ${keywords}`,
  status: 'draft'
};


    const script = new YouTubeScript(scriptData);
    await script.save();
    await script.populate('channelId', 'name color');
    
    res.status(201).json(transformScript(script));
  } catch (error) {
    console.error('Error generating script:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get scripts by channel
router.get('/channel/:channelId', authenticate, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { tone, status } = req.query;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({ message: 'Invalid channel ID format' });
    }

    const filter = { userId: req.user._id, channelId };
    if (tone && tone !== 'all') filter.tone = tone;
    if (status && status !== 'all') filter.status = status;

    const scripts = await YouTubeScript.find(filter)
      .populate('channelId', 'name color')
      .sort({ createdAt: -1 });
    
    const transformedScripts = scripts.map(transformScript);
    res.json(transformedScripts);
  } catch (error) {
    console.error('Error fetching channel scripts:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;