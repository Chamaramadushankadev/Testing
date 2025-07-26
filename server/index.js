import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initializeSocket } from './socket/chatSocket.js';

// 🟢 Add this import at the top
import webhookRoute from './webhook.js';

// Import routes
import authRoutes from './routes/auth.js';
import goalsRoutes from './routes/goals.js';
import tasksRoutes from './routes/tasks.js';
import notesRoutes from './routes/notes.js';
import proposalsRoutes from './routes/proposals.js';
import remindersRoutes from './routes/reminders.js';
import pomodoroRoutes from './routes/pomodoro.js';
import googleAlertsRoutes from './routes/googleAlerts.js';
import scriptsRoutes from './routes/scripts.js';
import emailRoutes from './routes/email.js';
import coldEmailRoutes from './routes/coldEmail.js';
import coldEmailSystemRoutes from './routes/coldEmailSystem.js';
import analyticsRoutes from './routes/analytics.js';
import youtubeChannelsRoutes from './routes/youtubeChannels.js';
import youtubeScriptsRoutes from './routes/youtubeScripts.js';
import financeRoutes from './routes/finance.js';
import channelsRoutes from './routes/channels.js';
import messagesRoutes from './routes/messages.js';
import adminRoutes from './routes/admin.js';
import { startBackgroundJobs } from './services/emailScheduler.js';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5002;

// 🟢 Webhook route MUST come before JSON parser
app.use('/webhook', webhookRoute);
 

// CORS and body parsing
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection 
let isMongoConnected = false;

const connectToMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/productivity-dashboard';

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    console.log('✅ Connected to MongoDB');
    isMongoConnected = true;
  } catch (error) {
    console.warn('⚠️  MongoDB connection failed - running in demo mode');
    isMongoConnected = false;
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/proposals', proposalsRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/pomodoro', pomodoroRoutes);
app.use('/api/google-alerts', googleAlertsRoutes);
app.use('/api/scripts', scriptsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/cold-email', coldEmailRoutes);
app.use('/api/cold-email-system', coldEmailSystemRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/youtube-channels', youtubeChannelsRoutes);
app.use('/api/youtube-scripts', youtubeScriptsRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/channels', channelsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: isMongoConnected ? 'Connected' : 'Disconnected',
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
  });
});

// 404 fallback
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const startServer = async () => {
  await connectToMongoDB();
  
  // Initialize Socket.IO
  const io = initializeSocket(server);
  console.log('🔌 Socket.IO initialized');

  if (isMongoConnected) {
    startBackgroundJobs();
  }

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💬 Chat system enabled with Socket.IO`);

    if (!isMongoConnected) {
      console.log('⚠️  MongoDB not connected. Demo mode only.');
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${PORT} is already in use.`);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
};

startServer();
