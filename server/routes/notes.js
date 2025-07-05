import express from 'express';
import Note from '../models/Note.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET all notes for the authenticated user with optional filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { goalId, tags, search } = req.query;
    const filter = { userId: req.user._id };

    if (goalId) filter.goalId = goalId;
    if (tags) filter.tags = { $in: tags.split(',') };

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
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET a single note
router.get('/:id', authenticate, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('goalId', 'title');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST create a new note
router.post('/', authenticate, async (req, res) => {
  try {
    const newNote = new Note({
      ...req.body,
      userId: req.user._id
    });

    await newNote.save();
    await newNote.populate('goalId', 'title');
    res.status(201).json(newNote);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT update a note
router.put('/:id', authenticate, async (req, res) => {
  try {
    const updatedNote = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('goalId', 'title');

    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(updatedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE a note
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deletedNote = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!deletedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: error.message });
  }
});

// PATCH toggle favorite status
router.patch('/:id/favorite', authenticate, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    note.isFavorite = !note.isFavorite;
    await note.save();
    await note.populate('goalId', 'title');

    res.json(note);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router;
