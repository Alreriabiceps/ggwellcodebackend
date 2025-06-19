import express from 'express';
import { body } from 'express-validator';

import {
  getHighlights,
  createHighlight,
  getPublicHighlights,
  updateHighlight,
  getDashboardStats,
  verifyProvider,
  getPendingVerifications
} from '../controllers/adminController.js';

import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation rules
const createHighlightValidation = [
  body('provider')
    .isMongoId()
    .withMessage('Valid provider ID is required'),
  
  body('title')
    .trim()
    .isLength({ min: 5, max: 150 })
    .withMessage('Title must be between 5 and 150 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('type')
    .isIn([
      'featured_provider', 'success_story', 'project_showcase', 'new_member',
      'community_choice', 'seasonal_special', 'emergency_hero', 'innovation_award'
    ])
    .withMessage('Invalid highlight type'),
  
  body('featuredImage')
    .isURL()
    .withMessage('Valid featured image URL is required'),
  
  body('period.startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  
  body('period.endDate')
    .isISO8601()
    .withMessage('Valid end date is required')
];

// Routes

/**
 * @route   GET /api/admin/highlights
 * @desc    Get all highlights (admin view)
 * @access  Private (Admin only)
 */
router.get('/highlights', authenticate, requireAdmin, getHighlights);

/**
 * @route   POST /api/admin/highlights
 * @desc    Create new highlight
 * @access  Private (Admin only)
 */
router.post('/highlights', authenticate, requireAdmin, createHighlightValidation, createHighlight);

/**
 * @route   PUT /api/admin/highlights/:id
 * @desc    Update highlight
 * @access  Private (Admin only)
 */
router.put('/highlights/:id', authenticate, requireAdmin, updateHighlight);

/**
 * @route   GET /api/admin/public-highlights
 * @desc    Get current active highlights for public display
 * @access  Public
 */
router.get('/public-highlights', getPublicHighlights);

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/stats', authenticate, requireAdmin, getDashboardStats);

/**
 * @route   POST /api/admin/verify-provider/:id
 * @desc    Verify or unverify provider
 * @access  Private (Admin only)
 */
router.post('/verify-provider/:id', authenticate, requireAdmin, [
  body('verified')
    .isBoolean()
    .withMessage('Verified status must be boolean'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
], verifyProvider);

/**
 * @route   GET /api/admin/pending-verifications
 * @desc    Get providers pending verification
 * @access  Private (Admin only)
 */
router.get('/pending-verifications', authenticate, requireAdmin, getPendingVerifications);

export default router; 