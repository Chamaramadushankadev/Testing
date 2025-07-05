import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Mock YouTube scripts storage
let mockScripts = [
  {
    id: '1',
    title: 'AI Tools Revolution - 60 Second Script',
    content: `🚀 **Hook**: "What if I told you that 5 AI tools could replace your entire content team?"

**Value**: 
- Tool 1: ChatGPT for script writing
- Tool 2: Midjourney for thumbnails  
- Tool 3: ElevenLabs for voiceovers
- Tool 4: Runway for video editing
- Tool 5: Buffer for scheduling

**CTA**: "Which tool shocked you the most? Drop a comment and don't forget to subscribe for more AI secrets!"`,
    tone: 'witty',
    source: 'Google Alerts: AI tools',
    createdAt: new Date('2025-01-15'),
    keywords: ['AI tools', 'content creation']
  }
];

router.get('/', authenticate, async (req, res) => {
  try {
    res.json(mockScripts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const newScript = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date()
    };
    mockScripts.unshift(newScript);
    res.status(201).json(newScript);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const index = mockScripts.findIndex(script => script.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Script not found' });
    }
    mockScripts.splice(index, 1);
    res.json({ message: 'Script deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate script with AI (mock implementation)
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { topic, tone, keywords } = req.body;
    
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const hooks = {
      witty: `🎯 **Hook**: "What if I told you that ${topic} could change everything... in just 60 seconds?"`,
      emotional: `💫 **Hook**: "This ${topic} story gave me chills... and it might change your life too."`,
      informative: `📚 **Hook**: "Here's everything you need to know about ${topic} in under a minute."`,
      casual: `👋 **Hook**: "Hey everyone! Let's talk about why ${topic} is actually pretty amazing..."`
    };

    const generatedScript = {
      id: Date.now().toString(),
      title: `${topic} - AI Generated Script`,
      content: `${hooks[tone]}

**Value**: 
- Key point 1: ${topic} fundamentals
- Key point 2: Practical applications  
- Key point 3: Real-world examples
- Key point 4: Pro tips and tricks

**CTA**: "Which tip surprised you most? Drop a comment below and don't forget to subscribe for more content like this!"

---
*Generated with AI • ${tone} tone • ${new Date().toLocaleDateString()}*`,
      tone,
      source: `Generated from: ${topic}`,
      createdAt: new Date(),
      keywords: keywords.split(',').map(k => k.trim()).filter(k => k)
    };

    mockScripts.unshift(generatedScript);
    res.status(201).json(generatedScript);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;