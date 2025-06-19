import OpenAI from 'openai';

// Initialize OpenAI client (conditionally)
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-dummy-key-for-development') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.log('🤖 Running in development mode - AI features will use fallback responses');
}

// Service categories for validation
const SERVICE_CATEGORIES = [
  'Construction', 'Electrical', 'Plumbing', 'Carpentry', 'Painting', 
  'Roofing', 'Landscaping', 'Cleaning', 'HVAC', 'Solar Installation',
  'Renovation', 'Masonry', 'Welding', 'Interior Design', 'Security Systems', 'Other'
];

/**
 * Extract service tags from business description using AI
 * @param {string} businessDescription - The business description text
 * @param {string} businessName - The business name
 * @returns {Promise<Array>} Array of service tags with confidence scores
 */
export const extractServiceTags = async (businessDescription, businessName = '') => {
  try {
    // Use fallback if OpenAI is not available
    if (!openai) {
      console.log('📝 Using fallback service extraction for:', businessName);
      return fallbackServiceExtraction(businessDescription);
    }

    const prompt = `
    You are an AI assistant helping to categorize Filipino service providers in Bataan.
    
    Business Name: ${businessName}
    Business Description: ${businessDescription}
    
    Available Service Categories:
    ${SERVICE_CATEGORIES.join(', ')}
    
    Based on the business description, identify the most relevant service categories and specific skills/specialties.
    
    Please respond with a JSON object in this exact format:
    {
      "categories": ["Primary Category", "Secondary Category"],
      "specialties": ["specific skill 1", "specific skill 2", "specific skill 3"],
      "confidence": 0.85
    }
    
    Rules:
    - Choose 1-3 most relevant categories from the available list
    - List 2-5 specific specialties/skills mentioned or implied
    - Confidence should be 0-1 based on clarity of description
    - Use Filipino/Taglish terms if commonly used
    - Focus on construction, home improvement, and local services
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant that categorizes service providers. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const responseText = completion.choices[0].message.content.trim();
    
    // Parse the AI response
    let aiResponse;
    try {
      // Extract JSON from response if wrapped in markdown
      const jsonMatch = responseText.match(/```json\n?(.*?)\n?```/s) || responseText.match(/\{.*\}/s);
      const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText;
      aiResponse = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('AI response parsing error:', parseError);
      // Fallback parsing
      aiResponse = {
        categories: ['Other'],
        specialties: ['General Services'],
        confidence: 0.5
      };
    }

    // Validate and clean the response
    const validCategories = aiResponse.categories.filter(cat => 
      SERVICE_CATEGORIES.includes(cat)
    );
    
    if (validCategories.length === 0) {
      validCategories.push('Other');
    }

    return {
      categories: validCategories,
      specialties: aiResponse.specialties || [],
      confidence: Math.max(0, Math.min(1, aiResponse.confidence || 0.5)),
      rawResponse: responseText
    };

  } catch (error) {
    console.error('AI service extraction error:', error);
    
    // Fallback: Simple keyword matching
    return fallbackServiceExtraction(businessDescription);
  }
};

/**
 * Match job requests with suitable providers using AI
 * @param {Object} jobRequest - The job request object
 * @param {Array} providers - Array of potential provider objects
 * @returns {Promise<Array>} Array of matched providers with scores
 */
export const matchJobWithProviders = async (jobRequest, providers) => {
  try {
    if (!providers || providers.length === 0) {
      return [];
    }

    // Use fallback if OpenAI is not available
    if (!openai) {
      console.log('🔗 Using fallback job matching for:', jobRequest.title);
      return fallbackJobMatching(jobRequest, providers);
    }

    // Prepare provider summaries for AI
    const providerSummaries = providers.map(provider => ({
      id: provider._id,
      name: provider.businessName,
      description: provider.businessDescription,
      services: provider.services.map(s => s.name).join(', '),
      categories: provider.services.map(s => s.category).join(', '),
      specialties: provider.specialties.join(', '),
      experience: provider.experience?.years || 0,
      rating: provider.ratings?.average || 0,
      badges: provider.badges.map(b => b.type).join(', '),
      location: provider.location.barangay
    }));

    const prompt = `
    You are an AI assistant helping match job requests with the best service providers in Bataan.
    
    JOB REQUEST:
    Title: ${jobRequest.title}
    Description: ${jobRequest.description}
    Category: ${jobRequest.category}
    Location: ${jobRequest.location.barangay}, ${jobRequest.location.municipality}
    Budget: ₱${jobRequest.budget?.min || 0} - ₱${jobRequest.budget?.max || 'Open'}
    Urgency: ${jobRequest.urgency}
    Timeline: ${jobRequest.timeline.startDate}
    
    AVAILABLE PROVIDERS:
    ${providerSummaries.map((p, i) => `
    ${i + 1}. ${p.name}
       - Services: ${p.categories}
       - Specialties: ${p.specialties}
       - Experience: ${p.experience} years
       - Rating: ${p.rating}/5
       - Location: ${p.location}
       - Badges: ${p.badges}
    `).join('')}
    
    Please analyze and rank the top 3 most suitable providers for this job.
    
    Respond with a JSON object in this exact format:
    {
      "matches": [
        {
          "providerId": "provider_id_here",
          "matchScore": 85,
          "reasons": ["Exact service match", "High rating", "Local area"],
          "concerns": ["Might be expensive", "Busy schedule"]
        }
      ]
    }
    
    Scoring criteria (0-100):
    - Service/category match (40%)
    - Location proximity (20%)
    - Experience/rating (20%)
    - Availability/urgency fit (10%)
    - Budget compatibility (10%)
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant that matches jobs with service providers. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 800
    });

    const responseText = completion.choices[0].message.content.trim();
    
    // Parse AI response
    let aiResponse;
    try {
      const jsonMatch = responseText.match(/```json\n?(.*?)\n?```/s) || responseText.match(/\{.*\}/s);
      const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText;
      aiResponse = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('AI matching response parsing error:', parseError);
      return fallbackJobMatching(jobRequest, providers);
    }

    // Validate and return matches
    const validMatches = aiResponse.matches
      .filter(match => match.providerId && match.matchScore)
      .map(match => ({
        providerId: match.providerId,
        matchScore: Math.max(0, Math.min(100, match.matchScore)),
        reasons: match.reasons || [],
        concerns: match.concerns || [],
        aiGenerated: true
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);

    return validMatches;

  } catch (error) {
    console.error('AI job matching error:', error);
    return fallbackJobMatching(jobRequest, providers);
  }
};

/**
 * Enhance provider profile description using AI
 * @param {string} originalDescription - Original business description
 * @param {Object} providerData - Additional provider data
 * @returns {Promise<string>} Enhanced description
 */
export const enhanceProviderProfile = async (originalDescription, providerData = {}) => {
  try {
    const prompt = `
    You are helping a Filipino service provider in Bataan improve their business description to attract more clients.
    
    Current Description: ${originalDescription}
    
    Additional Info:
    - Business Name: ${providerData.businessName || 'N/A'}
    - Services: ${providerData.services || 'N/A'}
    - Experience: ${providerData.experience || 'N/A'} years
    - Location: ${providerData.location || 'Bataan'}
    
    Please rewrite this into a compelling, professional business pitch that:
    1. Sounds natural and authentic (not too corporate)
    2. Highlights key strengths and experience
    3. Uses some Filipino/Taglish phrases naturally if appropriate
    4. Emphasizes trustworthiness and quality
    5. Includes a call-to-action
    6. Keeps it under 200 words
    
    Make it sound like a local, trusted contractor speaking to their community.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful writing assistant specializing in Filipino business communications."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const enhancedDescription = completion.choices[0].message.content.trim();
    
    // Remove quotes if wrapped
    return enhancedDescription.replace(/^["']|["']$/g, '');

  } catch (error) {
    console.error('AI profile enhancement error:', error);
    return originalDescription; // Return original if AI fails
  }
};

/**
 * Generate job suggestion tags using AI
 * @param {string} jobTitle - Job title
 * @param {string} jobDescription - Job description
 * @returns {Promise<Array>} Array of suggested tags
 */
export const generateJobTags = async (jobTitle, jobDescription) => {
  try {
    const prompt = `
    Analyze this job request and extract relevant tags for better matching:
    
    Title: ${jobTitle}
    Description: ${jobDescription}
    
    Generate 5-8 relevant tags that would help match this job with the right service providers.
    Focus on:
    - Skills needed
    - Materials/tools
    - Job complexity
    - Special requirements
    
    Return as a JSON array: ["tag1", "tag2", "tag3", ...]
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI that generates relevant job tags. Always respond with valid JSON array."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 200
    });

    const responseText = completion.choices[0].message.content.trim();
    
    try {
      const tags = JSON.parse(responseText);
      return Array.isArray(tags) ? tags : [];
    } catch (parseError) {
      // Fallback: extract tags from response text
      const matches = responseText.match(/"([^"]+)"/g);
      return matches ? matches.map(m => m.replace(/"/g, '')) : [];
    }

  } catch (error) {
    console.error('AI tag generation error:', error);
    return [];
  }
};

// Fallback functions for when AI is unavailable

/**
 * Fallback service extraction using keyword matching
 */
const fallbackServiceExtraction = (description) => {
  const keywords = {
    'Construction': ['construction', 'building', 'build', 'concrete', 'foundation'],
    'Electrical': ['electrical', 'electric', 'wiring', 'lights', 'power', 'generator'],
    'Plumbing': ['plumbing', 'pipe', 'water', 'leak', 'drain', 'toilet', 'faucet'],
    'Carpentry': ['carpentry', 'wood', 'furniture', 'cabinet', 'door', 'window'],
    'Painting': ['painting', 'paint', 'color', 'wall', 'house painting'],
    'Roofing': ['roofing', 'roof', 'shingle', 'gutter', 'attic'],
    'Cleaning': ['cleaning', 'clean', 'housekeeping', 'janitorial'],
    'Landscaping': ['landscaping', 'garden', 'lawn', 'plants', 'trees']
  };

  const lowerDescription = description.toLowerCase();
  const matchedCategories = [];
  const specialties = [];

  for (const [category, terms] of Object.entries(keywords)) {
    if (terms.some(term => lowerDescription.includes(term))) {
      matchedCategories.push(category);
      specialties.push(...terms.filter(term => lowerDescription.includes(term)));
    }
  }

  return {
    categories: matchedCategories.length > 0 ? matchedCategories : ['Other'],
    specialties: [...new Set(specialties)],
    confidence: matchedCategories.length > 0 ? 0.7 : 0.3,
    rawResponse: 'Fallback keyword matching'
  };
};

/**
 * Fallback job matching using simple scoring
 */
const fallbackJobMatching = (jobRequest, providers) => {
  return providers
    .map(provider => {
      let score = 0;
      
      // Category match (40 points)
      if (provider.services.some(s => s.category === jobRequest.category)) {
        score += 40;
      }
      
      // Rating (20 points)
      score += (provider.ratings?.average || 0) * 4;
      
      // Experience (20 points)
      const years = provider.experience?.years || 0;
      score += Math.min(20, years * 2);
      
      // Verified badge (10 points)
      if (provider.badges.some(b => b.type === 'verified')) {
        score += 10;
      }
      
      // Random factor for variety (10 points)
      score += Math.random() * 10;
      
      return {
        providerId: provider._id,
        matchScore: Math.round(score),
        reasons: ['Category match', 'Experience', 'Rating'],
        concerns: [],
        aiGenerated: false
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
};

export default {
  extractServiceTags,
  matchJobWithProviders,
  enhanceProviderProfile,
  generateJobTags
}; 