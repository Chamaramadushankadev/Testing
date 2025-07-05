import express from 'express';
import mongoose from 'mongoose';
import { Proposal, ProposalCategory } from '../models/Proposal.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to transform proposal data for frontend compatibility
const transformProposal = (proposal) => {
  const proposalObj = proposal.toObject();
  return {
    ...proposalObj,
    id: proposalObj._id.toString(),
    userId: proposalObj.userId.toString(),
    createdAt: proposalObj.createdAt,
    updatedAt: proposalObj.updatedAt
  };
};

const transformCategory = (category) => {
  const categoryObj = category.toObject();
  return {
    ...categoryObj,
    id: categoryObj._id.toString(),
    userId: categoryObj.userId.toString(),
    createdAt: categoryObj.createdAt
  };
};

// Initialize default categories for new users
const initializeDefaultCategories = async (userId) => {
  const defaultCategories = [
    { name: 'Digital Marketing', description: 'SEO, social media, advertising campaigns', color: '#3B82F6', icon: 'megaphone' },
    { name: 'Video Editing', description: 'Video production and post-production services', color: '#EF4444', icon: 'video' },
    { name: 'Graphic Design', description: 'Logo design, branding, visual identity', color: '#8B5CF6', icon: 'palette' },
    { name: 'Web Development', description: 'Website design and development projects', color: '#10B981', icon: 'code' },
    { name: 'Content Writing', description: 'Blog posts, copywriting, content strategy', color: '#F59E0B', icon: 'pen-tool' },
    { name: 'Consulting', description: 'Business consulting and strategy services', color: '#6B7280', icon: 'briefcase' }
  ];

  const existingCategories = await ProposalCategory.find({ userId });
  if (existingCategories.length === 0) {
    const categories = defaultCategories.map(cat => ({
      ...cat,
      userId,
      isDefault: true
    }));
    await ProposalCategory.insertMany(categories);
  }
};

// GET all categories for user
router.get('/categories', authenticate, async (req, res) => {
  try {
    await initializeDefaultCategories(req.user._id);
    const categories = await ProposalCategory.find({ userId: req.user._id }).sort({ name: 1 });
    const transformedCategories = categories.map(transformCategory);
    res.json(transformedCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST create new category
router.post('/categories', authenticate, async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;

    const categoryData = {
      name,
      description: description || '',
      color: color || '#3B82F6',
      icon: icon || 'folder',
      userId: req.user._id,
      isDefault: false
    };

    const category = new ProposalCategory(categoryData);
    await category.save();
    
    res.status(201).json(transformCategory(category));
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT update category
router.put('/categories/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category ID format' });
    }

    const updateData = {
      name,
      description: description || '',
      color: color || '#3B82F6',
      icon: icon || 'folder'
    };

    const category = await ProposalCategory.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(transformCategory(category));
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE category
router.delete('/categories/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category ID format' });
    }

    const category = await ProposalCategory.findOne({ _id: id, userId: req.user._id });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.isDefault) {
      return res.status(400).json({ message: 'Cannot delete default categories' });
    }

    await ProposalCategory.findByIdAndDelete(id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET all proposals for the authenticated user with optional filters
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('📄 Fetching proposals for user:', req.user.email, '(ID:', req.user._id, ')');
    const { category, status, priority, tags, search } = req.query;
    const filter = { userId: req.user._id }; // Ensure user-specific filtering

    if (category && category !== 'all' && category !== '') {
      filter.category = category;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }
    if (tags && tags !== 'all') {
      filter.tags = { $in: tags.split(',') };
    }

    let query = Proposal.find(filter);

    if (search) {
      query = query.find({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { clientName: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const proposals = await query.sort({ updatedAt: -1 });
    console.log(`✅ Found ${proposals.length} proposals for user ${req.user.email}`);
    const transformedProposals = proposals.map(transformProposal);
    res.json(transformedProposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET a single proposal
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid proposal ID format' });
    }

    const proposal = await Proposal.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    res.json(transformProposal(proposal));
  } catch (error) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST create a new proposal
router.post('/', authenticate, async (req, res) => {
  try {
    console.log('📄 Creating proposal for user:', req.user.email, '(ID:', req.user._id, ')');
    const { 
      title, 
      content, 
      category, 
      tags, 
      status, 
      priority, 
      clientName, 
      projectValue, 
      deadline 
    } = req.body;

    const proposalData = {
      title,
      content,
      category,
      tags: tags || [],
      status: status || 'draft',
      priority: priority || 'medium',
      clientName: clientName || '',
      projectValue: projectValue || undefined,
      deadline: deadline ? new Date(deadline) : undefined,
      userId: req.user._id // Ensure user ID is set
    };

    const newProposal = new Proposal(proposalData);
    await newProposal.save();
    
    console.log('✅ Proposal created successfully for user:', req.user.email);
    res.status(201).json(transformProposal(newProposal));
  } catch (error) {
    console.error('Error creating proposal:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT update a proposal
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      content, 
      category, 
      tags, 
      status, 
      priority, 
      clientName, 
      projectValue, 
      deadline 
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid proposal ID format' });
    }

    const updateData = {
      title,
      content,
      category,
      tags: tags || [],
      status: status || 'draft',
      priority: priority || 'medium',
      clientName: clientName || '',
      projectValue: projectValue || undefined,
      deadline: deadline ? new Date(deadline) : undefined
    };

    const updatedProposal = await Proposal.findOneAndUpdate(
      { _id: id, userId: req.user._id }, // Ensure user owns the proposal
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    res.json(transformProposal(updatedProposal));
  } catch (error) {
    console.error('Error updating proposal:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE a proposal
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid proposal ID format' });
    }

    const deletedProposal = await Proposal.findOneAndDelete({
      _id: id,
      userId: req.user._id // Ensure user owns the proposal
    });

    if (!deletedProposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    res.json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;