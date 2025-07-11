import express from 'express';
import mongoose from 'mongoose';
import { Campaign, EmailAccount, Lead, EmailLog } from '../models/ColdEmailSystemIndex.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to transform data
const transformCampaign = (campaign) => {
  const campaignObj = campaign.toObject();
  return {
    ...campaignObj,
    id: campaignObj._id.toString(),
    userId: campaignObj.userId.toString(),
    emailAccountIds: campaignObj.emailAccountIds?.map(id => id.toString()),
    leadIds: campaignObj.leadIds?.map(id => id.toString())
  };
};

// Get all campaigns
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user._id };

    if (status && status !== 'all') filter.status = status;

    const campaigns = await Campaign.find(filter)
      .populate('emailAccountIds', 'name email')
      .sort({ createdAt: -1 });
    
    const transformedCampaigns = campaigns.map(transformCampaign);
    res.json(transformedCampaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single campaign
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid campaign ID format' });
    }

    const campaign = await Campaign.findOne({ _id: id, userId: req.user._id })
      .populate('emailAccountIds', 'name email');
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json(transformCampaign(campaign));
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create campaign
router.post('/', authenticate, async (req, res) => {
  try {
    const campaignData = {
      ...req.body,
      userId: req.user._id
    };

    const campaign = new Campaign(campaignData);
    await campaign.save();
    await campaign.populate('emailAccountIds', 'name email');
    
    res.status(201).json(transformCampaign(campaign));
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update campaign
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid campaign ID format' });
    }

    const campaign = await Campaign.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('emailAccountIds', 'name email');
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json(transformCampaign(campaign));
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete campaign
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid campaign ID format' });
    }

    const campaign = await Campaign.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ message: error.message });
  }
});

// Toggle campaign status (start/pause)
router.patch('/:id/toggle', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid campaign ID format' });
    }

    const campaign = await Campaign.findOne({ _id: id, userId: req.user._id });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status === 'active') {
      campaign.status = 'paused';
    } else if (campaign.status === 'paused' || campaign.status === 'draft') {
      campaign.status = 'active';
      if (!campaign.startedAt) {
        campaign.startedAt = new Date();
      }
    }

    await campaign.save();
    await campaign.populate('emailAccountIds', 'name email');
    
    res.json(transformCampaign(campaign));
  } catch (error) {
    console.error('Error toggling campaign:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get campaign analytics
router.get('/:id/analytics', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid campaign ID format' });
    }

    const campaign = await Campaign.findOne({ _id: id, userId: req.user._id });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Get recent email logs for this campaign
    const emailLogs = await EmailLog.find({ 
      campaignId: campaign._id,
      userId: req.user._id
    })
    .sort({ sentAt: -1 })
    .limit(20)
    .populate('leadId', 'firstName lastName email');

    // Calculate additional analytics
    const analytics = {
      ...campaign.stats,
      openRate: campaign.stats.emailsSent > 0 ? (campaign.stats.opened / campaign.stats.emailsSent) * 100 : 0,
      clickRate: campaign.stats.emailsSent > 0 ? (campaign.stats.clicked / campaign.stats.emailsSent) * 100 : 0,
      replyRate: campaign.stats.emailsSent > 0 ? (campaign.stats.replied / campaign.stats.emailsSent) * 100 : 0,
      bounceRate: campaign.stats.emailsSent > 0 ? (campaign.stats.bounced / campaign.stats.emailsSent) * 100 : 0,
      conversionRate: campaign.stats.emailsSent > 0 ? (campaign.stats.interested / campaign.stats.emailsSent) * 100 : 0,
      emailLogs: emailLogs.map(log => ({
        id: log._id.toString(),
        lead: log.leadId ? {
          id: log.leadId._id.toString(),
          firstName: log.leadId.firstName,
          lastName: log.leadId.lastName,
          email: log.leadId.email
        } : null,
        subject: log.subject,
        status: log.status,
        sentAt: log.sentAt,
        openedAt: log.openedAt,
        clickedAt: log.clickedAt,
        repliedAt: log.repliedAt
      }))
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;