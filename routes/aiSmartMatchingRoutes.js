import express from 'express';
import geminiAI from '../services/geminiAI.js';
import mockProviders from '../data/mockProviders.js';

const router = express.Router();

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

export default router; 