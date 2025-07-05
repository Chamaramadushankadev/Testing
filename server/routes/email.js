import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Mock email data
let mockEmails = [
  {
    id: '1',
    from: 'john.creator@example.com',
    to: ['you@ooopzzz.com'],
    subject: 'Collaboration Opportunity',
    content: 'Hi! I love your content and would like to collaborate...',
    isRead: false,
    isStarred: true,
    labels: ['important'],
    receivedAt: new Date('2025-01-15'),
    attachments: []
  }
];

let mockCampaigns = [
  {
    id: '1',
    name: 'Weekly AI Newsletter',
    subject: '🤖 This Week in AI: Game-Changing Tools You Need to Know',
    content: 'Hello AI enthusiasts! Here are the top AI tools from this week...',
    audienceList: 'ai-enthusiasts',
    status: 'sent',
    sentAt: new Date('2025-01-14'),
    stats: {
      sent: 1250,
      opened: 875,
      clicked: 234
    }
  }
];

router.get('/emails', authenticate, async (req, res) => {
  try {
    res.json(mockEmails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/campaigns', authenticate, async (req, res) => {
  try {
    res.json(mockCampaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/campaigns', authenticate, async (req, res) => {
  try {
    const newCampaign = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date(),
      stats: {
        sent: 0,
        opened: 0,
        clicked: 0
      }
    };
    mockCampaigns.unshift(newCampaign);
    res.status(201).json(newCampaign);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/emails/:id/read', authenticate, async (req, res) => {
  try {
    const email = mockEmails.find(e => e.id === req.params.id);
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    email.isRead = true;
    res.json(email);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/emails/:id/star', authenticate, async (req, res) => {
  try {
    const email = mockEmails.find(e => e.id === req.params.id);
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    email.isStarred = !email.isStarred;
    res.json(email);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;