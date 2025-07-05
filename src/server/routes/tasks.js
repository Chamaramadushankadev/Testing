@@ .. @@
 const isDatabaseAvailable = () => mongoose.connection.readyState === 1;

 // Normalize task to include `.id` instead of `._id`
@@ .. @@
 // Get all tasks
 router.get('/', authenticate, async (req, res) => {
   try {
-    if (!isDatabaseAvailable()) return res.json([]);
+    if (!isDatabaseAvailable()) {
+      console.log('❌ Database not available for tasks');
+      return res.status(503).json({ 
+        message: 'Database not available',
+        error: 'Cannot fetch tasks without database connection'
+      });
+    }

+    console.log('📋 Fetching tasks for user:', req.user.email || req.user._id);
     const { status, priority } = req.query;
     const filter = { userId: req.user._id };
     if (status) filter.status = status;
@@ .. @@

     const tasks = await Task.find(filter).sort({ dueDate: 1 });
+    console.log(`✅ Found ${tasks.length} tasks for user`);
     res.json(tasks.map(normalizeTask));
   } catch (error) {
     console.error('Error fetching tasks:', error);
-    res.json([]);
+    res.status(500).json({ 
+      message: 'Error fetching tasks',
+      error: error.message 
+    });
   }
 };