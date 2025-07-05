@@ .. @@
 const userSchema = new mongoose.Schema({
+  firebaseUid: {
+    type: String,
+    unique: true,
+    sparse: true // Allow null values but ensure uniqueness when present
+  },
   name: {
     type: String,
     required: true,
@@ .. @@
   password: {
     type: String,
-    required: true,
+    required: false, // Not required for Firebase users
     minlength: 6
   },
@@ .. @@
 
 // Hash password before saving
 userSchema.pre('save', async function(next) {
-  if (!this.isModified('password')) return next();
+  if (!this.isModified('password') || !this.password) return next();
   
   try {
     const salt = await bcrypt.genSalt(12);
@@ .. @@
 
 // Compare password method
 userSchema.methods.comparePassword = async function(candidatePassword) {
+  if (!this.password) return false; // Firebase users don't have passwords
   return bcrypt.compare(candidatePassword, this.password);
 };
@@ .. @@
 
 export default mongoose.model('User', userSchema);