import express from 'express';
import { body } from 'express-validator';

import {
  createJob,
  getJobs,
  getJobById,
  applyForJob,
  acceptApplication,
  completeJob,
  getJobSuggestions,
  updateJob,
  deleteJob
} from '../controllers/jobController.js';

import { 
  authenticate, 
  requireClient,
  requireProvider,
  optionalAuth 
} from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation rules
const createJobValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Job title must be between 5 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Job description must be between 20 and 2000 characters'),
  
  body('category')
    .isIn([
      'Construction', 'Electrical', 'Plumbing', 'Carpentry', 'Painting',
      'Roofing', 'Landscaping', 'Cleaning', 'HVAC', 'Solar Installation',
      'Renovation', 'Masonry', 'Welding', 'Interior Design', 'Security Systems', 'Other'
    ])
    .withMessage('Invalid job category'),
  
  body('location.address')
    .trim()
    .notEmpty()
    .withMessage('Job address is required'),
  
  body('location.barangay')
    .trim()
    .notEmpty()
    .withMessage('Barangay is required'),
  
  body('timeline.startDate')
    .isISO8601()
    .withMessage('Valid start date is required')
];

const applyJobValidation = [
  body('proposal')
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Proposal must be between 20 and 1000 characters'),
  
  body('quotedPrice')
    .optional()
    .isNumeric()
    .withMessage('Quoted price must be a number'),
  
  body('estimatedDuration')
    .trim()
    .notEmpty()
    .withMessage('Estimated duration is required')
];

// Routes

/**
 * @route   POST /api/jobs
 * @desc    Create new job request
 * @access  Private (Client)
 */
router.post('/', authenticate, requireClient, createJobValidation, createJob);

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs with filtering
 * @access  Public (Optional auth for personalized results)
 */
router.get('/', optionalAuth, getJobs);

/**
 * @route   GET /api/jobs/:id
 * @desc    Get single job by ID
 * @access  Private
 */
router.get('/:id', authenticate, getJobById);

/**
 * @route   POST /api/jobs/:id/apply
 * @desc    Apply for a job (Provider only)
 * @access  Private (Provider)
 */
router.post('/:id/apply', authenticate, requireProvider, applyJobValidation, applyForJob);

/**
 * @route   POST /api/jobs/:id/accept/:applicationId
 * @desc    Accept job application (Client only)
 * @access  Private (Client)
 */
router.post('/:id/accept/:applicationId', authenticate, acceptApplication);

/**
 * @route   POST /api/jobs/:id/complete
 * @desc    Complete job (Client only)
 * @access  Private (Client)
 */
router.post('/:id/complete', authenticate, completeJob);

/**
 * @route   GET /api/jobs/:id/suggestions
 * @desc    Get AI suggestions for a job
 * @access  Private (Job owner)
 */
router.get('/:id/suggestions', authenticate, getJobSuggestions);

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update job request
 * @access  Private (Job owner)
 */
router.put('/:id', authenticate, updateJob);

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete job request
 * @access  Private (Job owner)
 */
router.delete('/:id', authenticate, deleteJob);

export default router; 