const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true // Allow null values but ensure uniqueness when present
  },
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: false, // Not required for Firebase users
    minlength: 6
  },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false; // Firebase users don't have passwords
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);