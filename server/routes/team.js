import express from 'express';
import mongoose from 'mongoose';
import TeamMember from '../models/TeamMember.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { sendTeamInvitationEmail } from '../services/emailService.js';

const router = express.Router();

// Helper function to transform data
const transformTeamMember = (member) => {
  const memberObj = member.toObject();
  return {
    ...memberObj,
    id: memberObj._id.toString(),
    userId: memberObj.userId.toString(),
    invitedBy: memberObj.invitedBy.toString()
  };
};

// Get all team members
router.get('/', authenticate, async (req, res) => {
  try {
    const members = await TeamMember.find({ userId: req.user._id })
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });
    
    const transformedMembers = members.map(transformTeamMember);
    res.json(transformedMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: error.message });
  }
});

// Invite team member
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, email, role, permissions } = req.body;

    // Check if member already exists
    const existingMember = await TeamMember.findOne({
      userId: req.user._id,
      email: email.toLowerCase()
    });

    if (existingMember) {
      return res.status(400).json({ message: 'Team member with this email already exists' });
    }

    // Generate invitation token
    const invitationToken = uuidv4();

    const memberData = {
      userId: req.user._id,
      invitedBy: req.user._id,
      name,
      email: email.toLowerCase(),
      role: role || 'viewer',
      permissions: permissions || {
        dashboard: true,
        goals: true,
        tasks: true,
        notes: true,
        proposals: false,
        reminders: true,
        pomodoro: true,
        scripts: false,
        email: false,
        'cold-email': false,
        finance: false,
        analytics: false,
        settings: false,
        help: true
      },
      invitationToken,
      status: 'pending'
    };

    const member = new TeamMember(memberData);
    await member.save();
    await member.populate('invitedBy', 'name email');

    // Send invitation email (placeholder for now)
    try {
      await sendTeamInvitationEmail({
        to: email,
        inviterName: req.user.name,
        inviterEmail: req.user.email,
        teamMemberName: name,
        invitationToken,
        permissions
      });
      console.log('✅ Invitation email sent to:', email);
    } catch (emailError) {
      console.error('❌ Failed to send invitation email:', emailError);
      // Continue even if email fails
    }

    res.status(201).json(transformTeamMember(member));
  } catch (error) {
    console.error('Error inviting team member:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update team member
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, permissions, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid team member ID format' });
    }

    const member = await TeamMember.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      {
        name,
        email: email?.toLowerCase(),
        role,
        permissions,
        status,
        ...(status === 'active' && !member?.joinedAt ? { joinedAt: new Date() } : {})
      },
      { new: true, runValidators: true }
    ).populate('invitedBy', 'name email');

    if (!member) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    res.json(transformTeamMember(member));
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete team member
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid team member ID format' });
    }

    const member = await TeamMember.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!member) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ message: error.message });
  }
});

// Accept invitation (public route)
router.post('/accept-invitation/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const member = await TeamMember.findOne({ invitationToken: token });
    if (!member) {
      return res.status(404).json({ message: 'Invalid or expired invitation' });
    }

    if (member.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already processed' });
    }

    // Create user account if doesn't exist
    let user = await User.findOne({ email: member.email });
    if (!user) {
      user = new User({
        name: member.name,
        email: member.email,
        password: password,
        role: 'user'
      });
      await user.save();
    }

    // Update member status
    member.status = 'active';
    member.joinedAt = new Date();
    member.invitationToken = undefined; // Remove token after use
    await member.save();

    res.json({ message: 'Invitation accepted successfully', user });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ message: error.message });
  }
});

// Resend invitation
router.post('/:id/resend', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid team member ID format' });
    }

    const member = await TeamMember.findOne({ _id: id, userId: req.user._id });
    if (!member) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    if (member.status !== 'pending') {
      return res.status(400).json({ message: 'Can only resend invitations to pending members' });
    }

    // Generate new invitation token
    member.invitationToken = uuidv4();
    member.invitedAt = new Date();
    await member.save();

    // Resend invitation email
    try {
      await sendTeamInvitationEmail({
        to: member.email,
        inviterName: req.user.name,
        inviterEmail: req.user.email,
        teamMemberName: member.name,
        invitationToken: member.invitationToken,
        permissions: member.permissions
      });
      console.log('✅ Invitation email resent to:', member.email);
    } catch (emailError) {
      console.error('❌ Failed to resend invitation email:', emailError);
      return res.status(500).json({ message: 'Failed to send invitation email' });
    }

    res.json({ message: 'Invitation resent successfully' });
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get team members for task assignment (returns active members only)
router.get('/assignable', authenticate, async (req, res) => {
  try {
    const members = await TeamMember.find({
      userId: req.user._id,
      status: 'active',
      'permissions.tasks': true
    }).select('name email role avatar');

    // Include the current user as well
    const currentUser = {
      id: req.user._id.toString(),
      name: req.user.name,
      email: req.user.email,
      role: 'owner',
      avatar: req.user.avatar || ''
    };

    const assignableMembers = [currentUser, ...members.map(transformTeamMember)];
    res.json(assignableMembers);
  } catch (error) {
    console.error('Error fetching assignable members:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;