import { validationResult } from 'express-validator';
import { 
  extractServiceTags, 
  matchJobWithProviders, 
  enhanceProviderProfile, 
  generateJobTags 
} from '../utils/ai.js';
import Provider from '../models/Provider.js';
import JobRequest from '../models/JobRequest.js';

/**
 * Extract service tags from business description
 * POST /api/ai/extract-tags
 */
export const extractTags = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { businessDescription, businessName } = req.body;

    const result = await extractServiceTags(businessDescription, businessName);

    res.json({
      success: true,
      message: 'Service tags extracted successfully',
      data: {
        categories: result.categories,
        specialties: result.specialties,
        confidence: result.confidence,
        suggestions: {
          primaryCategory: result.categories[0],
          alternativeCategories: result.categories.slice(1),
          recommendedSpecialties: result.specialties.slice(0, 5)
        }
      }
    });

  } catch (error) {
    console.error('Extract tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extract service tags',
      error: process.env.NODE_ENV === 'development' ? error.message : 'AI service temporarily unavailable'
    });
  }
};

/**
 * Enhance provider profile description
 * POST /api/ai/enhance-profile
 */
export const enhanceProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      originalDescription, 
      businessName, 
      services, 
      experience, 
      location 
    } = req.body;

    const providerData = {
      businessName,
      services: Array.isArray(services) ? services.join(', ') : services,
      experience,
      location: typeof location === 'object' ? 
        `${location.barangay}, ${location.municipality}` : location
    };

    const enhancedDescription = await enhanceProviderProfile(
      originalDescription, 
      providerData
    );

    res.json({
      success: true,
      message: 'Profile description enhanced successfully',
      data: {
        original: originalDescription,
        enhanced: enhancedDescription,
        improvements: [
          'More professional tone',
          'Clear value proposition',
          'Call-to-action included',
          'Local appeal enhanced'
        ]
      }
    });

  } catch (error) {
    console.error('Enhance profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enhance profile description',
      error: process.env.NODE_ENV === 'development' ? error.message : 'AI service temporarily unavailable'
    });
  }
};

/**
 * Match job with providers using AI
 * POST /api/ai/match-job
 */
export const matchJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { jobId, maxResults = 5, radiusKm = 20 } = req.body;
    const userId = req.user.userId;

    // Find the job
    const job = await JobRequest.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user owns the job
    if (job.client.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to get matches for this job'
      });
    }

    // Find nearby providers in the same category
    const nearbyProviders = await Provider.findNearby(
      job.location.coordinates.latitude,
      job.location.coordinates.longitude,
      radiusKm,
      { 
        'services.category': job.category,
        'verification.isVerified': true // Prioritize verified providers
      }
    );

    if (nearbyProviders.length === 0) {
      return res.json({
        success: true,
        message: 'No suitable providers found in the area',
        data: {
          matches: [],
          searchCriteria: {
            category: job.category,
            location: `${job.location.barangay}, ${job.location.municipality}`,
            radius: `${radiusKm}km`
          }
        }
      });
    }

    // Use AI to match and rank providers
    const matches = await matchJobWithProviders(job, nearbyProviders);

    // Get detailed provider information for matches
    const detailedMatches = await Promise.all(
      matches.slice(0, maxResults).map(async (match) => {
        const provider = await Provider.findById(match.providerId)
          .populate('user', 'name profileImage')
          .lean();

        if (!provider) return null;

        // Calculate distance
        const distance = provider.location && provider.location.coordinates ? 
          Math.round(
            Math.sqrt(
              Math.pow(provider.location.coordinates.latitude - job.location.coordinates.latitude, 2) +
              Math.pow(provider.location.coordinates.longitude - job.location.coordinates.longitude, 2)
            ) * 111 // Rough km conversion
          ) : null;

        return {
          provider: {
            id: provider._id,
            businessName: provider.businessName,
            businessDescription: provider.businessDescription,
            user: provider.user,
            services: provider.services,
            ratings: provider.ratings,
            badges: provider.badges,
            location: provider.location,
            experience: provider.experience,
            contact: provider.contact,
            distance: distance ? `${distance}km away` : 'Distance unknown'
          },
          matchScore: match.matchScore,
          reasons: match.reasons,
          concerns: match.concerns || [],
          recommendationLevel: match.matchScore >= 80 ? 'Highly Recommended' :
                              match.matchScore >= 60 ? 'Recommended' : 'Consider'
        };
      })
    );

    // Filter out null matches
    const validMatches = detailedMatches.filter(match => match !== null);

    // Update job with AI suggestions
    job.aiSuggestions = validMatches.map(match => ({
      provider: match.provider.id,
      matchScore: match.matchScore,
      reasons: match.reasons,
      generatedAt: new Date()
    }));
    await job.save();

    res.json({
      success: true,
      message: `Found ${validMatches.length} matching providers`,
      data: {
        matches: validMatches,
        jobDetails: {
          title: job.title,
          category: job.category,
          location: `${job.location.barangay}, ${job.location.municipality}`,
          urgency: job.urgency,
          budget: job.budget
        },
        searchCriteria: {
          category: job.category,
          radius: `${radiusKm}km`,
          priorityFilters: ['verified', 'high_rating', 'nearby']
        }
      }
    });

  } catch (error) {
    console.error('Match job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to match job with providers',
      error: process.env.NODE_ENV === 'development' ? error.message : 'AI service temporarily unavailable'
    });
  }
};

/**
 * Generate job tags from title and description
 * POST /api/ai/generate-job-tags
 */
export const generateTags = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description } = req.body;

    const tags = await generateJobTags(title, description);

    res.json({
      success: true,
      message: 'Job tags generated successfully',
      data: {
        tags,
        count: tags.length,
        suggestions: {
          skills: tags.filter(tag => 
            ['skill', 'technique', 'method'].some(s => tag.toLowerCase().includes(s))
          ),
          materials: tags.filter(tag => 
            ['material', 'tool', 'equipment'].some(s => tag.toLowerCase().includes(s))
          ),
          complexity: tags.filter(tag => 
            ['simple', 'complex', 'advanced', 'basic'].some(s => tag.toLowerCase().includes(s))
          )
        }
      }
    });

  } catch (error) {
    console.error('Generate tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate job tags',
      error: process.env.NODE_ENV === 'development' ? error.message : 'AI service temporarily unavailable'
    });
  }
};

/**
 * Get AI-powered provider recommendations based on user preferences
 * GET /api/ai/recommend-providers
 */
export const recommendProviders = async (req, res) => {
  try {
    const {
      category,
      location,
      budget,
      urgency = 'medium',
      latitude,
      longitude,
      limit = 10
    } = req.query;

    let query = { 
      isActive: true,
      'verification.isVerified': true 
    };

    // Category filter
    if (category && category !== 'all') {
      query['services.category'] = category;
    }

    // Location-based search
    let providers;
    if (latitude && longitude) {
      providers = await Provider.findNearby(
        parseFloat(latitude),
        parseFloat(longitude),
        20, // 20km radius
        query
      );
    } else {
      providers = await Provider.find(query)
        .populate('user', 'name profileImage')
        .sort({ 'ratings.average': -1, 'statistics.projectsCompleted': -1 })
        .limit(parseInt(limit));
    }

    // AI-powered scoring based on multiple factors
    const scoredProviders = providers.map(provider => {
      let score = 0;
      let reasons = [];

      // Rating score (30%)
      const ratingScore = (provider.ratings.average / 5) * 30;
      score += ratingScore;
      if (provider.ratings.average >= 4.5) {
        reasons.push('Excellent ratings');
      }

      // Experience score (25%)
      const experienceYears = provider.experience?.years || 0;
      const experienceScore = Math.min(experienceYears / 10, 1) * 25;
      score += experienceScore;
      if (experienceYears >= 5) {
        reasons.push('Experienced professional');
      }

      // Badge score (20%)
      const badgeCount = provider.badges.length;
      const badgeScore = Math.min(badgeCount / 3, 1) * 20;
      score += badgeScore;
      if (provider.badges.some(b => b.type === 'verified')) {
        reasons.push('Verified provider');
      }

      // Response time score (15%)
      let responseScore = 0;
      if (provider.availability?.responseTime === 'within_hour') {
        responseScore = 15;
        reasons.push('Quick response time');
      } else if (provider.availability?.responseTime === 'within_day') {
        responseScore = 10;
      } else {
        responseScore = 5;
      }
      score += responseScore;

      // Project completion score (10%)
      const completionScore = Math.min(provider.statistics.projectsCompleted / 20, 1) * 10;
      score += completionScore;
      if (provider.statistics.projectsCompleted >= 10) {
        reasons.push('Proven track record');
      }

      return {
        provider,
        score: Math.round(score),
        reasons,
        recommendationLevel: score >= 80 ? 'Highly Recommended' :
                            score >= 60 ? 'Recommended' : 'Good Option'
      };
    });

    // Sort by score and take top results
    const topRecommendations = scoredProviders
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      message: `Found ${topRecommendations.length} recommended providers`,
      data: {
        recommendations: topRecommendations,
        criteria: {
          category: category || 'All categories',
          location: location || 'Bataan',
          urgency,
          budget: budget || 'Any budget'
        },
        aiInsights: {
          totalEvaluated: providers.length,
          averageScore: Math.round(
            scoredProviders.reduce((sum, p) => sum + p.score, 0) / scoredProviders.length
          ),
          topFactors: ['Ratings', 'Experience', 'Verification', 'Response Time']
        }
      }
    });

  } catch (error) {
    console.error('Recommend providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate provider recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'AI service temporarily unavailable'
    });
  }
};

/**
 * Get AI insights for a provider's profile optimization
 * GET /api/ai/profile-insights/:providerId
 */
export const getProfileInsights = async (req, res) => {
  try {
    const { providerId } = req.params;
    const userId = req.user.userId;

    const provider = await Provider.findById(providerId).populate('user');
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Only provider owner can view insights
    if (provider.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view profile insights'
      });
    }

    // Generate insights based on profile completeness and performance
    const insights = {
      completenessScore: 0,
      strengths: [],
      improvements: [],
      recommendations: []
    };

    // Profile completeness analysis
    let completenessFactors = 0;
    const totalFactors = 10;

    if (provider.businessName) completenessFactors++;
    if (provider.businessDescription && provider.businessDescription.length > 50) {
      completenessFactors++;
      insights.strengths.push('Detailed business description');
    } else {
      insights.improvements.push('Add a more detailed business description');
    }

    if (provider.services && provider.services.length > 0) {
      completenessFactors++;
      insights.strengths.push(`Offers ${provider.services.length} services`);
    } else {
      insights.improvements.push('Add service offerings');
    }

    if (provider.portfolio && provider.portfolio.length > 0) {
      completenessFactors++;
      insights.strengths.push('Has portfolio items');
    } else {
      insights.improvements.push('Add portfolio examples');
    }

    if (provider.experience && provider.experience.years > 0) {
      completenessFactors++;
      insights.strengths.push(`${provider.experience.years} years of experience`);
    }

    if (provider.contact && provider.contact.phone) completenessFactors++;
    if (provider.verification && provider.verification.isVerified) {
      completenessFactors++;
      insights.strengths.push('Verified provider');
    } else {
      insights.improvements.push('Complete verification process');
    }

    if (provider.badges && provider.badges.length > 0) {
      completenessFactors++;
      insights.strengths.push(`Earned ${provider.badges.length} badges`);
    }

    if (provider.ratings && provider.ratings.count > 0) {
      completenessFactors++;
      insights.strengths.push(`${provider.ratings.average}/5 rating from ${provider.ratings.count} reviews`);
    } else {
      insights.improvements.push('Encourage clients to leave reviews');
    }

    if (provider.availability && provider.availability.responseTime) {
      completenessFactors++;
    }

    insights.completenessScore = Math.round((completenessFactors / totalFactors) * 100);

    // Performance-based recommendations
    if (provider.statistics.profileViews < 10) {
      insights.recommendations.push('Optimize profile for better visibility');
    }

    if (provider.ratings.average < 4.0 && provider.ratings.count > 0) {
      insights.recommendations.push('Focus on improving service quality');
    }

    if (provider.statistics.jobMatches < 5) {
      insights.recommendations.push('Apply for more relevant jobs to increase visibility');
    }

    if (!provider.isPremium) {
      insights.recommendations.push('Consider premium membership for enhanced visibility');
    }

    res.json({
      success: true,
      data: {
        insights,
        profileStats: {
          completeness: `${insights.completenessScore}%`,
          totalViews: provider.statistics.profileViews,
          jobMatches: provider.statistics.jobMatches,
          projectsCompleted: provider.statistics.projectsCompleted,
          responseRate: `${provider.statistics.responseRate}%`
        },
        nextSteps: insights.improvements.slice(0, 3)
      }
    });

  } catch (error) {
    console.error('Get profile insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate profile insights',
      error: process.env.NODE_ENV === 'development' ? error.message : 'AI service temporarily unavailable'
    });
  }
};

/**
 * 🚀 ANALYZE PROJECT WITH IMAGES - Real Gemini AI Analysis
 * POST /api/ai/analyze-project
 */
export const analyzeProject = async (req, res) => {
  try {
    console.log('\n🎯 =================================');
    console.log('🚀 AI PROJECT ANALYSIS ENDPOINT HIT');
    console.log('🎯 =================================');

    const { description, budget, timeline, location, hasImages } = req.body;
    const images = req.files; // Multer provides uploaded files

    console.log('📊 Request Data:', {
      description: description?.substring(0, 100) + '...',
      budget,
      timeline,
      location,
      hasImages,
      imageCount: images ? images.length : 0
    });

    // Import Gemini AI service
    const GeminiAIService = (await import('../services/geminiAI.js')).default;

    const projectData = {
      description: description || 'Project analysis from uploaded images',
      budget: budget || 'Open budget',
      timeline: timeline || 'Flexible',
      location: location || 'Bataan, Philippines'
    };

    let analysisResult;

    // 📸 HANDLE IMAGE ANALYSIS
    if (images && images.length > 0) {
      console.log('🖼️  Processing', images.length, 'images with Gemini Vision AI');
      
      // Process first image with Gemini Vision
      const firstImage = images[0];
      const imageData = {
        data: firstImage.buffer.toString('base64'),
        mimeType: firstImage.mimetype
      };

      // Use the enhanced project analyzer with image analysis
      analysisResult = await GeminiAIService.analyzeProjectWithImage(projectData, imageData);
    } else {
      // 📝 TEXT-ONLY ANALYSIS
      console.log('📝 Processing text-only analysis with Gemini AI');
      analysisResult = await GeminiAIService.analyzeProject(projectData);
    }

    console.log('✅ Analysis complete:', {
      success: analysisResult.success,
      hasImageAnalysis: !!analysisResult.imageAnalysis,
      realAI: analysisResult.analysis?.realAI
    });

    // Format response for frontend
    const response = {
      success: analysisResult.success,
      projectAnalysis: {
        category: analysisResult.analysis?.detectedCategory || analysisResult.analysis?.detectedServices?.[0] || 'General Construction',
        services: analysisResult.analysis?.detectedServices || [],
        estimatedCost: analysisResult.analysis?.estimatedCost || { min: 1000, max: 10000, currency: 'PHP' },
        complexity: analysisResult.analysis?.complexityScore ? 
          (analysisResult.analysis.complexityScore <= 3 ? 'Low' : 
           analysisResult.analysis.complexityScore <= 6 ? 'Medium' : 'High') : 'Medium',
        timeEstimate: analysisResult.analysis?.timeframe || '1-7 days',
        aiConfidence: analysisResult.analysis?.aiConfidence || 0.85,
        detectedKeywords: analysisResult.analysis?.detectedServices || [],
        realAI: analysisResult.analysis?.realAI || false,
        geminiAnalysis: analysisResult.analysis?.realAI || false,
        demoMode: analysisResult.analysis?.demoMode || false,
        analysisType: images && images.length > 0 ? 'Image + Text' : 'Text Only'
      },
      matches: [], // Would be populated with actual provider matching
      searchStats: {
        totalProviders: 0,
        aiConfidence: analysisResult.analysis?.aiConfidence || 0.85,
        processingTime: analysisResult.analysis?.realAI ? '2.5s' : '0.1s',
        realAI: analysisResult.analysis?.realAI || false
      },
      imageAnalysis: analysisResult.imageAnalysis,
      backendAPI: true,
      timestamp: new Date().toISOString()
    };

    console.log('🎯 =================================\n');

    res.json(response);

  } catch (error) {
    console.error('❌ AI Analysis Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'AI analysis failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'AI service temporarily unavailable',
      fallback: true
    });
  }
};

export default {
  extractTags,
  enhanceProfile,
  matchJob,
  generateTags,
  recommendProviders,
  getProfileInsights,
  analyzeProject
}; 