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

// Mock AI responses for quality-focused features
// In production, these would integrate with OpenAI or similar services

// Generate value proposition for providers
router.post('/value-proposition', async (req, res) => {
  try {
    const { businessName, services, experience, rating, specialties, location } = req.body;
    
    // Mock AI-generated value proposition
    const valueProposition = `${businessName} stands out in ${location} with ${experience} years of proven expertise in ${services.join(', ')}. Our ${rating}-star rating reflects our commitment to premium quality that saves clients money long-term. We specialize in ${specialties?.join(', ') || 'high-quality craftsmanship'} using superior materials and proven techniques that eliminate costly repairs and replacements. Choose us for lasting results that deliver exceptional value.`;
    
    res.json({ valueProposition });
  } catch (error) {
    res.status(500).json({ error: 'AI service temporarily unavailable' });
  }
});

// Analyze quality factors
router.post('/quality-analysis', async (req, res) => {
  try {
    const { provider } = req.body;
    
    // Mock AI quality analysis
    const analysis = {
      qualityScore: Math.min(100, provider.rating * 20 + (provider.yearsExperience >= 10 ? 10 : 0)),
      strengths: [
        `${provider.yearsExperience}+ years of proven experience`,
        'Premium materials and techniques',
        'Comprehensive quality guarantees',
        'Verified track record of excellence'
      ],
      valueJustification: `${provider.businessName} delivers premium quality that lasts 3x longer than cheap alternatives. Our superior materials and expert craftsmanship eliminate the need for costly repairs, saving clients an average of ₱80,000 over 5 years.`,
      competitiveAdvantages: [
        'Guaranteed workmanship with warranties',
        'Premium materials included in pricing',
        'No hidden costs or surprise charges',
        'Expert problem-solving capabilities'
      ]
    };
    
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'AI analysis temporarily unavailable' });
  }
});

// Generate educational content about quality vs cheap work
router.post('/quality-education', async (req, res) => {
  try {
    const { serviceType } = req.body;
    
    // Mock AI educational content
    const education = {
      cheapWorkRisks: [
        'Poor quality materials that fail within 1-2 years',
        'Inexperienced workers causing costly damage',
        'No warranty or guarantee coverage',
        'Hidden costs and unexpected repair bills',
        'Safety hazards from improper installation'
      ],
      qualityBenefits: [
        'Premium materials lasting 5-10+ years',
        'Expert craftsmanship with proven techniques',
        'Comprehensive warranties and guarantees',
        'Transparent pricing with no surprises',
        'Safety-first installation practices'
      ],
      costComparison: {
        cheap5Year: 200000,
        premium5Year: 120000,
        savings: 80000
      },
      redFlags: [
        'Prices significantly below market rate',
        'No proper licensing or insurance',
        'Pressure for immediate cash payment',
        'Reluctance to provide references',
        'No written contracts or warranties'
      ]
    };
    
    res.json(education);
  } catch (error) {
    res.status(500).json({ error: 'AI education service temporarily unavailable' });
  }
});

// Smart quality-based matching
router.post('/quality-match', async (req, res) => {
  try {
    const { requirements } = req.body;
    
    // Mock AI matching recommendations
    const recommendations = {
      providers: [], // Would contain matched providers
      qualityRecommendations: [
        'Prioritize providers with 4.5+ star ratings',
        'Choose verified and certified businesses',
        'Look for comprehensive warranty coverage',
        'Check portfolio of recent similar projects',
        'Verify proper licensing and insurance'
      ],
      budgetGuidance: 'Quality providers typically cost 20-30% more upfront but save 40-60% over 5 years through superior durability, fewer repairs, and comprehensive warranties. Consider the total cost of ownership, not just initial price.'
    };
    
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: 'AI matching temporarily unavailable' });
  }
});

// Generate quality tips
router.post('/quality-tips', async (req, res) => {
  try {
    const { projectType, budget } = req.body;
    
    // Mock AI quality tips
    const tips = [
      'Always verify provider credentials and insurance coverage',
      'Request detailed quotes with material specifications',
      'Check recent portfolio work and client references',
      'Understand warranty terms and what\'s covered',
      'Compare total cost of ownership over 5-10 years',
      'Look for providers who use premium, name-brand materials',
      'Ensure all work meets local building codes and standards'
    ];
    
    res.json({ tips });
  } catch (error) {
    res.status(500).json({ error: 'AI tips service temporarily unavailable' });
  }
});

export default router; 