import express from 'express';
import mongoose from 'mongoose';
import Client from '../models/Client.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to transform client data
const transformClient = (client) => {
  const clientObj = client.toObject();
  return {
    ...clientObj,
    id: clientObj._id.toString(),
    userId: clientObj.userId.toString()
  };
};

// Get all clients for user
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('👥 Fetching clients for user:', req.user.email, '(ID:', req.user._id, ')');
    const { status, search, industry, tags } = req.query;
    const filter = { userId: req.user._id };

    if (status && status !== 'all') filter.status = status;
    if (industry && industry !== 'all') filter.industry = industry;
    if (tags && tags !== 'all') filter.tags = { $in: tags.split(',') };

    let query = Client.find(filter);

    if (search) {
      query = query.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const clients = await query.sort({ name: 1 });
    console.log(`✅ Found ${clients.length} clients for user ${req.user.email}`);
    
    const transformedClients = clients.map(transformClient);
    res.json(transformedClients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single client
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid client ID format' });
    }

    const client = await Client.findOne({ _id: id, userId: req.user._id });
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(transformClient(client));
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new client
router.post('/', authenticate, async (req, res) => {
  try {
    console.log('👥 Creating client for user:', req.user.email, '(ID:', req.user._id, ')');
    
    const clientData = {
      ...req.body,
      userId: req.user._id
    };

    // Check for duplicate email
    const existingClient = await Client.findOne({
      userId: req.user._id,
      email: clientData.email
    });

    if (existingClient) {
      return res.status(400).json({ message: 'Client with this email already exists' });
    }

    const client = new Client(clientData);
    await client.save();
    
    console.log('✅ Client created successfully for user:', req.user.email);
    res.status(201).json(transformClient(client));
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update client
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid client ID format' });
    }

    // Check for duplicate email (excluding current client)
    if (req.body.email) {
      const existingClient = await Client.findOne({
        userId: req.user._id,
        email: req.body.email,
        _id: { $ne: id }
      });

      if (existingClient) {
        return res.status(400).json({ message: 'Client with this email already exists' });
      }
    }

    const client = await Client.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(transformClient(client));
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete client
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid client ID format' });
    }

    const client = await Client.findOneAndDelete({ _id: id, userId: req.user._id });
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update client statistics (called by other modules)
router.patch('/:id/stats', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { totalRevenue, totalProfit, totalTimeSpent, totalTasks, completedTasks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid client ID format' });
    }

    const updateData = {};
    if (totalRevenue !== undefined) updateData.totalRevenue = totalRevenue;
    if (totalProfit !== undefined) updateData.totalProfit = totalProfit;
    if (totalTimeSpent !== undefined) updateData.totalTimeSpent = totalTimeSpent;
    if (totalTasks !== undefined) updateData.totalTasks = totalTasks;
    if (completedTasks !== undefined) updateData.completedTasks = completedTasks;

    const client = await Client.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updateData,
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(transformClient(client));
  } catch (error) {
    console.error('Error updating client stats:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get client statistics
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid client ID format' });
    }

    const client = await Client.findOne({ _id: id, userId: req.user._id });
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Calculate additional stats from related models
    // This would typically involve aggregating data from tasks, time entries, invoices, etc.
    const stats = {
      totalRevenue: client.totalRevenue,
      totalProfit: client.totalProfit,
      totalTimeSpent: client.totalTimeSpent,
      totalTasks: client.totalTasks,
      completedTasks: client.completedTasks,
      taskCompletionRate: client.totalTasks > 0 ? (client.completedTasks / client.totalTasks) * 100 : 0,
      averageHourlyRate: client.totalTimeSpent > 0 ? (client.totalRevenue / (client.totalTimeSpent / 3600)) : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching client stats:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;