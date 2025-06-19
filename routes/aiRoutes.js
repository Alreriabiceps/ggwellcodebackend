import express from 'express';
import { body } from 'express-validator';

import {
  extractTags,
  enhanceProfile,
  matchJob,
  generateTags,
  recommendProviders,
  getProfileInsights
} from '../controllers/aiController.js';

import { authenticate, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation rules
const extractTagsValidation = [
  body('businessDescription')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Business description must be between 10 and 1000 characters'),
  
  body('businessName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Business name must be between 1 and 150 characters')
];

const enhanceProfileValidation = [
  body('originalDescription')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Original description must be between 10 and 1000 characters'),
  
  body('businessName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Business name must be between 1 and 150 characters')
];

const matchJobValidation = [
  body('jobId')
    .isMongoId()
    .withMessage('Valid job ID is required'),
  
  body('maxResults')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Max results must be between 1 and 20'),
  
  body('radiusKm')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Radius must be between 1 and 100 km')
];

const generateTagsValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
];

// Routes

/**
 * @route   POST /api/ai/extract-tags
 * @desc    Extract service tags from business description
 * @access  Private
 */
router.post('/extract-tags', authenticate, extractTagsValidation, extractTags);

/**
 * @route   POST /api/ai/enhance-profile
 * @desc    Enhance provider profile description
 * @access  Private
 */
router.post('/enhance-profile', authenticate, enhanceProfileValidation, enhanceProfile);

/**
 * @route   POST /api/ai/match-job
 * @desc    Match job with providers using AI
 * @access  Private
 */
router.post('/match-job', authenticate, matchJobValidation, matchJob);

/**
 * @route   POST /api/ai/generate-job-tags
 * @desc    Generate job tags from title and description
 * @access  Private
 */
router.post('/generate-job-tags', authenticate, generateTagsValidation, generateTags);

/**
 * @route   GET /api/ai/recommend-providers
 * @desc    Get AI-powered provider recommendations
 * @access  Public (Optional auth for personalized results)
 */
router.get('/recommend-providers', optionalAuth, recommendProviders);

/**
 * @route   GET /api/ai/profile-insights/:providerId
 * @desc    Get AI insights for provider profile optimization
 * @access  Private (Provider owner)
 */
router.get('/profile-insights/:providerId', authenticate, getProfileInsights);

export default router; 