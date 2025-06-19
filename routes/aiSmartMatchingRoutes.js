import express from 'express';
import multer from 'multer';
import geminiAI from '../services/geminiAI.js';
import mockProviders from '../data/mockProviders.js';

const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// 🎯 AI PROJECT ANALYZER ENDPOINT
router.post('/analyze-project', async (req, res) => {
  try {
    console.log('🎯 AI Project Analysis Request:', req.body);
    
    const projectData = {
      description: req.body.description || '',
      budget: req.body.budget || null,
      timeline: req.body.timeline || 'flexible',
      location: req.body.location || 'Bataan, Philippines',
      category: req.body.category || null,
      urgency: req.body.urgency || 'normal'
    };

    // Validate input
    if (!projectData.description || projectData.description.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Project description must be at least 10 characters long'
      });
    }

    // Analyze project with Gemini AI
    const analysis = await geminiAI.analyzeProject(projectData);
    
    // Add additional insights
    const enhancedAnalysis = {
      ...analysis,
      projectId: `proj_${Date.now()}`,
      analyzedAt: new Date().toISOString(),
      aiPowered: true,
      confidence: analysis.analysis?.aiConfidence || 0.8
    };

    console.log('✅ Project Analysis Complete:', enhancedAnalysis.analysis);
    
    res.json(enhancedAnalysis);
  } catch (error) {
    console.error('❌ Project Analysis Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze project',
      details: error.message
    });
  }
});

// 🧠 SMART PROVIDER MATCHING ENDPOINT
router.post('/find-matches', async (req, res) => {
  try {
    console.log('🧠 Smart Matching Request:', req.body);
    
    const { projectAnalysis, preferences = {}, filters = {} } = req.body;
    
    if (!projectAnalysis) {
      return res.status(400).json({
        success: false,
        error: 'Project analysis is required for matching'
      });
    }

    // Filter providers based on basic criteria
    let availableProviders = mockProviders;
    
    if (filters.municipality) {
      availableProviders = availableProviders.filter(p => 
        p.municipality === filters.municipality
      );
    }
    
    if (filters.category) {
      availableProviders = availableProviders.filter(p => 
        p.category === filters.category
      );
    }
    
    if (filters.verified) {
      availableProviders = availableProviders.filter(p => 
        p.badges?.verified === true
      );
    }

    // Find best matches using AI
    const matchingResults = await geminiAI.findBestMatches(
      projectAnalysis,
      availableProviders,
      preferences
    );

    // Enhance results with additional data
    const enhancedResults = {
      ...matchingResults,
      searchId: `search_${Date.now()}`,
      searchedAt: new Date().toISOString(),
      filters: filters,
      preferences: preferences,
      aiPowered: true
    };

    console.log(`✅ Found ${matchingResults.matches?.length || 0} AI-matched providers`);
    
    res.json(enhancedResults);
  } catch (error) {
    console.error('❌ Smart Matching Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find matches',
      details: error.message
    });
  }
});

// 📊 PROVIDER SCORING ENDPOINT
router.post('/score-provider', async (req, res) => {
  try {
    console.log('📊 Provider Scoring Request:', req.body);
    
    const { providerId, projectRequirements } = req.body;
    
    if (!providerId || !projectRequirements) {
      return res.status(400).json({
        success: false,
        error: 'Provider ID and project requirements are required'
      });
    }

    // Find provider
    const provider = mockProviders.find(p => p._id === providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    // Score provider with AI
    const scoring = await geminiAI.scoreProvider(provider, projectRequirements);
    
    // Add provider data to response
    const enhancedScoring = {
      ...scoring,
      provider: provider,
      scoredAt: new Date().toISOString(),
      aiPowered: true
    };

    console.log(`✅ Provider ${provider.businessName} scored: ${scoring.aiScore?.overallScore || 'N/A'}%`);
    
    res.json(enhancedScoring);
  } catch (error) {
    console.error('❌ Provider Scoring Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to score provider',
      details: error.message
    });
  }
});

// 🔮 PROJECT SUCCESS PREDICTION ENDPOINT
router.post('/predict-success', async (req, res) => {
  try {
    console.log('🔮 Success Prediction Request:', req.body);
    
    const { providerId, projectAnalysis, clientHistory = {} } = req.body;
    
    if (!providerId || !projectAnalysis) {
      return res.status(400).json({
        success: false,
        error: 'Provider ID and project analysis are required'
      });
    }

    // Find provider
    const provider = mockProviders.find(p => p._id === providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    // Predict success with AI
    const prediction = await geminiAI.predictProjectSuccess(
      provider,
      projectAnalysis,
      clientHistory
    );
    
    // Enhance prediction
    const enhancedPrediction = {
      ...prediction,
      provider: {
        id: provider._id,
        name: provider.businessName,
        rating: provider.rating
      },
      predictedAt: new Date().toISOString(),
      aiPowered: true
    };

    console.log(`✅ Success prediction for ${provider.businessName}: ${prediction.prediction?.successProbability || 'N/A'}%`);
    
    res.json(enhancedPrediction);
  } catch (error) {
    console.error('❌ Success Prediction Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict success',
      details: error.message
    });
  }
});

// 💰 PRICING INTELLIGENCE ENDPOINT
router.post('/analyze-pricing', async (req, res) => {
  try {
    console.log('💰 Pricing Analysis Request:', req.body);
    
    const { projectAnalysis, marketFilters = {} } = req.body;
    
    if (!projectAnalysis) {
      return res.status(400).json({
        success: false,
        error: 'Project analysis is required for pricing'
      });
    }

    // Filter providers for market data
    let marketProviders = mockProviders;
    
    if (marketFilters.municipality) {
      marketProviders = marketProviders.filter(p => 
        p.municipality === marketFilters.municipality
      );
    }
    
    if (marketFilters.category) {
      marketProviders = marketProviders.filter(p => 
        p.category === marketFilters.category
      );
    }

    // Analyze pricing with AI
    const pricingAnalysis = await geminiAI.analyzePricing(
      projectAnalysis,
      marketProviders,
      marketFilters
    );
    
    // Add market context
    const enhancedPricing = {
      ...pricingAnalysis,
      marketContext: {
        analyzedProviders: marketProviders.length,
        location: marketFilters.municipality || 'Bataan Province',
        category: marketFilters.category || 'All Categories'
      },
      analyzedAt: new Date().toISOString(),
      aiPowered: true
    };

    console.log(`✅ Pricing analysis complete: ₱${pricingAnalysis.pricing?.fairPriceRange?.min || 'N/A'} - ₱${pricingAnalysis.pricing?.fairPriceRange?.max || 'N/A'}`);
    
    res.json(enhancedPricing);
  } catch (error) {
    console.error('❌ Pricing Analysis Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze pricing',
      details: error.message
    });
  }
});

// 🎯 COMPLETE AI ANALYSIS ENDPOINT (All-in-one)
router.post('/complete-analysis', async (req, res) => {
  try {
    console.log('🎯 Complete AI Analysis Request:', req.body);
    
    const { 
      description, 
      budget, 
      timeline, 
      location = 'Bataan, Philippines',
      preferences = {},
      filters = {}
    } = req.body;

    if (!description || description.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Project description must be at least 10 characters long'
      });
    }

    // Step 1: Analyze Project
    console.log('🔍 Step 1: Analyzing project...');
    const projectData = { description, budget, timeline, location };
    const projectAnalysis = await geminiAI.analyzeProject(projectData);
    
    if (!projectAnalysis.success) {
      throw new Error('Project analysis failed');
    }

    // Step 2: Find Matches
    console.log('🔍 Step 2: Finding matches...');
    let availableProviders = mockProviders;
    
    // Apply filters
    if (filters.municipality) {
      availableProviders = availableProviders.filter(p => 
        p.municipality === filters.municipality
      );
    }
    
    if (filters.category) {
      availableProviders = availableProviders.filter(p => 
        p.category === filters.category
      );
    }

    const matchingResults = await geminiAI.findBestMatches(
      projectAnalysis.analysis,
      availableProviders,
      preferences
    );

    // Step 3: Pricing Analysis
    console.log('🔍 Step 3: Analyzing pricing...');
    const pricingAnalysis = await geminiAI.analyzePricing(
      projectAnalysis.analysis,
      availableProviders,
      filters
    );

    // Combine all results
    const completeAnalysis = {
      success: true,
      analysisId: `complete_${Date.now()}`,
      projectAnalysis: projectAnalysis.analysis,
      matches: matchingResults.matches || [],
      insights: matchingResults.insights || {},
      pricing: pricingAnalysis.pricing || {},
      marketInsights: pricingAnalysis.marketInsights || {},
      totalProviders: availableProviders.length,
      qualifiedMatches: matchingResults.matches?.length || 0,
      analyzedAt: new Date().toISOString(),
      aiPowered: true,
      geminiPowered: true
    };

    console.log(`✅ Complete Analysis Done: ${completeAnalysis.qualifiedMatches} matches found`);
    
    res.json(completeAnalysis);
  } catch (error) {
    console.error('❌ Complete Analysis Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete analysis',
      details: error.message
    });
  }
});

// 📈 AI INSIGHTS ENDPOINT
router.get('/insights', async (req, res) => {
  try {
    const insights = {
      totalProviders: mockProviders.length,
      verifiedProviders: mockProviders.filter(p => p.badges?.verified).length,
      categories: [...new Set(mockProviders.map(p => p.category))].length,
      municipalities: [...new Set(mockProviders.map(p => p.municipality))].length,
      averageRating: mockProviders.reduce((sum, p) => sum + p.rating, 0) / mockProviders.length,
      aiFeatures: {
        projectAnalysis: true,
        smartMatching: true,
        providerScoring: true,
        successPrediction: true,
        pricingIntelligence: true
      },
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      insights,
      aiPowered: true
    });
  } catch (error) {
    console.error('❌ Insights Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get insights'
    });
  }
});

// 📸 AI IMAGE ANALYZER ENDPOINT - Revolutionary photo-based project detection
router.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    console.log('📸 AI Image Analysis Request');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const imageData = {
      data: req.file.buffer.toString('base64'),
      mimeType: req.file.mimetype
    };

    const additionalContext = req.body.description || '';
    
    // Analyze image with Gemini AI Vision
    const analysis = await geminiAI.analyzeProjectImage(imageData, additionalContext);
    
    // Find matching providers based on detected services
    if (analysis.success && analysis.imageAnalysis?.detectedServices) {
      const matchingProviders = mockProviders.filter(provider => 
        analysis.imageAnalysis.detectedServices.some(service => 
          provider.services.some(providerService => 
            providerService.toLowerCase().includes(service.toLowerCase()) ||
            service.toLowerCase().includes(providerService.toLowerCase())
          )
        )
      ).slice(0, 5); // Top 5 matches

      analysis.suggestedProviders = matchingProviders;
      analysis.providerCount = matchingProviders.length;
    }

    const enhancedAnalysis = {
      ...analysis,
      imageId: `img_${Date.now()}`,
      analyzedAt: new Date().toISOString(),
      aiPowered: true,
      imageSize: req.file.size,
      imageFormat: req.file.mimetype
    };

    console.log('✅ Image Analysis Complete:', analysis.imageAnalysis?.detectedProblem || 'Analysis complete');
    
    res.json(enhancedAnalysis);
  } catch (error) {
    console.error('❌ Image Analysis Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze image',
      details: error.message
    });
  }
});

// 🔍 ENHANCED PROJECT ANALYZER - Combines text and image analysis
router.post('/analyze-project-with-image', upload.single('image'), async (req, res) => {
  try {
    console.log('🔍 Enhanced Project Analysis Request');
    
    const projectData = {
      description: req.body.description || '',
      budget: req.body.budget || null,
      timeline: req.body.timeline || 'flexible',
      location: req.body.location || 'Bataan, Philippines'
    };

    let imageData = null;
    if (req.file) {
      imageData = {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype
      };
    }

    // Analyze with both text and image
    const analysis = await geminiAI.analyzeProjectWithImage(projectData, imageData);
    
    // Find matching providers
    if (analysis.success && analysis.analysis?.detectedServices) {
      const matchingProviders = mockProviders.filter(provider => 
        analysis.analysis.detectedServices.some(service => 
          provider.services.some(providerService => 
            providerService.toLowerCase().includes(service.toLowerCase()) ||
            service.toLowerCase().includes(providerService.toLowerCase())
          )
        )
      );

      // Score providers using AI
      const scoredProviders = await Promise.all(
        matchingProviders.slice(0, 10).map(async (provider) => {
          const score = await geminiAI.scoreProvider(provider, analysis.analysis);
          return {
            ...provider,
            aiScore: score.aiScore,
            compatibility: score.aiScore?.overallScore || 0
          };
        })
      );

      // Sort by compatibility score
      scoredProviders.sort((a, b) => b.compatibility - a.compatibility);

      analysis.suggestedProviders = scoredProviders.slice(0, 5);
      analysis.providerCount = scoredProviders.length;
    }

    const enhancedAnalysis = {
      ...analysis,
      analysisId: `enhanced_${Date.now()}`,
      analyzedAt: new Date().toISOString(),
      aiPowered: true,
      hasImage: !!imageData,
      imageSize: req.file?.size || 0
    };

    console.log('✅ Enhanced Analysis Complete with', analysis.suggestedProviders?.length || 0, 'provider matches');
    
    res.json(enhancedAnalysis);
  } catch (error) {
    console.error('❌ Enhanced Analysis Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze project',
      details: error.message
    });
  }
});

export default router; 