import { validationResult } from 'express-validator';
import Provider from '../models/Provider.js';
import User from '../models/User.js';
import { extractServiceTags } from '../utils/ai.js';
import { findNearbyProviders, getBarangayCoordinates } from '../utils/geo.js';

/**
 * Register new provider
 * POST /api/providers/register
 */
export const registerProvider = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.userId;
    const {
      businessName,
      businessDescription,
      services,
      specialties,
      experience,
      location,
      contact,
      availability,
      pricing,
      portfolio
    } = req.body;

    // Check if user already has a provider profile
    const existingProvider = await Provider.findOne({ user: userId });
    if (existingProvider) {
      return res.status(409).json({
        success: false,
        message: 'Provider profile already exists for this user'
      });
    }

    // Get coordinates for location if not provided
    let coordinates = location.coordinates;
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
      const coords = getBarangayCoordinates(location.barangay, location.municipality);
      coordinates = {
        latitude: coords.lat,
        longitude: coords.lng
      };
    }

    // Use AI to extract service tags
    let aiTags = [];
    try {
      const aiResult = await extractServiceTags(businessDescription, businessName);
      aiTags = aiResult.categories.map(category => ({
        tag: category,
        confidence: aiResult.confidence,
        generatedAt: new Date()
      }));
    } catch (aiError) {
      console.error('AI tagging error:', aiError);
    }

    // Create provider profile
    const provider = new Provider({
      user: userId,
      businessName: businessName.trim(),
      businessDescription: businessDescription.trim(),
      services: services || [],
      specialties: specialties || [],
      experience: experience || {},
      location: {
        ...location,
        coordinates
      },
      contact: contact || {},
      availability: availability || {},
      pricing: pricing || {},
      portfolio: portfolio || [],
      aiTags
    });

    await provider.save();

    // Update user role to provider
    await User.findByIdAndUpdate(userId, { role: 'provider' });

    // Populate user data
    await provider.populate('user', 'name email profileImage');

    res.status(201).json({
      success: true,
      message: 'Provider profile created successfully',
      data: { provider }
    });

  } catch (error) {
    console.error('Provider registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create provider profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get all providers with filtering and pagination
 * GET /api/providers
 */
export const getProviders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      barangay,
      municipality = 'Bataan',
      verified,
      minRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      latitude,
      longitude,
      radius = 15,
      search
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Category filter
    if (category && category !== 'all') {
      query['services.category'] = category;
    }

    // Location filters
    if (barangay && barangay !== 'all') {
      query['location.barangay'] = barangay;
    }
    if (municipality && municipality !== 'all') {
      query['location.municipality'] = municipality;
    }

    // Verification filter
    if (verified === 'true') {
      query['verification.isVerified'] = true;
    }

    // Rating filter
    if (minRating) {
      query['ratings.average'] = { $gte: parseFloat(minRating) };
    }

    // Search filter
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { businessDescription: { $regex: search, $options: 'i' } },
        { specialties: { $regex: search, $options: 'i' } },
        { 'services.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    let sort = {};
    if (sortBy === 'rating') {
      sort = { 'ratings.average': sortOrder === 'desc' ? -1 : 1 };
    } else if (sortBy === 'distance' && latitude && longitude) {
      // Will be handled by geo query
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let providers;
    let total;

    // If coordinates provided, use geo search
    if (latitude && longitude && sortBy === 'distance') {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusInKm = parseFloat(radius);

      // Use geo query
      const geoQuery = {
        ...query,
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: radiusInKm * 1000 // Convert to meters
          }
        }
      };

      providers = await Provider.find(geoQuery)
        .populate('user', 'name email profileImage')
        .skip(skip)
        .limit(limitNum);

      total = await Provider.countDocuments(geoQuery);

      // Add distance to each provider
      providers = providers.map(provider => {
        const distance = provider.distanceFrom(lat, lng);
        return {
          ...provider.toObject(),
          distance: Math.round(distance * 100) / 100,
          distanceText: distance < 1 ? 
            `${Math.round(distance * 1000)}m away` : 
            `${distance.toFixed(1)}km away`
        };
      });

    } else {
      // Regular query
      providers = await Provider.find(query)
        .populate('user', 'name email profileImage')
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

      total = await Provider.countDocuments(query);
    }

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    res.json({
      success: true,
      data: {
        providers,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNum,
          hasNext,
          hasPrev
        },
        filters: {
          category,
          barangay,
          municipality,
          verified,
          minRating,
          search
        }
      }
    });

  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get providers',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get single provider by ID
 * GET /api/providers/:id
 */
export const getProviderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.query;

    const provider = await Provider.findById(id)
      .populate('user', 'name email profileImage phone createdAt');

    if (!provider || !provider.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Increment view count
    await provider.incrementViews();

    let providerData = provider.toObject();

    // Add distance if coordinates provided
    if (latitude && longitude) {
      const distance = provider.distanceFrom(parseFloat(latitude), parseFloat(longitude));
      providerData.distance = Math.round(distance * 100) / 100;
      providerData.distanceText = distance < 1 ? 
        `${Math.round(distance * 1000)}m away` : 
        `${distance.toFixed(1)}km away`;
    }

    res.json({
      success: true,
      data: { provider: providerData }
    });

  } catch (error) {
    console.error('Get provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get provider',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update provider profile
 * PUT /api/providers/:id
 */
export const updateProvider = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user.userId;

    // Find provider and check ownership
    const provider = await Provider.findById(id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    if (provider.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this provider profile'
      });
    }

    const updateData = { ...req.body };

    // Update coordinates if location changed
    if (updateData.location) {
      let coordinates = updateData.location.coordinates;
      if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
        const coords = getBarangayCoordinates(
          updateData.location.barangay, 
          updateData.location.municipality
        );
        updateData.location.coordinates = {
          latitude: coords.lat,
          longitude: coords.lng
        };
      }
    }

    // Regenerate AI tags if description changed
    if (updateData.businessDescription) {
      try {
        const aiResult = await extractServiceTags(
          updateData.businessDescription, 
          updateData.businessName || provider.businessName
        );
        updateData.aiTags = aiResult.categories.map(category => ({
          tag: category,
          confidence: aiResult.confidence,
          generatedAt: new Date()
        }));
      } catch (aiError) {
        console.error('AI tagging error:', aiError);
      }
    }

    const updatedProvider = await Provider.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('user', 'name email profileImage');

    res.json({
      success: true,
      message: 'Provider profile updated successfully',
      data: { provider: updatedProvider }
    });

  } catch (error) {
    console.error('Update provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update provider profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get provider statistics
 * GET /api/providers/:id/stats
 */
export const getProviderStats = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const provider = await Provider.findById(id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Only provider owner can view detailed stats
    if (provider.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these statistics'
      });
    }

    res.json({
      success: true,
      data: {
        statistics: provider.statistics,
        ratings: provider.ratings,
        badges: provider.badges,
        verification: provider.verification
      }
    });

  } catch (error) {
    console.error('Get provider stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get provider statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Search providers with advanced filters
 * POST /api/providers/search
 */
export const searchProviders = async (req, res) => {
  try {
    const {
      query: searchQuery,
      filters = {},
      location,
      pagination = { page: 1, limit: 12 }
    } = req.body;

    let aggregationPipeline = [];

    // Match stage
    let matchStage = { isActive: true };

    // Text search
    if (searchQuery) {
      matchStage.$or = [
        { businessName: { $regex: searchQuery, $options: 'i' } },
        { businessDescription: { $regex: searchQuery, $options: 'i' } },
        { specialties: { $regex: searchQuery, $options: 'i' } },
        { 'services.name': { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Apply filters
    if (filters.categories && filters.categories.length > 0) {
      matchStage['services.category'] = { $in: filters.categories };
    }
    if (filters.barangays && filters.barangays.length > 0) {
      matchStage['location.barangay'] = { $in: filters.barangays };
    }
    if (filters.verified) {
      matchStage['verification.isVerified'] = true;
    }
    if (filters.minRating) {
      matchStage['ratings.average'] = { $gte: filters.minRating };
    }
    if (filters.badges && filters.badges.length > 0) {
      matchStage['badges.type'] = { $in: filters.badges };
    }

    aggregationPipeline.push({ $match: matchStage });

    // Add location-based sorting if coordinates provided
    if (location && location.latitude && location.longitude) {
      aggregationPipeline.push({
        $addFields: {
          distance: {
            $multiply: [
              3963.2, // Earth radius in miles, multiply by 1.60934 for km
              {
                $acos: {
                  $add: [
                    {
                      $multiply: [
                        { $sin: { $degreesToRadians: location.latitude } },
                        { $sin: { $degreesToRadians: '$location.coordinates.latitude' } }
                      ]
                    },
                    {
                      $multiply: [
                        { $cos: { $degreesToRadians: location.latitude } },
                        { $cos: { $degreesToRadians: '$location.coordinates.latitude' } },
                        { $cos: {
                          $degreesToRadians: {
                            $subtract: [location.longitude, '$location.coordinates.longitude']
                          }
                        }}
                      ]
                    }
                  ]
                }
              }
            ]
          }
        }
      });

      // Filter by radius if specified
      if (location.radius) {
        aggregationPipeline.push({
          $match: { distance: { $lte: location.radius } }
        });
      }
    }

    // Sort stage
    let sortStage = {};
    if (location && location.latitude && location.longitude) {
      sortStage.distance = 1; // Sort by distance ascending
    } else {
      sortStage['ratings.average'] = -1; // Sort by rating descending
      sortStage.createdAt = -1;
    }
    aggregationPipeline.push({ $sort: sortStage });

    // Lookup user data
    aggregationPipeline.push({
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
        pipeline: [
          { $project: { name: 1, email: 1, profileImage: 1 } }
        ]
      }
    });

    aggregationPipeline.push({
      $unwind: '$user'
    });

    // Facet for pagination and count
    aggregationPipeline.push({
      $facet: {
        data: [
          { $skip: (pagination.page - 1) * pagination.limit },
          { $limit: pagination.limit }
        ],
        count: [
          { $count: 'total' }
        ]
      }
    });

    const results = await Provider.aggregate(aggregationPipeline);
    const providers = results[0].data;
    const total = results[0].count[0]?.total || 0;

    const totalPages = Math.ceil(total / pagination.limit);

    res.json({
      success: true,
      data: {
        providers,
        pagination: {
          currentPage: pagination.page,
          totalPages,
          totalItems: total,
          itemsPerPage: pagination.limit,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1
        }
      }
    });

  } catch (error) {
    console.error('Search providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search providers',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get current user's provider profile
 * GET /api/providers/me
 */
export const getMyProvider = async (req, res) => {
  try {
    const userId = req.user.userId;

    const provider = await Provider.findOne({ user: userId })
      .populate('user', 'name email profileImage phone');

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider profile not found'
      });
    }

    res.json({
      success: true,
      data: { provider }
    });

  } catch (error) {
    console.error('Get my provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get provider profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export default {
  registerProvider,
  getProviders,
  getProviderById,
  updateProvider,
  getProviderStats,
  searchProviders,
  getMyProvider
}; 