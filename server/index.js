import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.js';
import goalsRoutes from './routes/goals.js';
import tasksRoutes from './routes/tasks.js';
import notesRoutes from './routes/notes.js';
import remindersRoutes from './routes/reminders.js';
import googleAlertsRoutes from './routes/googleAlerts.js';
import scriptsRoutes from './routes/scripts.js';
import emailRoutes from './routes/email.js';
import coldEmailRoutes from './routes/coldEmail.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 500 : 2000,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(cors({
  origin: function (origin, callback) {
    // Allow localhost dev frontends
    const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

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
    console.warn('💡 Check your MONGODB_URI in the .env file');
    isMongoConnected = false;
  }
};

// Middleware to check DB connection
const checkDatabaseConnection = (req, res, next) => {
  if (!isMongoConnected && req.method !== 'GET') {
    return res.status(503).json({
      message: 'Database not available - running in demo mode',
      error: 'MongoDB connection required for write operations',
      suggestion: 'Please configure MONGODB_URI in your .env file'
    });
  }
  next();
};

// Apply DB check to write routes
app.use('/api/auth', checkDatabaseConnection);
app.use('/api/goals', checkDatabaseConnection);
app.use('/api/tasks', checkDatabaseConnection);
app.use('/api/notes', checkDatabaseConnection);
app.use('/api/reminders', checkDatabaseConnection);
app.use('/api/cold-email', checkDatabaseConnection);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/google-alerts', googleAlertsRoutes);
app.use('/api/scripts', scriptsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/cold-email', coldEmailRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: isMongoConnected ? 'Connected' : 'Disconnected (Demo Mode)',
    message: isMongoConnected ? 'All systems operational' : 'MongoDB not connected'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server after DB connection attempt
const startServer = async () => {
  await connectToMongoDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);

    if (!isMongoConnected) {
      console.log('');
      console.log('📝 SETUP INSTRUCTIONS:');
      console.log('   1. Create a .env file with MONGODB_URI');
      console.log('   2. Ensure MongoDB is running locally or remotely');
      console.log('   3. Restart the server after setup');
      console.log('');
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${PORT} is already in use. Try a different one.`);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
};

startServer();
