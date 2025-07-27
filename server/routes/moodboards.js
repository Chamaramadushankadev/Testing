import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import Moodboard from '../models/Moodboard.js';
import UserStorage from '../models/UserStorage.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'nexa-pro-moodboards';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Helper function to transform data
const transformMoodboard = (moodboard) => {
  const moodboardObj = moodboard.toObject();
  return {
    ...moodboardObj,
    id: moodboardObj._id.toString(),
    userId: moodboardObj.userId.toString()
  };
};

// Get all moodboards for user
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('📋 Fetching moodboards for user:', req.user.email, '(ID:', req.user._id, ')');
    const { search, tags } = req.query;
    const filter = { userId: req.user._id };

    if (tags && tags !== 'all') {
      filter.tags = { $in: tags.split(',') };
    }

    let query = Moodboard.find(filter);

    if (search) {
      query = query.find({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const moodboards = await query.sort({ updatedAt: -1 });
    console.log(`✅ Found ${moodboards.length} moodboards for user ${req.user.email}`);
    
    const transformedMoodboards = moodboards.map(transformMoodboard);
    res.json(transformedMoodboards);
  } catch (error) {
    console.error('Error fetching moodboards:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single moodboard
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid moodboard ID format' });
    }

    console.log('📋 Fetching moodboard', id, 'for user:', req.user.email);
    const moodboard = await Moodboard.findOne({ _id: id, userId: req.user._id });

    if (!moodboard) {
      console.log('❌ Moodboard not found or access denied');
      return res.status(404).json({ message: 'Moodboard not found' });
    }

    console.log('✅ Moodboard found for user');
    res.json(transformMoodboard(moodboard));
  } catch (error) {
    console.error('Error fetching moodboard:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new moodboard
router.post('/', authenticate, async (req, res) => {
  try {
    console.log('📋 Creating moodboard for user:', req.user.email, '(ID:', req.user._id, ')');
    
    const moodboardData = {
      ...req.body,
      userId: req.user._id
    };

    const moodboard = new Moodboard(moodboardData);
    await moodboard.save();
    
    console.log('✅ Moodboard created successfully for user:', req.user.email);
    res.status(201).json(transformMoodboard(moodboard));
  } catch (error) {
    console.error('Error creating moodboard:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update moodboard
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid moodboard ID format' });
    }

    console.log('📋 Updating moodboard', id, 'for user:', req.user.email);
    
    const moodboard = await Moodboard.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!moodboard) {
      console.log('❌ Moodboard not found or access denied');
      return res.status(404).json({ message: 'Moodboard not found' });
    }

    console.log('✅ Moodboard updated successfully');
    res.json(transformMoodboard(moodboard));
  } catch (error) {
    console.error('Error updating moodboard:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete moodboard
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid moodboard ID format' });
    }

    console.log('📋 Deleting moodboard', id, 'for user:', req.user.email);
    
    const moodboard = await Moodboard.findOne({ _id: id, userId: req.user._id });
    
    if (!moodboard) {
      console.log('❌ Moodboard not found or access denied');
      return res.status(404).json({ message: 'Moodboard not found' });
    }

    // Delete associated S3 files
    const imageItems = moodboard.items.filter(item => item.type === 'image' && item.metadata?.s3Key);
    
    for (const item of imageItems) {
      try {
        await s3.deleteObject({
          Bucket: BUCKET_NAME,
          Key: item.metadata.s3Key
        }).promise();
        
        // Update user storage
        await UserStorage.findOneAndUpdate(
          { userId: req.user._id },
          {
            $pull: { files: { s3Key: item.metadata.s3Key } },
            $inc: { totalUsed: -item.metadata.fileSize }
          }
        );
      } catch (s3Error) {
        console.error('Error deleting S3 file:', s3Error);
      }
    }

    await Moodboard.findByIdAndDelete(id);
    console.log('✅ Moodboard deleted successfully');
    
    res.json({ message: 'Moodboard deleted successfully' });
  } catch (error) {
    console.error('Error deleting moodboard:', error);
    res.status(500).json({ message: error.message });
  }
});

// Upload image to S3
router.post('/:id/upload', authenticate, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid moodboard ID format' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Check if moodboard exists and user owns it
    const moodboard = await Moodboard.findOne({ _id: id, userId: req.user._id });
    if (!moodboard) {
      return res.status(404).json({ message: 'Moodboard not found' });
    }

    // Check user storage limit
    let userStorage = await UserStorage.findOne({ userId: req.user._id });
    if (!userStorage) {
      userStorage = new UserStorage({ userId: req.user._id });
      await userStorage.save();
    }

    if (userStorage.totalUsed + req.file.size > userStorage.totalLimit) {
      return res.status(400).json({ 
        message: 'Storage limit exceeded. Please upgrade your plan or delete some files.',
        storageUsed: userStorage.totalUsed,
        storageLimit: userStorage.totalLimit
      });
    }

    // Generate unique S3 key
    const fileExtension = req.file.originalname.split('.').pop();
    const s3Key = `moodboards/${req.user._id}/${id}/${uuidv4()}.${fileExtension}`;

    // Upload to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read'
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    // Update user storage
    userStorage.files.push({
      s3Key,
      s3Url: uploadResult.Location,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      moodboardId: id
    });
    userStorage.totalUsed += req.file.size;
    await userStorage.save();

    console.log('✅ Image uploaded to S3:', uploadResult.Location);

    res.json({
      s3Key,
      s3Url: uploadResult.Location,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user storage info
router.get('/storage/info', authenticate, async (req, res) => {
  try {
    let userStorage = await UserStorage.findOne({ userId: req.user._id });
    if (!userStorage) {
      userStorage = new UserStorage({ userId: req.user._id });
      await userStorage.save();
    }

    res.json({
      totalUsed: userStorage.totalUsed,
      totalLimit: userStorage.totalLimit,
      availableSpace: userStorage.totalLimit - userStorage.totalUsed,
      usagePercentage: (userStorage.totalUsed / userStorage.totalLimit) * 100,
      fileCount: userStorage.files.length
    });
  } catch (error) {
    console.error('Error fetching storage info:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete uploaded file
router.delete('/:id/files/:s3Key', authenticate, async (req, res) => {
  try {
    const { id, s3Key } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid moodboard ID format' });
    }

    // Check if moodboard exists and user owns it
    const moodboard = await Moodboard.findOne({ _id: id, userId: req.user._id });
    if (!moodboard) {
      return res.status(404).json({ message: 'Moodboard not found' });
    }

    // Get user storage
    const userStorage = await UserStorage.findOne({ userId: req.user._id });
    if (!userStorage) {
      return res.status(404).json({ message: 'Storage record not found' });
    }

    // Find the file
    const fileRecord = userStorage.files.find(file => file.s3Key === s3Key);
    if (!fileRecord) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete from S3
    try {
      await s3.deleteObject({
        Bucket: BUCKET_NAME,
        Key: s3Key
      }).promise();
    } catch (s3Error) {
      console.error('Error deleting from S3:', s3Error);
    }

    // Update user storage
    await UserStorage.findOneAndUpdate(
      { userId: req.user._id },
      {
        $pull: { files: { s3Key } },
        $inc: { totalUsed: -fileRecord.size }
      }
    );

    console.log('✅ File deleted successfully');
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: error.message });
  }
});

// Extract video embed URL
router.post('/extract-video', authenticate, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    let embedUrl = '';
    let platform = '';

    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
        platform = 'youtube';
      }
    }
    // Instagram
    else if (url.includes('instagram.com')) {
      embedUrl = `${url}embed/`;
      platform = 'instagram';
    }
    // TikTok
    else if (url.includes('tiktok.com')) {
      embedUrl = `https://www.tiktok.com/embed/v2/${extractTikTokId(url)}`;
      platform = 'tiktok';
    }
    // Twitter
    else if (url.includes('twitter.com') || url.includes('x.com')) {
      platform = 'twitter';
      embedUrl = url; // Twitter uses oEmbed, handled differently
    }

    if (!embedUrl) {
      return res.status(400).json({ message: 'Unsupported video platform' });
    }

    res.json({
      embedUrl,
      platform,
      originalUrl: url
    });
  } catch (error) {
    console.error('Error extracting video:', error);
    res.status(500).json({ message: error.message });
  }
});

// Helper functions
function extractYouTubeId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function extractTikTokId(url) {
  const regex = /tiktok\.com\/.*\/video\/(\d+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export default router;