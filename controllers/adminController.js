import { validationResult } from 'express-validator';
import Highlight from '../models/Highlight.js';
import Provider from '../models/Provider.js';
import User from '../models/User.js';
import JobRequest from '../models/JobRequest.js';

/**
 * Get current active highlights
 * GET /api/admin/highlights
 */
export const getHighlights = async (req, res) => {
  try {
    const { status = 'active', limit = 10, page = 1 } = req.query;

    let query = {};
    if (status !== 'all') {
      query.status = status;
    }

    const highlights = await Highlight.find(query)
      .populate('provider', 'businessName user')
      .populate({
        path: 'provider',
        populate: {
          path: 'user',
          select: 'name profileImage'
        }
      })
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Highlight.countDocuments(query);

    res.json({
      success: true,
      data: {
        highlights,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get highlights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get highlights',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Create new highlight
 * POST /api/admin/highlights
 */
export const createHighlight = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.userId;
    const highlightData = { ...req.body, createdBy: userId };

    const highlight = new Highlight(highlightData);
    await highlight.save();

    // Populate for response
    await highlight.populate('provider', 'businessName user');
    await highlight.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Highlight created successfully',
      data: { highlight }
    });

  } catch (error) {
    console.error('Create highlight error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create highlight',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get current active highlights for public display
 * GET /api/admin/public-highlights
 */
export const getPublicHighlights = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const highlights = await Highlight.getCurrentHighlights(parseInt(limit));

    res.json({
      success: true,
      data: {
        highlights,
        count: highlights.length
      }
    });

  } catch (error) {
    console.error('Get public highlights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get public highlights',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update highlight
 * PUT /api/admin/highlights/:id
 */
export const updateHighlight = async (req, res) => {
  try {
    const { id } = req.params;

    const highlight = await Highlight.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('provider', 'businessName user');

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: 'Highlight not found'
      });
    }

    res.json({
      success: true,
      message: 'Highlight updated successfully',
      data: { highlight }
    });

  } catch (error) {
    console.error('Update highlight error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update highlight',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get admin dashboard statistics
 * GET /api/admin/stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProviders,
      totalJobs,
      activeHighlights,
      verifiedProviders,
      completedJobs
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Provider.countDocuments({ isActive: true }),
      JobRequest.countDocuments({ isActive: true }),
      Highlight.countDocuments({ status: 'active' }),
      Provider.countDocuments({ 'verification.isVerified': true, isActive: true }),
      JobRequest.countDocuments({ status: 'completed' })
    ]);

    // Get recent activity
    const recentProviders = await Provider.find({ isActive: true })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentJobs = await JobRequest.find({ isActive: true })
      .populate('client', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProviders,
          totalJobs,
          activeHighlights,
          verifiedProviders,
          completedJobs,
          verificationRate: totalProviders > 0 ? 
            Math.round((verifiedProviders / totalProviders) * 100) : 0,
          completionRate: totalJobs > 0 ? 
            Math.round((completedJobs / totalJobs) * 100) : 0
        },
        recentActivity: {
          providers: recentProviders,
          jobs: recentJobs
        }
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Verify provider
 * POST /api/admin/verify-provider/:id
 */
export const verifyProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, notes } = req.body;
    const adminId = req.user.userId;

    const provider = await Provider.findById(id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    provider.verification.isVerified = verified;
    if (verified) {
      provider.verification.verifiedAt = new Date();
      provider.verification.verifiedBy = adminId;
      
      // Add verified badge
      await provider.addBadge('verified', 'Verified by Bataan Connect team');
    }

    await provider.save();

    res.json({
      success: true,
      message: `Provider ${verified ? 'verified' : 'unverified'} successfully`,
      data: { provider }
    });

  } catch (error) {
    console.error('Verify provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify provider',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get providers pending verification
 * GET /api/admin/pending-verifications
 */
export const getPendingVerifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const providers = await Provider.find({
      'verification.isVerified': false,
      isActive: true
    })
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Provider.countDocuments({
      'verification.isVerified': false,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        providers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending verifications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export default {
  getHighlights,
  createHighlight,
  getPublicHighlights,
  updateHighlight,
  getDashboardStats,
  verifyProvider,
  getPendingVerifications
}; 