import express from 'express';
import { body } from 'express-validator';

import {
  registerProvider,
  getProviders,
  getProviderById,
  updateProvider,
  getProviderStats,
  searchProviders,
  getMyProvider
} from '../controllers/providerController.js';

import { 
  authenticate, 
  requireProvider, 
  optionalAuth 
} from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation rules
const registerProviderValidation = [
  body('businessName')
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Business name must be between 2 and 150 characters'),
  
  body('businessDescription')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Business description must be between 10 and 1000 characters'),
  
  body('location.barangay')
    .trim()
    .notEmpty()
    .withMessage('Barangay is required'),
  
  body('location.municipality')
    .optional()
    .trim()
    .notEmpty(),
  
  body('contact.phone')
    .matches(/^(\+639|09)\d{9}$/)
    .withMessage('Please enter a valid Philippine phone number'),
  
  body('services')
    .isArray({ min: 1 })
    .withMessage('At least one service must be provided'),
  
  body('services.*.name')
    .trim()
    .notEmpty()
    .withMessage('Service name is required'),
  
  body('services.*.category')
    .isIn([
      'Construction', 'Electrical', 'Plumbing', 'Carpentry', 'Painting',
      'Roofing', 'Landscaping', 'Cleaning', 'HVAC', 'Solar Installation',
      'Renovation', 'Masonry', 'Welding', 'Interior Design', 'Security Systems', 'Other'
    ])
    .withMessage('Invalid service category')
];

const updateProviderValidation = [
  body('businessName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Business name must be between 2 and 150 characters'),
  
  body('businessDescription')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Business description must be between 10 and 1000 characters'),
  
  body('contact.phone')
    .optional()
    .matches(/^(\+639|09)\d{9}$/)
    .withMessage('Please enter a valid Philippine phone number'),
  
  body('services.*.category')
    .optional()
    .isIn([
      'Construction', 'Electrical', 'Plumbing', 'Carpentry', 'Painting',
      'Roofing', 'Landscaping', 'Cleaning', 'HVAC', 'Solar Installation',
      'Renovation', 'Masonry', 'Welding', 'Interior Design', 'Security Systems', 'Other'
    ])
    .withMessage('Invalid service category')
];

// Routes

/**
 * @route   POST /api/providers/register
 * @desc    Register new provider profile
 * @access  Private (Authenticated users)
 */
router.post('/register', authenticate, registerProviderValidation, registerProvider);

/**
 * @route   GET /api/providers
 * @desc    Get all providers with filtering and pagination
 * @access  Public (Optional authentication for personalized results)
 */
router.get('/', optionalAuth, getProviders);

/**
 * @route   POST /api/providers/search
 * @desc    Advanced search providers
 * @access  Public (Optional authentication)
 */
router.post('/search', optionalAuth, searchProviders);

/**
 * @route   GET /api/providers/me
 * @desc    Get current user's provider profile
 * @access  Private (Provider only)
 */
router.get('/me', authenticate, requireProvider, getMyProvider);

/**
 * @route   GET /api/providers/:id
 * @desc    Get single provider by ID
 * @access  Public (Optional authentication for view tracking)
 */
router.get('/:id', optionalAuth, getProviderById);

/**
 * @route   PUT /api/providers/:id
 * @desc    Update provider profile
 * @access  Private (Provider owner or Admin)
 */
router.put('/:id', authenticate, updateProviderValidation, updateProvider);

/**
 * @route   GET /api/providers/:id/stats
 * @desc    Get provider statistics
 * @access  Private (Provider owner only)
 */
router.get('/:id/stats', authenticate, getProviderStats);

export default router; 