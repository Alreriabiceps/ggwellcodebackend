import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiAIService {
  constructor() {
    // Initialize Gemini AI - use environment variable or fallback for demo
    const apiKey = process.env.GEMINI_API_KEY || 'demo-key';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    this.visionModel = this.genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
  }

  // 🎯 AI PROJECT ANALYZER - Revolutionary project analysis
  async analyzeProject(projectData) {
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

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysis = this.parseAIResponse(response.text());
      
      return {
        success: true,
        analysis: {
          ...analysis,
          aiConfidence: this.calculateConfidence(projectData),
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Gemini AI Project Analysis Error:', error);
      return this.getFallbackProjectAnalysis(projectData);
    }
  }

  // 🧠 INTELLIGENT PROVIDER SCORING - Advanced AI scoring
  async scoreProvider(provider, projectRequirements) {
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

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const scoring = this.parseAIResponse(response.text());
      
      return {
        success: true,
        providerId: provider._id,
        aiScore: scoring,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Gemini AI Provider Scoring Error:', error);
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
    return {
      success: true,
      analysis: {
        detectedServices: ['General Construction'],
        complexityScore: 5,
        estimatedCost: { min: 50000, max: 150000, currency: 'PHP' },
        timeframe: '2-4 weeks',
        requiredSkills: ['Licensed Contractor'],
        riskFactors: ['Weather conditions', 'Material availability'],
        aiConfidence: 0.6,
        fallback: true
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
    return {
      success: true,
      imageAnalysis: {
        detectedProblem: 'Unable to analyze image - using fallback analysis',
        detectedServices: ['General Repair'],
        urgencyLevel: 'MEDIUM',
        complexityScore: 5,
        estimatedCost: { min: 2000, max: 10000, currency: 'PHP' },
        timeframe: '1-3 days',
        requiredSkills: ['General Handyman'],
        tools: ['Basic tools'],
        materials: ['Standard materials'],
        imageConfidence: 0,
        recommendedProviderTypes: ['General Contractor'],
        fallback: true
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

  getFallbackImageAnalysis(additionalContext) {
    return {
      success: true,
      imageAnalysis: {
        detectedProblem: 'Unable to analyze image - using fallback analysis',
        detectedServices: ['General Repair'],
        urgencyLevel: 'MEDIUM',
        complexityScore: 5,
        estimatedCost: { min: 2000, max: 10000, currency: 'PHP' },
        timeframe: '1-3 days',
        requiredSkills: ['General Handyman'],
        tools: ['Basic tools'],
        materials: ['Standard materials'],
        imageConfidence: 0,
        recommendedProviderTypes: ['General Contractor'],
        fallback: true
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
        Analyze this image to identify what repair, construction, or service work is needed:
        
        Additional Context: "${additionalContext}"
        
        Please provide a detailed JSON analysis with:
        {
          "detectedProblem": "Clear description of what you see that needs fixing/work",
          "detectedServices": ["Array of specific services needed"],
          "urgencyLevel": "LOW | MEDIUM | HIGH | EMERGENCY",
          "complexityScore": 1-10,
          "estimatedCost": {"min": 0, "max": 0, "currency": "PHP"},
          "timeframe": "Estimated completion time",
          "requiredSkills": ["Specific skills/certifications needed"],
          "tools": ["Tools and equipment needed"],
          "materials": ["Materials that will be needed"],
          "safetyConsiderations": ["Safety concerns to address"],
          "stepByStepProcess": ["Brief steps to complete the work"],
          "preventiveMaintenance": ["How to prevent this issue in future"],
          "imageConfidence": 0-100,
          "recommendedProviderTypes": ["Types of service providers needed"]
        }
        
        Focus on Philippine construction standards and common issues in tropical climate.
        Be specific about the problem and solution.
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
      
      return {
        success: true,
        imageAnalysis: {
          ...analysis,
          analyzedAt: new Date().toISOString(),
          hasImage: true
        }
      };
    } catch (error) {
      console.error('Gemini AI Image Analysis Error:', error);
      return this.getFallbackImageAnalysis(additionalContext);
    }
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