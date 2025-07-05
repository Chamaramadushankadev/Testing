import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Import models
import User from '../server/models/User.js';
import Goal from '../server/models/Goal.js';
import Task from '../server/models/Task.js';
import Note from '../server/models/Note.js';
import Reminder from '../server/models/Reminder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function populateDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    console.log('📊 Database:', mongoose.connection.db.databaseName);

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Goal.deleteMany({}),
      Task.deleteMany({}),
      Note.deleteMany({}),
      Reminder.deleteMany({})
    ]);

    // Create demo user
    console.log('👤 Creating demo user...');
    const demoUser = new User({
      name: 'Demo User',
      email: 'demo@ooopzzz.com',
      password: 'demo123', // Will be hashed by the model
      jobTitle: 'Content Creator',
      timezone: 'UTC-8',
      bio: 'AI enthusiast and content creator focused on productivity tools and automation.',
      settings: {
        notifications: {
          email: true,
          push: true,
          taskReminders: true,
          goalUpdates: true,
          emailCampaigns: true,
          scriptGeneration: true,
          googleAlerts: true,
          weeklySummary: true
        },
        appearance: {
          theme: 'light',
          compactMode: false,
          showAnimations: true
        }
      }
    });
    await demoUser.save();
    console.log('✅ Demo user created');

    // Create sample goals
    console.log('🎯 Creating sample goals...');
    const goals = await Goal.insertMany([
      {
        userId: demoUser._id,
        title: 'Launch Ooopzzz YouTube Channel',
        description: 'Build and grow my YouTube channel focused on AI tools and productivity',
        category: 'Business',
        priority: 'high',
        status: 'active',
        progress: 65,
        dueDate: new Date('2025-03-31'),
        tags: ['youtube', 'content', 'business']
      },
      {
        userId: demoUser._id,
        title: 'Master AI Content Creation',
        description: 'Learn advanced techniques for AI-powered content creation',
        category: 'Learning',
        priority: 'medium',
        status: 'active',
        progress: 40,
        dueDate: new Date('2025-04-15'),
        tags: ['ai', 'learning', 'skills']
      },
      {
        userId: demoUser._id,
        title: 'Build Personal Brand',
        description: 'Establish strong personal brand across social media platforms',
        category: 'Marketing',
        priority: 'medium',
        status: 'active',
        progress: 25,
        dueDate: new Date('2025-06-30'),
        tags: ['branding', 'marketing', 'social-media']
      }
    ]);
    console.log(`✅ Created ${goals.length} goals`);

    // Create sample tasks
    console.log('✅ Creating sample tasks...');
    const tasks = await Task.insertMany([
      {
        userId: demoUser._id,
        goalId: goals[0]._id,
        title: 'Create channel branding',
        description: 'Design logo, banner, and channel art for YouTube channel',
        priority: 'high',
        status: 'completed',
        dueDate: new Date('2025-01-15'),
        completedAt: new Date('2025-01-14'),
        tags: ['design', 'branding']
      },
      {
        userId: demoUser._id,
        goalId: goals[0]._id,
        title: 'Write first 10 video scripts',
        description: 'Create engaging scripts about AI tools for initial video content',
        priority: 'high',
        status: 'in-progress',
        dueDate: new Date('2025-01-30'),
        tags: ['content', 'scripts']
      },
      {
        userId: demoUser._id,
        goalId: goals[0]._id,
        title: 'Set up recording equipment',
        description: 'Purchase and configure camera, microphone, and lighting setup',
        priority: 'medium',
        status: 'pending',
        dueDate: new Date('2025-02-01'),
        tags: ['equipment', 'setup']
      },
      {
        userId: demoUser._id,
        goalId: goals[1]._id,
        title: 'Complete AI course on Coursera',
        description: 'Finish the Machine Learning Specialization course',
        priority: 'medium',
        status: 'in-progress',
        dueDate: new Date('2025-02-15'),
        tags: ['learning', 'ai']
      },
      {
        userId: demoUser._id,
        goalId: goals[1]._id,
        title: 'Practice with ChatGPT API',
        description: 'Build sample applications using OpenAI API',
        priority: 'high',
        status: 'pending',
        dueDate: new Date('2025-01-25'),
        tags: ['api', 'development']
      },
      {
        userId: demoUser._id,
        goalId: goals[2]._id,
        title: 'Create LinkedIn content strategy',
        description: 'Develop content calendar and posting schedule for LinkedIn',
        priority: 'medium',
        status: 'pending',
        dueDate: new Date('2025-01-28'),
        tags: ['linkedin', 'strategy']
      }
    ]);
    console.log(`✅ Created ${tasks.length} tasks`);

    // Create sample notes
    console.log('📝 Creating sample notes...');
    const notes = await Note.insertMany([
      {
        userId: demoUser._id,
        goalId: goals[0]._id,
        title: 'YouTube Video Ideas',
        content: `# Video Ideas for Ooopzzz Channel

## AI Tools Series
- Top 10 AI Tools for Content Creators
- ChatGPT vs Claude: Which is Better?
- AI Image Generation Tutorial with Midjourney
- Building a Chatbot with OpenAI API

## Productivity Content
- My Daily Productivity Routine
- How I Use AI to Save 10 Hours Per Week
- The Ultimate AI-Powered Workspace Setup

## Tutorial Ideas
- Creating YouTube Thumbnails with AI
- Writing Scripts with AI Assistance
- Automating Social Media with AI Tools`,
        tags: ['youtube', 'content', 'ai-tools', 'ideas'],
        isFavorite: true
      },
      {
        userId: demoUser._id,
        goalId: goals[1]._id,
        title: 'AI Learning Resources',
        content: `# AI Learning Path

## Courses Completed
- [x] Introduction to Machine Learning (Coursera)
- [x] Deep Learning Basics (edX)
- [ ] Advanced NLP Techniques
- [ ] Computer Vision Fundamentals

## Books to Read
- "Hands-On Machine Learning" by Aurélien Géron
- "The Hundred-Page Machine Learning Book" by Andriy Burkov
- "AI for People in a Hurry" by Neil Reddy

## Key Concepts to Master
- Neural Networks
- Natural Language Processing
- Computer Vision
- Reinforcement Learning`,
        tags: ['learning', 'ai', 'courses', 'books'],
        isFavorite: false
      },
      {
        userId: demoUser._id,
        goalId: goals[2]._id,
        title: 'Personal Brand Strategy',
        content: `# Personal Brand Development

## Brand Identity
**Mission**: Democratize AI knowledge for content creators
**Vision**: Become the go-to resource for AI-powered productivity
**Values**: Innovation, Education, Accessibility

## Content Pillars
1. **AI Tool Reviews** (40%)
2. **Productivity Tips** (30%)
3. **Behind-the-Scenes** (20%)
4. **Industry News** (10%)

## Platform Strategy
- **YouTube**: Long-form tutorials and reviews
- **LinkedIn**: Professional insights and articles
- **Twitter**: Quick tips and industry commentary
- **Instagram**: Visual content and stories`,
        tags: ['branding', 'strategy', 'content', 'social-media'],
        isFavorite: false
      }
    ]);
    console.log(`✅ Created ${notes.length} notes`);

    // Create sample reminders
    console.log('⏰ Creating sample reminders...');
    const reminders = await Reminder.insertMany([
      {
        userId: demoUser._id,
        title: 'Review YouTube Channel Progress',
        message: 'Check analytics and plan next week\'s content',
        type: 'goal',
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        isCompleted: false,
        entityId: goals[0]._id,
        entityType: 'Goal'
      },
      {
        userId: demoUser._id,
        title: 'Complete Video Script',
        message: 'Finish writing the AI tools comparison script',
        type: 'task',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        isCompleted: false,
        entityId: tasks[1]._id,
        entityType: 'Task'
      },
      {
        userId: demoUser._id,
        title: 'Weekly Planning Session',
        message: 'Plan goals and tasks for the upcoming week',
        type: 'custom',
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        isCompleted: false
      }
    ]);
    console.log(`✅ Created ${reminders.length} reminders`);

    console.log('');
    console.log('🎉 Database populated successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   👤 Users: 1`);
    console.log(`   🎯 Goals: ${goals.length}`);
    console.log(`   ✅ Tasks: ${tasks.length}`);
    console.log(`   📝 Notes: ${notes.length}`);
    console.log(`   ⏰ Reminders: ${reminders.length}`);
    console.log('');
    console.log('🔐 Demo Login Credentials:');
    console.log('   Email: demo@ooopzzz.com');
    console.log('   Password: demo123');
    console.log('');
    console.log('🌐 MongoDB Atlas Database:', mongoose.connection.db.databaseName);

  } catch (error) {
    console.error('❌ Error populating database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas');
    process.exit(0);
  }
}

// Run the population script
populateDatabase();