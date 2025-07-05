@@ .. @@
 // GET all notes for the authenticated user with optional filters
 router.get('/', authenticate, async (req, res) => {
   try {
+    console.log('📝 Fetching notes for user:', req.user.email || req.user._id);
     const { goalId, tags, search } = req.query;
     const filter = { userId: req.user._id };

@@ .. @@
     }

     const notes = await query.sort({ updatedAt: -1 });
+    console.log(`✅ Found ${notes.length} notes for user`);
     const transformedNotes = notes.map(transformNote);
     res.json(transformedNotes);
   } catch (error) {
@@ .. @@