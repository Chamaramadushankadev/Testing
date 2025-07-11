import express from 'express';
import mongoose from 'mongoose';
import { EmailTemplate } from '../models/ColdEmailSystemIndex.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to transform data
const transformTemplate = (template) => {
  const templateObj = template.toObject();
  return {
    ...templateObj,
    id: templateObj._id.toString(),
    userId: templateObj.userId.toString()
  };
};

// Get all email templates
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, industry } = req.query;
    const filter = { userId: req.user._id };

    if (category && category !== 'all') filter.category = category;
    if (industry && industry !== 'all') filter.industry = industry;

    const templates = await EmailTemplate.find(filter).sort({ createdAt: -1 });
    const transformedTemplates = templates.map(transformTemplate);
    res.json(transformedTemplates);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create email template
router.post('/', authenticate, async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      userId: req.user._id
    };

    const template = new EmailTemplate(templateData);
    await template.save();
    
    res.status(201).json(transformTemplate(template));
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update email template
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid template ID format' });
    }

    const template = await EmailTemplate.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({ message: 'Email template not found' });
    }

    res.json(transformTemplate(template));
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete email template
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid template ID format' });
    }

    const template = await EmailTemplate.findOne({ _id: id, userId: req.user._id });
    
    if (!template) {
      return res.status(404).json({ message: 'Email template not found' });
    }
    
    if (template.isDefault) {
      return res.status(400).json({ message: 'Cannot delete default templates' });
    }

    await EmailTemplate.findByIdAndDelete(id);
    res.json({ message: 'Email template deleted successfully' });
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({ message: error.message });
  }
});

// Duplicate email template
router.post('/:id/duplicate', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid template ID format' });
    }

    const sourceTemplate = await EmailTemplate.findOne({ _id: id, userId: req.user._id });
    
    if (!sourceTemplate) {
      return res.status(404).json({ message: 'Email template not found' });
    }

    const newTemplate = new EmailTemplate({
      name: `${sourceTemplate.name} (Copy)`,
      category: sourceTemplate.category,
      subject: sourceTemplate.subject,
      content: sourceTemplate.content,
      variables: sourceTemplate.variables,
      industry: sourceTemplate.industry,
      useCase: sourceTemplate.useCase,
      isDefault: false,
      userId: req.user._id
    });

    await newTemplate.save();
    res.status(201).json(transformTemplate(newTemplate));
  } catch (error) {
    console.error('Error duplicating email template:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;