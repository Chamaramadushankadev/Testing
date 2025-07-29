import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import SocialMediaPost from '../models/SocialMediaPost.js';
import SocialMediaCategory from '../models/SocialMediaCategory.js';
import SocialMediaAccount from '../models/SocialMediaAccount.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'nexapro-social-media';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
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
const transformPost = (post) => {
  const postObj = post.toObject();
  return {
    ...postObj,
    id: postObj._id.toString(),
    userId: postObj.userId.toString(),
    category: postObj.category?.toString()
  };
};

// Get all posts
router.get('/posts', authenticate, async (req, res) => {
  try {
    const { type, platform, status, category, isTemplate } = req.query;
    const filter = { userId: req.user._id };

    if (type) filter.type = type;
    if (platform) filter.platform = platform;
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (isTemplate !== undefined) filter.isTemplate = isTemplate === 'true';

    const posts = await SocialMediaPost.find(filter)
      .populate('category', 'name color')
      .sort({ createdAt: -1 });

    res.json(posts.map(transformPost));
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create post
router.post('/posts', authenticate, async (req, res) => {
  try {
    const postData = {
      ...req.body,
      userId: req.user._id
    };

    const post = new SocialMediaPost(postData);
    await post.save();
    await post.populate('category', 'name color');

    res.status(201).json(transformPost(post));
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update post
router.put('/posts/:id', authenticate, async (req, res) => {
  try {
    const post = await SocialMediaPost.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name color');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(transformPost(post));
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete post
router.delete('/posts/:id', authenticate, async (req, res) => {
  try {
    const post = await SocialMediaPost.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Delete associated S3 files
    if (post.media.images && post.media.images.length > 0) {
      for (const image of post.media.images) {
        if (image.s3Key) {
          try {
            await s3.deleteObject({
              Bucket: BUCKET_NAME,
              Key: image.s3Key
            }).promise();
          } catch (s3Error) {
            console.error('Error deleting S3 file:', s3Error);
          }
        }
      }
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: error.message });
  }
});

// Upload image
router.post('/posts/:id/upload', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const post = await SocialMediaPost.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Generate unique S3 key
    const fileExtension = req.file.originalname.split('.').pop();
    const s3Key = `social-media/${req.user._id}/${req.params.id}/${uuidv4()}.${fileExtension}`;

    // Upload to S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read'
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    // Add image to post
    const imageData = {
      url: uploadResult.Location,
      s3Key,
      filename: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date()
    };

    post.media.images.push(imageData);
    await post.save();

    res.json({
      message: 'Image uploaded successfully',
      image: imageData
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete image
router.delete('/posts/:id/images/:imageId', authenticate, async (req, res) => {
  try {
    const post = await SocialMediaPost.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const imageIndex = post.media.images.findIndex(img => img._id.toString() === req.params.imageId);
    if (imageIndex === -1) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const image = post.media.images[imageIndex];

    // Delete from S3
    if (image.s3Key) {
      try {
        await s3.deleteObject({
          Bucket: BUCKET_NAME,
          Key: image.s3Key
        }).promise();
      } catch (s3Error) {
        console.error('Error deleting from S3:', s3Error);
      }
    }

    // Remove from post
    post.media.images.splice(imageIndex, 1);
    await post.save();

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: error.message });
  }
});

// Categories routes
router.get('/categories', authenticate, async (req, res) => {
  try {
    const categories = await SocialMediaCategory.find({ userId: req.user._id })
      .sort({ name: 1 });

    res.json(categories.map(cat => ({
      ...cat.toObject(),
      id: cat._id.toString(),
      userId: cat.userId.toString()
    })));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/categories', authenticate, async (req, res) => {
  try {
    const categoryData = {
      ...req.body,
      userId: req.user._id
    };

    const category = new SocialMediaCategory(categoryData);
    await category.save();

    res.status(201).json({
      ...category.toObject(),
      id: category._id.toString(),
      userId: category.userId.toString()
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(400).json({ message: error.message });
  }
});

// Accounts routes
router.get('/accounts', authenticate, async (req, res) => {
  try {
    const accounts = await SocialMediaAccount.find({ userId: req.user._id })
      .sort({ platform: 1, accountName: 1 });

    res.json(accounts.map(acc => ({
      ...acc.toObject(),
      id: acc._id.toString(),
      userId: acc.userId.toString()
    })));
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/accounts', authenticate, async (req, res) => {
  try {
    const accountData = {
      ...req.body,
      userId: req.user._id
    };

    const account = new SocialMediaAccount(accountData);
    await account.save();

    res.status(201).json({
      ...account.toObject(),
      id: account._id.toString(),
      userId: account.userId.toString()
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(400).json({ message: error.message });
  }
});

// Generate AI content
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { platform, topic, tone, keywords } = req.body;

    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    let generatedContent = {};

    if (platform === 'youtube') {
      const hooks = {
        witty: `🎯 **Hook**: "What if I told you that ${topic} could change everything... in just 60 seconds?"`,
        emotional: `💫 **Hook**: "This ${topic} story gave me chills... and it might change your life too."`,
        informative: `📚 **Hook**: "Here's everything you need to know about ${topic} in under a minute."`,
        casual: `👋 **Hook**: "Hey everyone! Let's talk about why ${topic} is actually pretty amazing..."`
      };

      generatedContent = {
        script: `${hooks[tone]}

**Value**: 
- Key point 1: ${topic} fundamentals
- Key point 2: Practical applications  
- Key point 3: Real-world examples
- Key point 4: Pro tips and tricks

**CTA**: "Which tip surprised you most? Drop a comment below and don't forget to subscribe for more content like this!"

---
*Generated with AI • ${tone} tone • ${new Date().toLocaleDateString()}*`
      };
    } else {
      // Facebook/Instagram content
      const captions = {
        witty: `Ready to dive into ${topic}? 🚀 Here's what nobody tells you about it... (swipe for the full story!)`,
        emotional: `This ${topic} journey changed everything for me 💫 And it might just change yours too...`,
        informative: `Everything you need to know about ${topic} 📚 Save this post for later!`,
        casual: `Just discovered something cool about ${topic} 👀 Thought you'd want to know...`
      };

      generatedContent = {
        caption: captions[tone],
        hashtags: keywords.split(',').map(k => `#${k.trim().replace(/\s+/g, '')}`).slice(0, 10)
      };
    }

    res.json(generatedContent);
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;