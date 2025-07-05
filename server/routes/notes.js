import express from 'express';
import mongoose from 'mongoose';
import Note from '../models/Note.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to transform note data for frontend compatibility
const transformNote = (note) => {
  const noteObj = note.toObject();
  return {
    ...noteObj,
    id: noteObj._id.toString(),
    goalId: noteObj.goalId ? noteObj.goalId.toString() : undefined,
    userId: noteObj.userId.toString(),
    createdAt: noteObj.createdAt,
    updatedAt: noteObj.updatedAt
  };
};

// GET all notes for the authenticated user with optional filters
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('📝 Fetching notes for user:', req.user.email, '(ID:', req.user._id, ')');
    const { goalId, tags, search } = req.query;
    const filter = { userId: req.user._id }; // Ensure user-specific filtering

    if (goalId && goalId !== 'all' && goalId !== '') {
      filter.goalId = goalId;
    }
    if (tags && tags !== 'all') {
      filter.tags = { $in: tags.split(',') };
    }

    let query = Note.find(filter).populate('goalId', 'title');

    if (search) {
      query = query.find({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const notes = await query.sort({ updatedAt: -1 });
    console.log(`✅ Found ${notes.length} notes for user ${req.user.email}`);
    const transformedNotes = notes.map(transformNote);
    res.json(transformedNotes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET a single note
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid note ID format' });
    }

    console.log('📝 Fetching note', id, 'for user:', req.user.email);
    const note = await Note.findOne({
      _id: id,
      userId: req.user._id // Ensure user owns the note
    }).populate('goalId', 'title');

    if (!note) {
      console.log('❌ Note not found or access denied');
      return res.status(404).json({ message: 'Note not found' });
    }

    console.log('✅ Note found for user');
    res.json(transformNote(note));
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST create a new note
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content, goalId, tags } = req.body;

    console.log('📝 Creating note for user:', req.user.email, '(ID:', req.user._id, ')');
    const noteData = {
      title,
      content,
      userId: req.user._id, // Ensure user ID is set
      tags: tags || []
    };

    // Only add goalId if it's provided and not empty
    if (goalId && goalId.trim() !== '') {
      if (!mongoose.Types.ObjectId.isValid(goalId)) {
        return res.status(400).json({ message: 'Invalid goal ID format' });
      }
      noteData.goalId = goalId;
    }

    const newNote = new Note(noteData);
    await newNote.save();
    await newNote.populate('goalId', 'title');
    
    console.log('✅ Note created successfully for user:', req.user.email);
    res.status(201).json(transformNote(newNote));
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT update a note
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, goalId, tags } = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid note ID format' });
    }

    console.log('📝 Updating note', id, 'for user:', req.user.email);
    const updateData = {
      title,
      content,
      tags: tags || []
    };

    // Handle goalId - remove if empty, validate if provided
    if (!goalId || goalId.trim() === '') {
      updateData.$unset = { goalId: 1 };
    } else {
      if (!mongoose.Types.ObjectId.isValid(goalId)) {
        return res.status(400).json({ message: 'Invalid goal ID format' });
      }
      updateData.goalId = goalId;
    }

    const updatedNote = await Note.findOneAndUpdate(
      { _id: id, userId: req.user._id }, // Ensure user owns the note
      updateData,
      { new: true, runValidators: true }
    ).populate('goalId', 'title');

    if (!updatedNote) {
      console.log('❌ Note not found or access denied');
      return res.status(404).json({ message: 'Note not found' });
    }

    console.log('✅ Note updated successfully');
    res.json(transformNote(updatedNote));
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE a note
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid note ID format' });
    }

    console.log('📝 Deleting note', id, 'for user:', req.user.email);
    const deletedNote = await Note.findOneAndDelete({
      _id: id,
      userId: req.user._id // Ensure user owns the note
    });

    if (!deletedNote) {
      console.log('❌ Note not found or access denied');
      return res.status(404).json({ message: 'Note not found' });
    }

    console.log('✅ Note deleted successfully');
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: error.message });
  }
});

// PATCH toggle favorite status
router.patch('/:id/favorite', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid note ID format' });
    }

    console.log('📝 Toggling favorite for note', id, 'for user:', req.user.email);
    const note = await Note.findOne({
      _id: id,
      userId: req.user._id // Ensure user owns the note
    });

    if (!note) {
      console.log('❌ Note not found or access denied');
      return res.status(404).json({ message: 'Note not found' });
    }

    note.isFavorite = !note.isFavorite;
    await note.save();
    await note.populate('goalId', 'title');

    console.log('✅ Note favorite status toggled successfully');
    res.json(transformNote(note));
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router;