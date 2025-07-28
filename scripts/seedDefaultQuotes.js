import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Import models
import User from '../server/models/User.js';
import Quote from '../server/models/Quote.js';
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const defaultQuotes = [
  {
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
    category: "motivation"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "success"
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    category: "inspiration"
  },
  {
    text: "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle",
    category: "motivation"
  },
  {
    text: "Productivity is never an accident. It is always the result of a commitment to excellence.",
    author: "Paul J. Meyer",
    category: "productivity"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    category: "success"
  },
  {
    text: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs",
    category: "leadership"
  },
  {
    text: "Your limitation—it's only your imagination.",
    author: "Unknown",
    category: "motivation"
  },
  {
    text: "Great things never come from comfort zones.",
    author: "Unknown",
    category: "inspiration"
  },
  {
    text: "Dream it. Wish it. Do it.",
    author: "Unknown",
    category: "motivation"
  },
  {
    text: "Success doesn't just find you. You have to go out and get it.",
    author: "Unknown",
    category: "success"
  },
  {
    text: "The harder you work for something, the greater you'll feel when you achieve it.",
    author: "Unknown",
    category: "productivity"
  },
  {
    text: "Dream bigger. Do bigger.",
    author: "Unknown",
    category: "inspiration"
  },
  {
    text: "Don't stop when you're tired. Stop when you're done.",
    author: "Unknown",
    category: "motivation"
  },
  {
    text: "Wake up with determination. Go to bed with satisfaction.",
    author: "Unknown",
    category: "productivity"
  },
  {
    text: "Do something today that your future self will thank you for.",
    author: "Sean Patrick Flanery",
    category: "motivation"
  },
  {
    text: "Little things make big days.",
    author: "Unknown",
    category: "productivity"
  },
  {
    text: "It's going to be hard, but hard does not mean impossible.",
    author: "Unknown",
    category: "motivation"
  },
  {
    text: "Don't wait for opportunity. Create it.",
    author: "Unknown",
    category: "success"
  },
  {
    text: "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
    author: "Unknown",
    category: "inspiration"
  }
];

async function seedDefaultQuotes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/productivity-dashboard';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    
    console.log('✅ Connected to MongoDB');

    // Find or create a system user for default quotes
    let systemUser = await User.findOne({ email: 'system@nexapro.com' });
    
    if (!systemUser) {
      systemUser = new User({
        name: 'System',
        email: 'system@nexapro.com',
        firebaseUid: 'system-user',
        jobTitle: 'System',
        timezone: 'UTC',
        bio: 'System user for default content',
        role: 'admin'
      });
      await systemUser.save();
      console.log('✅ Created system user for default quotes');
    }

    // Clear existing default quotes
    await Quote.deleteMany({ isDefault: true });
    console.log('🧹 Cleared existing default quotes');

    // Insert default quotes
    const quotesToInsert = defaultQuotes.map(quote => ({
      ...quote,
      userId: systemUser._id,
      isDefault: true,
      isActive: true,
      tags: [quote.category]
    }));

    await Quote.insertMany(quotesToInsert);
    console.log(`✅ Inserted ${quotesToInsert.length} default quotes`);

    console.log('');
    console.log('🎉 Default quotes seeded successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   📝 Default Quotes: ${quotesToInsert.length}`);
    console.log(`   👤 System User: ${systemUser.email}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding default quotes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeding script
seedDefaultQuotes();