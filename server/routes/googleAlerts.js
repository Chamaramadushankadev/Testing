import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Mock data for now - in production, you'd integrate with actual Google Alerts API
const mockAlerts = [
  {
    id: '1',
    keyword: 'AI tools',
    rssUrl: 'https://www.google.com/alerts/feeds/12345/ai-tools',
    isActive: true,
    category: 'Technology',
    createdAt: new Date('2025-01-01'),
    lastFetch: new Date('2025-01-15')
  }
];

const mockArticles = [
  {
    id: '1',
    title: 'Top 5 AI Tools That Will Change Content Creation in 2025',
    description: 'Discover the revolutionary AI tools that are transforming how creators work...',
    url: 'https://techcrunch.com/ai-tools-2025',
    publishedAt: new Date('2025-01-14'),
    source: 'TechCrunch',
    keyword: 'AI tools'
  }
];

router.get('/alerts', authenticate, async (req, res) => {
  try {
    res.json(mockAlerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/articles', authenticate, async (req, res) => {
  try {
    const { keyword } = req.query;
    let articles = mockArticles;
    
    if (keyword && keyword !== 'all') {
      articles = articles.filter(article => article.keyword === keyword);
    }
    
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/alerts', authenticate, async (req, res) => {
  try {
    const newAlert = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date(),
      lastFetch: new Date()
    };
    mockAlerts.push(newAlert);
    res.status(201).json(newAlert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;