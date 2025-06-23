import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiAIService {
  constructor() {
    // Initialize Gemini AI - use environment variable or fallback for demo
    const apiKey = process.env.GEMINI_API_KEY || 'demo-key';
    
    // Validate API key format
    this.isValidKey = apiKey && apiKey !== 'demo-key' && apiKey.startsWith('AIza') && apiKey.length > 30;
    this.isDemoMode = !this.isValidKey;
    
    // Enhanced startup logging
    console.log('\n🤖 ========================================');
    console.log('🔥 GEMINI AI SERVICE INITIALIZATION');
    console.log('🤖 ========================================');
    console.log('🔑 API Key Length:', apiKey ? apiKey.length : 0);
    console.log('🔑 API Key Format:', apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 8)}` : 'NONE');
    console.log('🔑 API Key Valid:', this.isValidKey ? '✅ YES' : '❌ NO');
    console.log('🤖 Demo Mode:', this.isDemoMode ? '✅ ACTIVE (Fallback responses)' : '❌ DISABLED (Real AI)');
    console.log('🌍 Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'NOT_SET'
    });
    
    if (this.isDemoMode) {
      console.log('⚠️  WARNING: Running in DEMO MODE');
      console.log('📝 All AI responses will be intelligent fallbacks');
      console.log('💡 To enable real AI: Add valid GEMINI_API_KEY to .env file');
      console.log('🔗 Get API key: https://makersuite.google.com/app/apikey');
    } else {
      console.log('🚀 REAL AI MODE ACTIVATED!');
      console.log('✅ Gemini AI initialized successfully');
      console.log('🎯 All AI features will use Google Gemini API');
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      this.visionModel = this.genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    }
    console.log('🤖 ========================================\n');
  }

  // 🎯 AI PROJECT ANALYZER - Revolutionary project analysis
  async analyzeProject(projectData) {
    console.log('\n🔥 =================================');
    console.log('🎯 AI PROJECT ANALYSIS STARTED');
    console.log('🔥 =================================');
    console.log('📊 Project Data:', {
      description: projectData.description?.substring(0, 100) + '...',
      budget: projectData.budget,
      timeline: projectData.timeline,
      location: projectData.location
    });
    console.log('🔑 API Key Status:', this.isValidKey ? '✅ VALID' : '❌ INVALID');
    console.log('🤖 Demo Mode:', this.isDemoMode ? '✅ YES (FALLBACK)' : '❌ NO (REAL AI)');

    // Skip API call if in demo mode
    if (this.isDemoMode) {
      console.log('⚠️  USING FALLBACK - No real AI API call made');
      console.log('🔥 =================================\n');
      return this.getFallbackProjectAnalysis(projectData);
    }

    console.log('🚀 Making REAL Gemini AI API call...');
    const startTime = Date.now();

    try {
      const prompt = `
        Analyze this construction/service project and provide detailed insights:
        
        Project Description: "${projectData.description}"
        Budget Range: ${projectData.budget || 'Not specified'}
        Timeline: ${projectData.timeline || 'Flexible'}
        Location: ${projectData.location || 'Bataan, Philippines'}
        
        Please provide a comprehensive JSON analysis with:
        1. detectedServices: Array of specific services needed
        2. complexityScore: 1-10 scale of project complexity
        3. estimatedCost: {min, max, currency: 'PHP'}
        4. timeframe: Realistic completion time
        5. requiredSkills: Array of specific skills/certifications needed
        6. riskFactors: Potential challenges or risks
        7. materialRequirements: Key materials needed
        8. permitRequirements: Any permits/licenses needed
        9. seasonalConsiderations: Best time to start project
        10. qualityCheckpoints: Key milestones to monitor
        
        Focus on Philippine construction standards and Bataan local conditions.
        Be specific and actionable.
      `;

      console.log('📤 Sending prompt to Gemini AI...');
      console.log('📝 Prompt length:', prompt.length, 'characters');

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log('✅ REAL AI RESPONSE RECEIVED!');
      console.log('⏱️  API Call Duration:', duration, 'ms');
      console.log('📄 Response Length:', responseText.length, 'characters');
      console.log('🔍 Response Preview:', responseText.substring(0, 200) + '...');

      const analysis = this.parseAIResponse(responseText);
      
      console.log('🎯 Analysis Result:', {
        success: true,
        hasDetectedServices: !!analysis.detectedServices,
        hasEstimatedCost: !!analysis.estimatedCost,
        aiConfidence: this.calculateConfidence(projectData)
      });
      console.log('🔥 =================================\n');
      
      return {
        success: true,
        analysis: {
          ...analysis,
          aiConfidence: this.calculateConfidence(projectData),
          generatedAt: new Date().toISOString(),
          apiCallDuration: duration,
          realAI: true
        }
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.error('❌ GEMINI AI API ERROR:');
      console.error('⏱️  Failed after:', duration, 'ms');
      console.error('🚨 Error Type:', error.constructor.name);
      console.error('📝 Error Message:', error.message);
      console.error('🔍 Error Details:', error);
      console.log('🔄 Falling back to intelligent responses...');
      console.log('🔥 =================================\n');
      
      return this.getFallbackProjectAnalysis(projectData);
    }
  }

  // 🧠 INTELLIGENT PROVIDER SCORING - Advanced AI scoring
  async scoreProvider(provider, projectRequirements) {
    console.log('\n⚡ =================================');
    console.log('🧠 AI PROVIDER SCORING STARTED');
    console.log('⚡ =================================');
    console.log('🏢 Provider:', provider.businessName);
    console.log('📍 Location:', provider.municipality);
    console.log('⭐ Rating:', provider.rating);
    console.log('🔑 API Key Status:', this.isValidKey ? '✅ VALID' : '❌ INVALID');
    console.log('🤖 Demo Mode:', this.isDemoMode ? '✅ YES (FALLBACK)' : '❌ NO (REAL AI)');

    // Skip API call if in demo mode
    if (this.isDemoMode) {
      console.log('⚠️  USING FALLBACK SCORING - No real AI API call made');
      console.log('⚡ =================================\n');
      return this.getFallbackProviderScore(provider, projectRequirements);
    }

    console.log('🚀 Making REAL Gemini AI scoring call...');
    const startTime = Date.now();

    try {
      const prompt = `
        Analyze this service provider for the given project requirements:
        
        PROVIDER DATA:
        Name: ${provider.businessName}
        Services: ${provider.services?.join(', ')}
        Experience: ${provider.yearsExperience} years
        Rating: ${provider.rating}/5 (${provider.reviewCount} reviews)
        Location: ${provider.municipality}, Bataan
        Verified: ${provider.badges?.verified ? 'Yes' : 'No'}
        Portfolio: ${provider.portfolio?.length || 0} projects
        Specialties: ${provider.specialties?.join(', ') || 'None specified'}
        
        PROJECT REQUIREMENTS:
        Services Needed: ${projectRequirements.detectedServices?.join(', ')}
        Complexity: ${projectRequirements.complexityScore}/10
        Required Skills: ${projectRequirements.requiredSkills?.join(', ')}
        Budget Range: ₱${projectRequirements.estimatedCost?.min} - ₱${projectRequirements.estimatedCost?.max}
        
        Provide a comprehensive scoring analysis in JSON format:
        {
          "overallScore": 0-100,
          "skillMatch": 0-100,
          "experienceScore": 0-100,
          "reliabilityScore": 0-100,
          "valueScore": 0-100,
          "locationAdvantage": 0-100,
          "portfolioQuality": 0-100,
          "strengths": ["array of key strengths"],
          "concerns": ["array of potential concerns"],
          "recommendation": "HIGHLY_RECOMMENDED | RECOMMENDED | CONSIDER | NOT_RECOMMENDED",
          "matchReason": "Detailed explanation of why this provider is/isn't a good match",
          "pricingExpectation": "Expected price range for this provider",
          "successProbability": 0-100
        }
        
        Be thorough and consider Philippine market conditions.
      `;

      console.log('📤 Sending scoring prompt to Gemini AI...');
      console.log('📝 Prompt length:', prompt.length, 'characters');

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log('✅ REAL AI SCORING RESPONSE RECEIVED!');
      console.log('⏱️  API Call Duration:', duration, 'ms');
      console.log('📄 Response Length:', responseText.length, 'characters');
      console.log('🔍 Response Preview:', responseText.substring(0, 150) + '...');

      const scoring = this.parseAIResponse(responseText);
      
      console.log('🎯 Scoring Result:', {
        providerId: provider._id,
        overallScore: scoring.overallScore,
        recommendation: scoring.recommendation,
        realAI: true
      });
      console.log('⚡ =================================\n');
      
      return {
        success: true,
        providerId: provider._id,
        aiScore: {
          ...scoring,
          realAI: true,
          apiCallDuration: duration
        },
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.error('❌ GEMINI AI SCORING ERROR:');
      console.error('⏱️  Failed after:', duration, 'ms');
      console.error('🚨 Error Type:', error.constructor.name);
      console.error('📝 Error Message:', error.message);
      console.log('🔄 Falling back to intelligent scoring...');
      console.log('⚡ =================================\n');
      
      return this.getFallbackProviderScore(provider, projectRequirements);
    }
  }

  // 🎯 SMART MATCHING ALGORITHM - Find perfect matches
  async findBestMatches(projectAnalysis, providers, clientPreferences = {}) {
    try {
      // Score all providers using AI
      const providerScores = await Promise.all(
        providers.map(provider => this.scoreProvider(provider, projectAnalysis))
      );

      // Advanced matching logic
      const matches = providerScores
        .filter(score => score.success && score.aiScore.overallScore >= 60)
        .sort((a, b) => b.aiScore.overallScore - a.aiScore.overallScore)
        .slice(0, 10); // Top 10 matches

      // Generate matching insights
      const matchingInsights = await this.generateMatchingInsights(matches, projectAnalysis);

      return {
        success: true,
        matches: matches.map(match => ({
          ...match,
          provider: providers.find(p => p._id === match.providerId)
        })),
        insights: matchingInsights,
        totalAnalyzed: providers.length,
        qualifiedMatches: matches.length
      };
    } catch (error) {
      console.error('Smart Matching Error:', error);
      return this.getFallbackMatching(providers);
    }
  }

  // 📊 PREDICTIVE QUALITY ASSESSMENT
  async predictProjectSuccess(provider, project, clientHistory = {}) {
    try {
      const prompt = `
        Predict the success probability of this project combination:
        
        PROVIDER PROFILE:
        - Experience: ${provider.yearsExperience} years
        - Rating: ${provider.rating}/5
        - Completion Rate: ${provider.completionRate || 'Unknown'}%
        - Specializes in: ${provider.specialties?.join(', ')}
        
        PROJECT DETAILS:
        - Complexity: ${project.complexityScore}/10
        - Services: ${project.detectedServices?.join(', ')}
        - Timeline: ${project.timeframe}
        - Risk Factors: ${project.riskFactors?.join(', ')}
        
        Provide prediction in JSON:
        {
          "successProbability": 0-100,
          "riskLevel": "LOW | MEDIUM | HIGH",
          "keySuccessFactors": ["factors that increase success"],
          "potentialChallenges": ["challenges to watch for"],
          "recommendations": ["specific recommendations"],
          "timelineReliability": 0-100,
          "qualityExpectation": 0-100,
          "budgetAccuracy": 0-100
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const prediction = this.parseAIResponse(response.text());
      
      return {
        success: true,
        prediction,
        confidence: this.calculatePredictionConfidence(provider, project)
      };
    } catch (error) {
      console.error('Quality Prediction Error:', error);
      return this.getFallbackPrediction();
    }
  }

  // 💰 DYNAMIC PRICING INTELLIGENCE
  async analyzePricing(project, providers, marketData = {}) {
    try {
      const prompt = `
        Analyze pricing for this project in Bataan, Philippines:
        
        PROJECT: ${project.detectedServices?.join(', ')}
        Complexity: ${project.complexityScore}/10
        Materials: ${project.materialRequirements?.join(', ')}
        
        MARKET CONTEXT:
        - Location: Bataan Province
        - Current economic conditions: Philippine market
        - Available providers: ${providers.length}
        
        Provide pricing analysis in JSON:
        {
          "fairPriceRange": {"min": 0, "max": 0, "currency": "PHP"},
          "marketAverage": 0,
          "budgetBreakdown": {
            "materials": "percentage",
            "labor": "percentage", 
            "permits": "percentage",
            "contingency": "percentage"
          },
          "pricingFactors": ["factors affecting price"],
          "negotiationTips": ["tips for fair negotiation"],
          "redFlags": ["pricing red flags to avoid"],
          "bestValue": "advice for getting best value"
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const pricing = this.parseAIResponse(response.text());
      
      return {
        success: true,
        pricing,
        marketInsights: this.generateMarketInsights(providers)
      };
    } catch (error) {
      console.error('Pricing Analysis Error:', error);
      return this.getFallbackPricing(project);
    }
  }

  // 🎨 GENERATE MATCHING INSIGHTS
  async generateMatchingInsights(matches, projectAnalysis) {
    if (matches.length === 0) {
      return {
        summary: "No qualified providers found for this project.",
        recommendations: ["Expand search criteria", "Consider adjusting budget", "Break project into phases"]
      };
    }

    const topMatch = matches[0];
    const avgScore = matches.reduce((sum, m) => sum + m.aiScore.overallScore, 0) / matches.length;

    return {
      summary: `Found ${matches.length} qualified providers. Top match has ${topMatch.aiScore.overallScore}% compatibility.`,
      topRecommendation: topMatch.aiScore.recommendation,
      averageScore: Math.round(avgScore),
      marketHealth: matches.length >= 5 ? 'EXCELLENT' : matches.length >= 3 ? 'GOOD' : 'LIMITED',
      insights: [
        `Best match: ${topMatch.aiScore.matchReason}`,
        `Average provider score: ${Math.round(avgScore)}%`,
        `Success probability: ${topMatch.aiScore.successProbability}%`
      ]
    };
  }

  // 🛠️ UTILITY METHODS
  parseAIResponse(text) {
    try {
      // Extract JSON from AI response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, create structured response from text
      return this.textToStructuredData(text);
    } catch (error) {
      console.error('AI Response Parsing Error:', error);
      return this.getDefaultStructure();
    }
  }

  textToStructuredData(text) {
    // Convert unstructured AI text to structured data
    return {
      analysis: text,
      structured: false,
      confidence: 0.7
    };
  }

  calculateConfidence(projectData) {
    let confidence = 0.5;
    if (projectData.description?.length > 50) confidence += 0.2;
    if (projectData.budget) confidence += 0.1;
    if (projectData.timeline) confidence += 0.1;
    if (projectData.location) confidence += 0.1;
    return Math.min(confidence, 1.0);
  }

  calculatePredictionConfidence(provider, project) {
    let confidence = 0.6;
    if (provider.reviewCount > 10) confidence += 0.1;
    if (provider.badges?.verified) confidence += 0.1;
    if (provider.yearsExperience > 5) confidence += 0.1;
    if (project.complexityScore < 7) confidence += 0.1;
    return Math.min(confidence, 1.0);
  }

  generateMarketInsights(providers) {
    return {
      totalProviders: providers.length,
      verifiedProviders: providers.filter(p => p.badges?.verified).length,
      averageRating: providers.reduce((sum, p) => sum + p.rating, 0) / providers.length,
      competitionLevel: providers.length > 10 ? 'HIGH' : providers.length > 5 ? 'MEDIUM' : 'LOW'
    };
  }

  // 🔄 FALLBACK METHODS
  getFallbackProjectAnalysis(projectData) {
    const description = projectData.description?.toLowerCase() || '';
    
    // Enhanced keyword detection for specific items
    const specificDetection = {
      // Construction/House Related - HIGH PRIORITY
      'Construction': {
        keywords: ['house', 'bahay', 'construction', 'building', 'roof', 'bubong', 'wall', 'pader', 'foundation', 'concrete', 'tatapos', 'gawa', 'build', 'extension', 'renovation'],
        services: ['House Construction', 'Roofing', 'Wall Construction', 'Foundation Work'],
        cost: { min: 50000, max: 500000, currency: 'PHP' },
        timeframe: '2-6 months',
        complexity: 8
      },
      
      // Roofing Specific - HIGH PRIORITY  
      'Roofing': {
        keywords: ['roof', 'bubong', 'yero', 'tiles', 'gutter', 'attic', 'ceiling', 'kisame'],
        services: ['Roof Repair', 'Roof Installation', 'Gutter Repair', 'Ceiling Work'],
        cost: { min: 15000, max: 80000, currency: 'PHP' },
        timeframe: '2-4 weeks',
        complexity: 7
      },
      
      // Furniture/Chair Related
      'Furniture Repair': {
        keywords: ['chair', 'chairs', 'table', 'furniture', 'wood', 'wooden', 'upuan', 'mesa', 'cabinet', 'drawer', 'desk', 'shelf', 'sofa', 'couch'],
        services: ['Furniture Repair', 'Chair Repair', 'Wood Restoration', 'Upholstery Repair'],
        cost: { min: 300, max: 2000, currency: 'PHP' },
        timeframe: '1-2 days',
        complexity: 3
      },
      
      // Shoe/Footwear Related
      'Shoe Repair': {
        keywords: ['shoe', 'shoes', 'sneaker', 'sneakers', 'boot', 'boots', 'sandal', 'sandals', 'slipper', 'slippers', 'footwear', 'heel', 'sole', 'lace', 'cobbler', 'zapatos'],
        services: ['Shoe Repair', 'Cobbler Services', 'Sole Replacement', 'Heel Repair'],
        cost: { min: 200, max: 1500, currency: 'PHP' },
        timeframe: '1-3 days',
        complexity: 2
      },
      
      // Plumbing
      'Plumbing': {
        keywords: ['faucet', 'pipe', 'leak', 'drain', 'toilet', 'sink', 'water', 'plumbing', 'shower'],
        services: ['Faucet Repair', 'Pipe Fixing', 'Leak Repair', 'Drain Cleaning'],
        cost: { min: 500, max: 3000, currency: 'PHP' },
        timeframe: '1-2 days',
        complexity: 4
      },
      
      // Electrical  
      'Electrical': {
        keywords: ['wire', 'outlet', 'electricity', 'light', 'electrical', 'power', 'socket', 'switch'],
        services: ['Electrical Repair', 'Wiring', 'Outlet Installation', 'Light Fixture'],
        cost: { min: 800, max: 5000, currency: 'PHP' },
        timeframe: '1-2 days', 
        complexity: 6
      },
      
      // Appliance - More specific keywords
      'Appliance Repair': {
        keywords: ['aircon', 'refrigerator', 'washing machine', 'appliance', 'ac unit', 'fridge', 'washer', 'dryer', 'microwave'],
        services: ['Appliance Repair', 'AC Repair', 'Refrigerator Fix', 'Washing Machine Repair'],
        cost: { min: 1000, max: 8000, currency: 'PHP' },
        timeframe: '1-3 days',
        complexity: 5
      }
    };

    // Find best match
    let bestMatch = null;
    let maxScore = 0;

    Object.entries(specificDetection).forEach(([category, info]) => {
      const matches = info.keywords.filter(keyword => description.includes(keyword)).length;
      const score = matches / info.keywords.length;
      
             // Give higher priority to more specific matches
       let specificity = 1.0;
       if (category === 'Construction') specificity = 1.5;
       if (category === 'Roofing') specificity = 1.4;
       if (category === 'Furniture Repair') specificity = 1.3;
       if (category === 'Shoe Repair') specificity = 1.2;
       const adjustedScore = score * specificity;
      
      if (adjustedScore > maxScore && matches > 0) {
        maxScore = adjustedScore;
        bestMatch = { category, info, confidence: Math.min(0.9, 0.5 + score) };
      }
    });

    // Use best match or default
    const analysis = bestMatch || {
      category: 'General Repair',
      info: {
        services: ['General Repair', 'Maintenance'],
        cost: { min: 1000, max: 5000, currency: 'PHP' },
        timeframe: '1-3 days',
        complexity: 3
      },
      confidence: 0.3
    };

    return {
      success: true,
      analysis: {
        detectedServices: analysis.info.services,
        complexityScore: analysis.info.complexity,
        estimatedCost: analysis.info.cost,
        timeframe: analysis.info.timeframe,
        requiredSkills: [`${analysis.category} Specialist`],
        riskFactors: ['Quality of materials', 'Proper tools required'],
        materialRequirements: ['Standard repair materials'],
        permitRequirements: [],
        seasonalConsiderations: ['Any time of year suitable'],
        qualityCheckpoints: ['Initial assessment', 'Work completion', 'Final inspection'],
        aiConfidence: analysis.confidence,
        generatedAt: new Date().toISOString(),
        realAI: false,
        demoMode: true,
        detectedCategory: analysis.category
      }
    };
  }

  getFallbackProviderScore(provider, requirements) {
    const baseScore = (provider.rating / 5) * 100;
    return {
      success: true,
      providerId: provider._id,
      aiScore: {
        overallScore: Math.round(baseScore),
        skillMatch: 75,
        experienceScore: Math.min(provider.yearsExperience * 5, 100),
        reliabilityScore: Math.round(baseScore),
        recommendation: baseScore > 80 ? 'RECOMMENDED' : 'CONSIDER',
        matchReason: 'Basic compatibility analysis',
        successProbability: Math.round(baseScore),
        fallback: true
      }
    };
  }

  getFallbackMatching(providers) {
    return {
      success: true,
      matches: providers.slice(0, 5).map(provider => ({
        providerId: provider._id,
        provider,
        aiScore: {
          overallScore: Math.round((provider.rating / 5) * 100),
          recommendation: 'CONSIDER',
          fallback: true
        }
      })),
      insights: {
        summary: 'Basic matching results available',
        fallback: true
      }
    };
  }

  getFallbackPrediction() {
    return {
      success: true,
      prediction: {
        successProbability: 75,
        riskLevel: 'MEDIUM',
        keySuccessFactors: ['Clear communication', 'Proper planning'],
        recommendations: ['Monitor progress regularly'],
        fallback: true
      }
    };
  }

  getFallbackPricing(project) {
    return {
      success: true,
      pricing: {
        fairPriceRange: { min: 50000, max: 200000, currency: 'PHP' },
        marketAverage: 125000,
        budgetBreakdown: {
          materials: '60%',
          labor: '30%',
          permits: '5%',
          contingency: '5%'
        },
        fallback: true
      }
    };
  }

  getDefaultStructure() {
    return {
      error: 'Unable to parse AI response',
      fallback: true
    };
  }

  getFallbackImageAnalysis(additionalContext) {
    const context = additionalContext?.toLowerCase() || '';
    
    // Smart image analysis fallback based on context
    let detectedProblem = 'Unable to analyze image - using intelligent fallback analysis';
    let detectedServices = ['General Repair'];
    let urgencyLevel = 'MEDIUM';
    let complexityScore = 5;
    let estimatedCost = { min: 1000, max: 5000, currency: 'PHP' };
    let timeframe = '1-2 days';
    let requiredSkills = ['General Handyman'];
    let tools = ['Basic tools'];
    let materials = ['Standard materials'];
    let recommendedProviderTypes = ['General Contractor'];
    
    // Context-based intelligent fallback
    if (context.includes('faucet') || context.includes('gripo') || context.includes('leak')) {
      detectedProblem = 'Faucet repair needed based on description';
      detectedServices = ['Faucet Repair', 'Plumbing'];
      urgencyLevel = 'HIGH';
      complexityScore = 2;
      estimatedCost = { min: 300, max: 1200, currency: 'PHP' };
      timeframe = '1-2 hours';
      requiredSkills = ['Plumber'];
      tools = ['Wrench set', 'Plumber\'s tape', 'Screwdriver'];
      materials = ['O-rings', 'Faucet parts', 'Sealant'];
      recommendedProviderTypes = ['Plumber', 'Plumbing Specialist'];
    } else if (context.includes('electrical') || context.includes('outlet') || context.includes('switch')) {
      detectedProblem = 'Electrical repair needed based on description';
      detectedServices = ['Electrical Repair'];
      urgencyLevel = 'HIGH';
      complexityScore = 6;
      estimatedCost = { min: 800, max: 3500, currency: 'PHP' };
      timeframe = '2-3 hours';
      requiredSkills = ['Licensed Electrician'];
      tools = ['Multimeter', 'Wire strippers', 'Electrical tape'];
      materials = ['Electrical wires', 'Outlets', 'Circuit breakers'];
      recommendedProviderTypes = ['Licensed Electrician'];
    } else if (context.includes('wall') || context.includes('crack') || context.includes('damage')) {
      detectedProblem = 'Wall repair needed based on description';
      detectedServices = ['Wall Repair', 'Painting'];
      urgencyLevel = 'MEDIUM';
      complexityScore = 4;
      estimatedCost = { min: 1200, max: 6000, currency: 'PHP' };
      timeframe = '1-2 days';
      requiredSkills = ['Painter', 'Mason'];
      tools = ['Sandpaper', 'Paint brushes', 'Putty knife'];
      materials = ['Wall putty', 'Paint', 'Primer'];
      recommendedProviderTypes = ['Painter', 'Construction Worker'];
    }

    return {
      success: true,
      imageAnalysis: {
        detectedProblem,
        detectedServices,
        urgencyLevel,
        complexityScore,
        estimatedCost,
        timeframe,
        requiredSkills,
        tools,
        materials,
        safetyConsiderations: ['Use proper safety equipment', 'Turn off utilities if needed'],
        stepByStepProcess: [
          'Assess the problem area',
          'Gather necessary tools and materials',
          'Follow safety procedures',
          'Complete the repair work',
          'Test and verify the fix'
        ],
        preventiveMaintenance: ['Regular inspection', 'Proper maintenance schedule'],
        imageConfidence: 60, // Reasonable confidence for context-based analysis
        recommendedProviderTypes,
        fallback: true,
        enhancedFallback: true
      }
    };
  }

  combineImageAndTextAnalysis(imageAnalysis, textAnalysis) {
    return {
      detectedServices: [...new Set([...imageAnalysis.detectedServices, ...textAnalysis.detectedServices])],
      complexityScore: Math.max(imageAnalysis.complexityScore, textAnalysis.complexityScore),
      estimatedCost: {
        min: Math.max(imageAnalysis.estimatedCost.min, textAnalysis.estimatedCost.min),
        max: Math.max(imageAnalysis.estimatedCost.max, textAnalysis.estimatedCost.max),
        currency: 'PHP'
      },
      timeframe: textAnalysis.timeframe,
      requiredSkills: [...new Set([...imageAnalysis.requiredSkills, ...textAnalysis.requiredSkills])],
      riskFactors: textAnalysis.riskFactors,
      detectedProblem: imageAnalysis.detectedProblem,
      urgencyLevel: imageAnalysis.urgencyLevel,
      tools: imageAnalysis.tools,
      materials: [...new Set([...imageAnalysis.materials, ...textAnalysis.materialRequirements])],
      safetyConsiderations: imageAnalysis.safetyConsiderations,
      imageConfidence: imageAnalysis.imageConfidence,
      aiConfidence: Math.max(imageAnalysis.imageConfidence / 100, textAnalysis.aiConfidence),
      enhanced: true
    };
  }

  // 📸 AI IMAGE ANALYZER - Revolutionary image-based project detection
  async analyzeProjectImage(imageData, additionalContext = '') {
    try {
      const prompt = `
        You are an expert construction and home repair analyst. Analyze this image to identify what repair, construction, or service work is needed.
        
        Additional Context: "${additionalContext}"
        
        Examine the image carefully and provide a detailed JSON analysis with:
        {
          "detectedProblem": "Clear, specific description of what you see that needs fixing/work",
          "detectedServices": ["Array of specific services needed - be very specific"],
          "urgencyLevel": "LOW | MEDIUM | HIGH | EMERGENCY",
          "complexityScore": 1-10,
          "estimatedCost": {"min": 0, "max": 0, "currency": "PHP"},
          "timeframe": "Realistic completion time",
          "requiredSkills": ["Specific skills/certifications needed"],
          "tools": ["Specific tools and equipment needed"],
          "materials": ["Specific materials that will be needed"],
          "safetyConsiderations": ["Important safety concerns to address"],
          "stepByStepProcess": ["Detailed steps to complete the work"],
          "preventiveMaintenance": ["How to prevent this issue in future"],
          "imageConfidence": 0-100,
          "recommendedProviderTypes": ["Types of service providers needed"],
          "problemCategory": "Plumbing | Electrical | Construction | Appliance | Cleaning | Carpentry | Landscaping | Other",
          "visualEvidence": ["What specific visual clues led to this diagnosis"],
          "additionalRecommendations": ["Extra advice or suggestions"],
          "riskFactors": ["Potential complications or risks"],
          "seasonalConsiderations": ["Best time to do this work in tropical Philippines"]
        }
        
        IMPORTANT GUIDELINES:
        - Focus on Philippine construction standards and common issues in tropical climate
        - Be very specific about the problem - don't be generic
        - Provide realistic pricing for Philippine market
        - Consider local materials and labor costs
        - Account for humidity, rain, and tropical conditions
        - Identify specific brands or types of fixtures if visible
        - Note any code violations or safety hazards
        - Consider accessibility and working conditions
        - Provide actionable, practical advice
        
        If you see:
        - Plumbing issues: Identify specific fixture, leak location, pipe type, water damage
        - Electrical problems: Note outlet types, wiring condition, safety hazards
        - Structural issues: Assess damage extent, materials needed, structural integrity
        - Appliances: Identify brand, model if possible, specific malfunction
        - Damage: Determine cause, extent, required repairs
        
        Be extremely detailed and practical in your analysis.
      `;

      const imageParts = [
        {
          inlineData: {
            data: imageData.data,
            mimeType: imageData.mimeType
          }
        }
      ];

      const result = await this.visionModel.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const analysis = this.parseAIResponse(response.text());
      
      // Enhance the analysis with Philippine-specific insights
      const enhancedAnalysis = this.enhanceWithLocalInsights(analysis);
      
      return {
        success: true,
        imageAnalysis: {
          ...enhancedAnalysis,
          analyzedAt: new Date().toISOString(),
          hasImage: true,
          realAI: true,
          geminiVision: true
        }
      };
    } catch (error) {
      console.error('Gemini AI Image Analysis Error:', error);
      return this.getFallbackImageAnalysis(additionalContext);
    }
  }

  // 🇵🇭 ENHANCE WITH LOCAL INSIGHTS - Add Philippine-specific context
  enhanceWithLocalInsights(analysis) {
    // Add local pricing adjustments
    if (analysis.estimatedCost) {
      // Adjust pricing for Philippine market reality
      const category = analysis.problemCategory?.toLowerCase();
      
      if (category === 'plumbing') {
        // Philippine plumbing cost adjustments
        if (analysis.detectedServices?.some(s => s.toLowerCase().includes('faucet'))) {
          analysis.estimatedCost = { min: 300, max: 2000, currency: 'PHP' };
        } else if (analysis.detectedServices?.some(s => s.toLowerCase().includes('pipe'))) {
          analysis.estimatedCost = { min: 800, max: 5000, currency: 'PHP' };
        }
      } else if (category === 'electrical') {
        if (analysis.detectedServices?.some(s => s.toLowerCase().includes('outlet'))) {
          analysis.estimatedCost = { min: 500, max: 2500, currency: 'PHP' };
        } else if (analysis.detectedServices?.some(s => s.toLowerCase().includes('wiring'))) {
          analysis.estimatedCost = { min: 2000, max: 15000, currency: 'PHP' };
        }
      } else if (category === 'appliance') {
        if (analysis.detectedServices?.some(s => s.toLowerCase().includes('aircon'))) {
          analysis.estimatedCost = { min: 1000, max: 8000, currency: 'PHP' };
        }
      }
    }

    // Add Philippine-specific considerations
    analysis.localConsiderations = [
      'Consider monsoon season timing',
      'Use materials suitable for high humidity',
      'Account for local building codes',
      'Consider availability of parts in Philippines'
    ];

    // Add common Philippine provider types
    if (analysis.recommendedProviderTypes) {
      const category = analysis.problemCategory?.toLowerCase();
      if (category === 'plumbing') {
        analysis.recommendedProviderTypes = ['Licensed Plumber', 'TESDA Certified Plumber', 'Master Plumber'];
      } else if (category === 'electrical') {
        analysis.recommendedProviderTypes = ['Licensed Electrician', 'TESDA Certified Electrician', 'Electrical Contractor'];
      } else if (category === 'construction') {
        analysis.recommendedProviderTypes = ['Licensed Contractor', 'PCAB Licensed Builder', 'Construction Specialist'];
      }
    }

    return analysis;
  }

  // 🔍 ENHANCED PROJECT ANALYZER - Combines text and image analysis
  async analyzeProjectWithImage(projectData, imageData = null) {
    try {
      let imageAnalysis = null;
      
      // First, analyze the image if provided
      if (imageData) {
        const imageResult = await this.analyzeProjectImage(imageData, projectData.description);
        if (imageResult.success) {
          imageAnalysis = imageResult.imageAnalysis;
        }
      }

      // Then analyze the text description
      const textAnalysis = await this.analyzeProject(projectData);
      
      // Combine both analyses for enhanced results
      if (imageAnalysis && textAnalysis.success) {
        const combinedAnalysis = this.combineImageAndTextAnalysis(imageAnalysis, textAnalysis.analysis);
        
        return {
          success: true,
          analysis: combinedAnalysis,
          hasImage: true,
          imageAnalysis,
          textAnalysis: textAnalysis.analysis
        };
      }
      
      // Return text analysis if no image or image analysis failed
      return textAnalysis;
    } catch (error) {
      console.error('Enhanced Project Analysis Error:', error);
      return this.getFallbackProjectAnalysis(projectData);
    }
  }
}

export default new GeminiAIService(); 