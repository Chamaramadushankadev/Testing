import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      // Try to decode Firebase token (basic decode for demo - in production use Firebase Admin SDK)
      let user = null;
      
      if (token.includes('.')) {
        try {
          // Decode Firebase JWT token
          const payload = JSON.parse(atob(token.split('.')[1]));
          const firebaseUid = payload.user_id || payload.sub;
          const email = payload.email;
          const name = payload.name || email?.split('@')[0] || 'User';
          
          if (firebaseUid && email) {
            // Find or create user in MongoDB based on Firebase UID
            user = await User.findOne({ firebaseUid });
            
            if (!user) {
              // Create new user in MongoDB
              user = new User({
                firebaseUid,
                name,
                email,
                password: 'firebase-auth', // Placeholder since we use Firebase auth
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
            }
          }
        } catch (firebaseError) {
          console.log('Firebase token decode failed, trying JWT...');
        }
      }
      
      // Fallback to JWT verification for backward compatibility
      if (!user) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        user = await User.findById(decoded.userId).select('-password');
      }
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      req.user = user;
      next();
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    // Skip authorization for now in development
    next();
  };
};