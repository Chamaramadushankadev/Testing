import express from 'express';
import mongoose from 'mongoose';
import Quote from '../models/Quote.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to transform quote data
const transformQuote = (quote) => {
  const quoteObj = quote.toObject();
  return {
    ...quoteObj,
    id: quoteObj._id.toString(),
    userId: quoteObj.userId.toString()
  };
};
 
// Get all quotes for user (their quotes + default quotes)
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('📝 Fetching quotes for user:', req.user.email, '(ID:', req.user._id, ')');
    const { category, search } = req.query;
    
    // Build filter for user's quotes and default quotes
    const filter = {
      $or: [
        { userId: req.user._id },
        { isDefault: true }
      ],
      isActive: true
    };

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        ...filter.$or,
        { text: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    const quotes = await Quote.find(filter).sort({ createdAt: -1 });
    console.log(`✅ Found ${quotes.length} quotes for user ${req.user.email}`);
    
    const transformedQuotes = quotes.map(transformQuote);
    res.json(transformedQuotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single quote
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid quote ID format' });
    }

    const quote = await Quote.findOne({
      _id: id,
      $or: [
        { userId: req.user._id },
        { isDefault: true }
      ],
      isActive: true
    });

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    res.json(transformQuote(quote));
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new quote
router.post('/', authenticate, async (req, res) => {
  try {
    console.log('📝 Creating quote for user:', req.user.email, '(ID:', req.user._id, ')');
    
    const { text, author, category, tags } = req.body;

    if (!text || !author) {
      return res.status(400).json({ message: 'Text and author are required' });
    }

    const quoteData = {
      userId: req.user._id,
      text: text.trim(),
      author: author.trim(),
      category: category || 'motivation',
      tags: tags || [],
      isDefault: false,
      isActive: true
    };

    const quote = new Quote(quoteData);
    await quote.save();
    
    console.log('✅ Quote created successfully for user:', req.user.email);
    res.status(201).json(transformQuote(quote));
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update quote (only user's own quotes)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, author, category, tags } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid quote ID format' });
    }

    const quote = await Quote.findOne({
      _id: id,
      userId: req.user._id,
      isDefault: false // Can't edit default quotes
    });

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found or cannot be edited' });
    }

    const updateData = {};
    if (text) updateData.text = text.trim();
    if (author) updateData.author = author.trim();
    if (category) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;

    const updatedQuote = await Quote.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(transformQuote(updatedQuote));
  } catch (error) {
    console.error('Error updating quote:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete quote (only user's own quotes)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid quote ID format' });
    }

    const quote = await Quote.findOne({
      _id: id,
      userId: req.user._id,
      isDefault: false // Can't delete default quotes
    });

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found or cannot be deleted' });
    }

    await Quote.findByIdAndDelete(id);
    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get random quote for dashboard
router.get('/random/daily', authenticate, async (req, res) => {
  try {
    const quotes = await Quote.find({
      $or: [
        { userId: req.user._id },
        { isDefault: true }
      ],
      isActive: true
    });

    if (quotes.length === 0) {
      return res.json({
        text: "The way to get started is to quit talking and begin doing.",
        author: "Walt Disney"
      });
    }

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    res.json(transformQuote(randomQuote));
  } catch (error) {
    console.error('Error fetching random quote:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;