@@ .. @@
 // Check if database is available
 const isDatabaseAvailable = () => {
-  return mongoose.connection.readyState === 1;
+  return mongoose.connection.readyState === 1 && mongoose.connection.db;
 };

 // Get all goals for user
 router.get('/', authenticate, async (req, res) => {
   try {
     // Check database connection
     if (!isDatabaseAvailable()) {
-      console.log('Database not available, returning empty array for goals');
-      return res.json([]);
+      console.log('❌ Database not available for goals');
+      return res.status(503).json({ 
+        message: 'Database not available',
+        error: 'Cannot fetch goals without database connection'
+      });
     }

+    console.log('📊 Fetching goals for user:', req.user.email || req.user._id);
     const { status, priority, category } = req.query;
     const filter = { userId: req.user._id };

     if (status) filter.status = status;
@@ .. @@
     if (category) filter.category = category;

     const goals = await Goal.find(filter).sort({ createdAt: -1 });
+    console.log(`✅ Found ${goals.length} goals for user`);
     res.json(goals || []);
   } catch (error) {
     console.error('Error fetching goals:', error);
-    // Return empty array on any error to prevent frontend crashes
-    res.json([]);
+    res.status(500).json({ 
+      message: 'Error fetching goals',
+      error: error.message 
+    });
   }
 };