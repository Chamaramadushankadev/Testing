import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import fs from 'fs';
import User from '../models/User.js';

// ✅ Load Firebase service account credentials from file
const serviceAccount = JSON.parse(
  fs.readFileSync(new URL('../../config/firebaseServiceAccount.json', import.meta.url), 'utf8')
);

// ✅ Initialize Firebase Admin SDK once
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('🔥 Firebase Admin SDK initialized');
  } catch (error) {
    console.log('⚠️ Firebase Admin SDK initialization failed, using basic token decode');
  }
}

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    let user = null;
    let firebaseUid = null;
    let email = null;
    let name = null;

    try {
      // 🔐 Try Firebase Admin SDK verification
      if (admin.apps.length > 0) {
        try {
          const decodedToken = await admin.auth().verifyIdToken(token);
          firebaseUid = decodedToken.uid;
          email = decodedToken.email;
          name = decodedToken.name || email?.split('@')[0] || 'User';
          console.log('🔥 Firebase token verified via Admin SDK:', email);
        } catch {
          console.log('Firebase Admin verification failed, trying basic decode...');
        }
      }

      // 🔐 Basic decode fallback
      if (!firebaseUid && token.includes('.')) {
        try {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
          firebaseUid = payload.user_id || payload.sub;
          email = payload.email;
          name = payload.name || email?.split('@')[0] || 'User';
          console.log('🔑 Firebase token decoded (basic):', email);
        } catch {
          console.log('Basic token decode failed, trying JWT...');
        }
      }

      // ✅ Find or create MongoDB user
      if (firebaseUid && email) {
        user = await User.findOne({ firebaseUid });
        if (!user) {
          user = new User({
            firebaseUid,
            name,
            email,
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
          await user.save();
          console.log('✅ Created new user in MongoDB:', email);
        } else {
          console.log('✅ Found existing user in MongoDB:', email);
        }
      }

      // 🔐 JWT fallback (legacy support)
      if (!user) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          user = await User.findById(decoded.userId).select('-password');
          console.log('🔑 JWT token verified for user:', user?.email);
        } catch {
          console.log('JWT verification failed');
        }
      }

      if (!user || !user._id) {
        console.log('❌ No valid user found for token');
        return res.status(401).json({ message: 'Invalid token or user not found' });
      }

      // Always return the most up-to-date user data
      req.user = user;
      console.log(`✅ User authenticated: ${user.email} (ID: ${user._id}) - Plan: ${user.plan}`);
      next();
    } catch (err) {
      console.error('Token verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    // 🔓 Skip authorization for now
    next();
  };
};
