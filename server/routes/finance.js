import express from 'express';
import mongoose from 'mongoose';
import FinanceTransaction from '../models/FinanceTransaction.js';
import Invoice from '../models/Invoice.js';
import FinanceClient from '../models/FinanceClient.js';
import FinanceProject from '../models/FinanceProject.js';
import FinanceSettings from '../models/FinanceSettings.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to check database availability
const isDatabaseAvailable = () => {
  return mongoose.connection.readyState === 1 && mongoose.connection.db;
};

// Transform data for frontend compatibility
const transformTransaction = (transaction) => {
  const transactionObj = transaction.toObject();
  return {
    ...transactionObj,
    id: transactionObj._id.toString(),
    userId: transactionObj.userId.toString(),
    clientId: transactionObj.clientId?.toString(),
    projectId: transactionObj.projectId?.toString()
  };
};

const transformInvoice = (invoice) => {
  const invoiceObj = invoice.toObject();
  return {
    ...invoiceObj,
    id: invoiceObj._id.toString(),
    userId: invoiceObj.userId.toString(),
    clientId: invoiceObj.clientId.toString(),
    projectId: invoiceObj.projectId?.toString()
  };
};

const transformClient = (client) => {
  const clientObj = client.toObject();
  return {
    ...clientObj,
    id: clientObj._id.toString(),
    userId: clientObj.userId.toString()
  };
};

const transformProject = (project) => {
  const projectObj = project.toObject();
  return {
    ...projectObj,
    id: projectObj._id.toString(),
    userId: projectObj.userId.toString(),
    clientId: projectObj.clientId.toString()
  };
};

// Dashboard endpoint
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot fetch finance dashboard without database connection'
      });
    }

    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get transactions for the period
    const transactions = await FinanceTransaction.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: now }
    });

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = income - expenses;
    const profitMargin = income > 0 ? (netProfit / income) * 100 : 0;

    // Get upcoming and overdue invoices
    const upcomingInvoices = await Invoice.find({
      userId: req.user._id,
      status: { $in: ['sent', 'viewed'] },
      dueDate: { $gte: now, $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) }
    }).populate('clientId', 'name company').sort({ dueDate: 1 }).limit(5);

    const overdueInvoices = await Invoice.find({
      userId: req.user._id,
      status: { $in: ['sent', 'viewed'] },
      dueDate: { $lt: now }
    }).populate('clientId', 'name company').sort({ dueDate: 1 });

    // Monthly data for the last 12 months
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthTransactions = await FinanceTransaction.find({
        userId: req.user._id,
        date: { $gte: monthStart, $lte: monthEnd }
      });

      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const monthExpenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: monthIncome,
        expenses: monthExpenses,
        profit: monthIncome - monthExpenses
      });
    }

    // Top clients by revenue
    const clients = await FinanceClient.find({ userId: req.user._id })
      .sort({ totalRevenue: -1 })
      .limit(5);

    const topClients = clients.map(client => ({
      clientId: client._id.toString(),
      clientName: client.name,
      revenue: client.totalRevenue,
      profit: client.totalProfit
    }));

    // Expenses by category
    const expenseCategories = await FinanceTransaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: 'expense',
          date: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { amount: -1 } }
    ]);

    const totalExpenseAmount = expenseCategories.reduce((sum, cat) => sum + cat.amount, 0);
    const expensesByCategory = expenseCategories.map(cat => ({
      category: cat._id,
      amount: cat.amount,
      percentage: totalExpenseAmount > 0 ? (cat.amount / totalExpenseAmount) * 100 : 0
    }));

    const dashboard = {
      totalIncome: income,
      totalExpenses: expenses,
      netProfit,
      profitMargin,
      upcomingInvoices: upcomingInvoices.map(transformInvoice),
      overdueInvoices: overdueInvoices.map(transformInvoice),
      monthlyData,
      topClients,
      expensesByCategory
    };

    res.json(dashboard);
  } catch (error) {
    console.error('Error fetching finance dashboard:', error);
    res.status(500).json({ message: error.message });
  }
});

// Transactions endpoints
router.get('/transactions', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot fetch transactions without database connection'
      });
    }

    const { type, category, clientId, projectId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = { userId: req.user._id };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (clientId) filter.clientId = clientId;
    if (projectId) filter.projectId = projectId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await FinanceTransaction.find(filter)
      .populate('clientId', 'name company')
      .populate('projectId', 'name')
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await FinanceTransaction.countDocuments(filter);

    res.json({
      transactions: transactions.map(transformTransaction),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/transactions', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot create transaction without database connection'
      });
    }

    const transactionData = {
      ...req.body,
      userId: req.user._id
    };

    const transaction = new FinanceTransaction(transactionData);
    await transaction.save();
    await transaction.populate('clientId', 'name company');
    await transaction.populate('projectId', 'name');

    // Update client and project totals
    if (transaction.clientId) {
      await updateClientTotals(transaction.clientId);
    }
    if (transaction.projectId) {
      await updateProjectTotals(transaction.projectId);
    }

    res.status(201).json(transformTransaction(transaction));
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(400).json({ message: error.message });
  }
});

router.put('/transactions/:id', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot update transaction without database connection'
      });
    }

    const transaction = await FinanceTransaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('clientId', 'name company').populate('projectId', 'name');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Update client and project totals
    if (transaction.clientId) {
      await updateClientTotals(transaction.clientId);
    }
    if (transaction.projectId) {
      await updateProjectTotals(transaction.projectId);
    }

    res.json(transformTransaction(transaction));
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(400).json({ message: error.message });
  }
});

router.delete('/transactions/:id', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot delete transaction without database connection'
      });
    }

    const transaction = await FinanceTransaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Update client and project totals
    if (transaction.clientId) {
      await updateClientTotals(transaction.clientId);
    }
    if (transaction.projectId) {
      await updateProjectTotals(transaction.projectId);
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: error.message });
  }
});

// Invoices endpoints
router.get('/invoices', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot fetch invoices without database connection'
      });
    }

    const { status, clientId, page = 1, limit = 50 } = req.query;
    const filter = { userId: req.user._id };

    if (status) filter.status = status;
    if (clientId) filter.clientId = clientId;

    const invoices = await Invoice.find(filter)
      .populate('clientId', 'name company email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Invoice.countDocuments(filter);

    res.json({
      invoices: invoices.map(transformInvoice),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/invoices', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot create invoice without database connection'
      });
    }

    const invoiceData = {
      ...req.body,
      userId: req.user._id
    };

    const invoice = new Invoice(invoiceData);
    await invoice.save();
    await invoice.populate('clientId', 'name company email');
    await invoice.populate('projectId', 'name');

    res.status(201).json(transformInvoice(invoice));
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(400).json({ message: error.message });
  }
});

router.put('/invoices/:id', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot update invoice without database connection'
      });
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('clientId', 'name company email').populate('projectId', 'name');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(transformInvoice(invoice));
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(400).json({ message: error.message });
  }
});

router.delete('/invoices/:id', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot delete invoice without database connection'
      });
    }

    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: error.message });
  }
});

// Mark invoice as paid
router.patch('/invoices/:id/paid', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot update invoice without database connection'
      });
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { 
        status: 'paid',
        paidDate: new Date()
      },
      { new: true }
    ).populate('clientId', 'name company email');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Create income transaction
    const transaction = new FinanceTransaction({
      userId: req.user._id,
      type: 'income',
      amount: invoice.totalAmount,
      currency: invoice.currency,
      description: `Payment for invoice ${invoice.invoiceNumber}`,
      category: 'Invoice Payment',
      date: new Date(),
      clientId: invoice.clientId,
      projectId: invoice.projectId
    });
    await transaction.save();

    // Update client totals
    if (invoice.clientId) {
      await updateClientTotals(invoice.clientId);
    }

    res.json(transformInvoice(invoice));
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    res.status(400).json({ message: error.message });
  }
});

// Clients endpoints
router.get('/clients', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot fetch clients without database connection'
      });
    }

    const clients = await FinanceClient.find({ userId: req.user._id })
      .sort({ totalRevenue: -1 });

    res.json(clients.map(transformClient));
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/clients', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot create client without database connection'
      });
    }

    const clientData = {
      ...req.body,
      userId: req.user._id
    };

    const client = new FinanceClient(clientData);
    await client.save();

    res.status(201).json(transformClient(client));
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(400).json({ message: error.message });
  }
});

router.put('/clients/:id', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot update client without database connection'
      });
    }

    const client = await FinanceClient.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
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

router.delete('/clients/:id', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot delete client without database connection'
      });
    }

    const client = await FinanceClient.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: error.message });
  }
});

// Projects endpoints
router.get('/projects', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot fetch projects without database connection'
      });
    }

    const { clientId, status } = req.query;
    const filter = { userId: req.user._id };

    if (clientId) filter.clientId = clientId;
    if (status) filter.status = status;

    const projects = await FinanceProject.find(filter)
      .populate('clientId', 'name company')
      .sort({ createdAt: -1 });

    res.json(projects.map(transformProject));
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/projects', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot create project without database connection'
      });
    }

    const projectData = {
      ...req.body,
      userId: req.user._id
    };

    const project = new FinanceProject(projectData);
    await project.save();
    await project.populate('clientId', 'name company');

    res.status(201).json(transformProject(project));
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(400).json({ message: error.message });
  }
});

router.put('/projects/:id', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot update project without database connection'
      });
    }

    const project = await FinanceProject.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('clientId', 'name company');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(transformProject(project));
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(400).json({ message: error.message });
  }
});

router.delete('/projects/:id', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot delete project without database connection'
      });
    }

    const project = await FinanceProject.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: error.message });
  }
});

// Tax estimation endpoint
router.get('/tax-estimate', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot calculate tax estimate without database connection'
      });
    }

    const { period = 'quarterly', year = new Date().getFullYear(), quarter } = req.query;
    
    let startDate, endDate;
    if (period === 'quarterly' && quarter) {
      const quarterStart = (parseInt(quarter) - 1) * 3;
      startDate = new Date(year, quarterStart, 1);
      endDate = new Date(year, quarterStart + 3, 0);
    } else {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }

    const transactions = await FinanceTransaction.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const taxableIncome = totalIncome - totalExpenses;

    // Get user's tax settings
    const settings = await FinanceSettings.findOne({ userId: req.user._id });
    const taxSettings = settings?.taxSettings || [];

    let estimatedTax = 0;
    const breakdown = [];

    taxSettings.forEach(tax => {
      if (tax.isActive) {
        const taxAmount = (taxableIncome * tax.rate) / 100;
        estimatedTax += taxAmount;
        breakdown.push({
          taxType: tax.taxType,
          amount: taxAmount,
          rate: tax.rate
        });
      }
    });

    const estimate = {
      period,
      year: parseInt(year),
      quarter: quarter ? parseInt(quarter) : undefined,
      totalIncome,
      totalExpenses,
      taxableIncome,
      estimatedTax,
      taxRate: taxSettings.reduce((sum, tax) => sum + (tax.isActive ? tax.rate : 0), 0),
      dueDate: period === 'quarterly' ? 
        new Date(year, quarterStart + 3, 15) : 
        new Date(parseInt(year) + 1, 3, 15),
      breakdown
    };

    res.json(estimate);
  } catch (error) {
    console.error('Error calculating tax estimate:', error);
    res.status(500).json({ message: error.message });
  }
});

// Settings endpoints
router.get('/settings', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot fetch settings without database connection'
      });
    }

    let settings = await FinanceSettings.findOne({ userId: req.user._id });
    
    if (!settings) {
      // Create default settings
      settings = new FinanceSettings({
        userId: req.user._id,
        defaultCurrency: 'USD',
        invoiceBranding: {
          companyName: req.user.name || 'Your Company',
          primaryColor: '#3B82F6'
        }
      });
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching finance settings:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/settings', authenticate, async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({ 
        message: 'Database not available',
        error: 'Cannot update settings without database connection'
      });
    }

    const settings = await FinanceSettings.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );

    res.json(settings);
  } catch (error) {
    console.error('Error updating finance settings:', error);
    res.status(400).json({ message: error.message });
  }
});

// Helper functions
async function updateClientTotals(clientId) {
  try {
    const income = await FinanceTransaction.aggregate([
      {
        $match: {
          clientId: new mongoose.Types.ObjectId(clientId),
          type: 'income'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const expenses = await FinanceTransaction.aggregate([
      {
        $match: {
          clientId: new mongoose.Types.ObjectId(clientId),
          type: 'expense'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalRevenue = income[0]?.total || 0;
    const totalExpenses = expenses[0]?.total || 0;

    await FinanceClient.findByIdAndUpdate(clientId, {
      totalRevenue,
      totalProfit: totalRevenue - totalExpenses
    });
  } catch (error) {
    console.error('Error updating client totals:', error);
  }
}

async function updateProjectTotals(projectId) {
  try {
    const income = await FinanceTransaction.aggregate([
      {
        $match: {
          projectId: new mongoose.Types.ObjectId(projectId),
          type: 'income'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const expenses = await FinanceTransaction.aggregate([
      {
        $match: {
          projectId: new mongoose.Types.ObjectId(projectId),
          type: 'expense'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalRevenue = income[0]?.total || 0;
    const totalExpenses = expenses[0]?.total || 0;

    await FinanceProject.findByIdAndUpdate(projectId, {
      totalRevenue,
      totalExpenses
    });
  } catch (error) {
    console.error('Error updating project totals:', error);
  }
}

export default router;