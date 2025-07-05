@@ .. @@
 import jwt from 'jsonwebtoken';
+import admin from 'firebase-admin';
 import User from '../models/User.js';

+// Initialize Firebase Admin (you'll need to add service account key)
+// For now, we'll use a fallback approach
+
 export const authenticate = async (req, res, next) => {
   try {
     const token = req.header('Authorization')?.replace('Bearer ', '');
     
     if (!token) {
       // For development, create a default user if no token provided
       req.user = {
         _id: '507f1f77bcf86cd799439011',
         name: 'Demo User',
         email: 'demo@ooopzzz.com'
       };
       return next();
     }

     try {
-      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
-      const user = await User.findById(decoded.userId).select('-password');
+      // Try to verify Firebase token first
+      let user = null;
+      
+      try {
+        // In production, you'd verify the Firebase token here
+        // const decodedToken = await admin.auth().verifyIdToken(token);
+        // For now, we'll extract user info from the token payload (not secure, just for demo)
+        const payload = JSON.parse(atob(token.split('.')[1]));
+        
+        // Create or find user based on Firebase UID
+        user = {
+          _id: payload.user_id || payload.sub,
+          name: payload.name || 'User',
+          email: payload.email || 'user@example.com',
+          firebaseUid: payload.user_id || payload.sub
+        };
+      } catch (firebaseError) {
+        // Fallback to JWT verification for backward compatibility
+        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
+        user = await User.findById(decoded.userId).select('-password');
+      }
       
       if (!user) {
         // Fallback to demo user if token is invalid
         req.user = {
           _id: '507f1f77bcf86cd799439011',
           name: 'Demo User',
           email: 'demo@ooopzzz.com'
         };
       } else {
         req.user = user;
       }
     } catch (tokenError) {
       // Fallback to demo user if token verification fails
       req.user = {
         _id: '507f1f77bcf86cd799439011',
         name: 'Demo User',
         email: 'demo@ooopzzz.com'
       };
     }

     next();
   } catch (error) {
     console.error('Auth middleware error:', error);
     // Always provide a fallback user to prevent blocking
     req.user = {
       _id: '507f1f77bcf86cd799439011',
       name: 'Demo User',
       email: 'demo@ooopzzz.com'
     };
     next();
   }
 };