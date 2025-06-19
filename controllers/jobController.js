import { validationResult } from 'express-validator';
import JobRequest from '../models/JobRequest.js';
import Provider from '../models/Provider.js';
import { matchJobWithProviders, generateJobTags } from '../utils/ai.js';
import { getBarangayCoordinates } from '../utils/geo.js';

/**
 * Create new job request
 * POST /api/jobs
 */
export const createJob = async (req, res) => {
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
    const jobData = { ...req.body, client: userId };

    // Get coordinates if not provided
    if (!jobData.location.coordinates) {
      const coords = getBarangayCoordinates(
        jobData.location.barangay, 
        jobData.location.municipality
      );
      jobData.location.coordinates = {
        latitude: coords.lat,
        longitude: coords.lng
      };
    }

    // Generate AI tags for better matching
    try {
      const aiTags = await generateJobTags(jobData.title, jobData.description);
      jobData.aiTags = aiTags.map(tag => ({
        tag,
        confidence: 0.8,
        category: 'ai_generated'
      }));
    } catch (aiError) {
      console.error('AI tag generation error:', aiError);
      jobData.aiTags = [];
    }

    const job = new JobRequest(jobData);
    await job.save();

    // Find and suggest matching providers
    try {
      const nearbyProviders = await Provider.findNearby(
        jobData.location.coordinates.latitude,
        jobData.location.coordinates.longitude,
        20, // 20km radius
        { 'services.category': jobData.category }
      );

      if (nearbyProviders.length > 0) {
        const matches = await matchJobWithProviders(job, nearbyProviders);
        
        job.aiSuggestions = matches.map(match => ({
          provider: match.providerId,
          matchScore: match.matchScore,
          reasons: match.reasons,
          generatedAt: new Date()
        }));

        await job.save();
      }
    } catch (matchingError) {
      console.error('Job matching error:', matchingError);
    }

    // Populate client data for response
    await job.populate('client', 'name email profileImage');

    res.status(201).json({
      success: true,
      message: 'Job request created successfully',
      data: { 
        job,
        suggestedProviders: job.aiSuggestions.length
      }
    });

  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get all jobs with filtering
 * GET /api/jobs
 */
export const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status = 'active',
      urgency,
      barangay,
      municipality,
      clientId,
      providerId,
      latitude,
      longitude,
      radius = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = { isActive: true };

    // Status filter
    if (status !== 'all') {
      query.status = status;
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Urgency filter
    if (urgency && urgency !== 'all') {
      query.urgency = urgency;
    }

    // Location filters
    if (barangay && barangay !== 'all') {
      query['location.barangay'] = barangay;
    }
    if (municipality && municipality !== 'all') {
      query['location.municipality'] = municipality;
    }

    // Client filter (for client's own jobs)
    if (clientId) {
      query.client = clientId;
    }

    // Provider filter (for jobs where provider applied)
    if (providerId) {
      query['applications.provider'] = providerId;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let jobs;
    let total;

    // If coordinates provided, use geo search
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusInKm = parseFloat(radius);

      const geoQuery = {
        ...query,
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: radiusInKm * 1000
          }
        }
      };

      jobs = await JobRequest.find(geoQuery)
        .populate('client', 'name email profileImage')
        .populate('applications.provider', 'businessName user')
        .skip(skip)
        .limit(limitNum)
        .sort({ urgency: -1, createdAt: -1 });

      total = await JobRequest.countDocuments(geoQuery);

    } else {
      // Regular query with sorting
      let sort = {};
      if (sortBy === 'urgency') {
        sort = { urgency: -1, createdAt: -1 };
      } else {
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      }

      jobs = await JobRequest.find(query)
        .populate('client', 'name email profileImage')
        .populate('applications.provider', 'businessName user')
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

      total = await JobRequest.countDocuments(query);
    }

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNum,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get single job by ID
 * GET /api/jobs/:id
 */
export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const job = await JobRequest.findById(id)
      .populate('client', 'name email profileImage phone')
      .populate('applications.provider', 'businessName user ratings location')
      .populate({
        path: 'applications.provider',
        populate: {
          path: 'user',
          select: 'name profileImage'
        }
      })
      .populate('aiSuggestions.provider', 'businessName user ratings location');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Increment view count if viewing as provider
    if (req.user.role === 'provider') {
      const provider = await Provider.findOne({ user: userId });
      if (provider) {
        await job.incrementViews(provider._id);
      }
    }

    res.json({
      success: true,
      data: { job }
    });

  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Apply for a job (Provider only)
 * POST /api/jobs/:id/apply
 */
export const applyForJob = async (req, res) => {
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
    const { proposal, quotedPrice, estimatedDuration } = req.body;

    // Find provider profile
    const provider = await Provider.findOne({ user: userId });
    if (!provider) {
      return res.status(403).json({
        success: false,
        message: 'Provider profile required to apply for jobs'
      });
    }

    // Find job
    const job = await JobRequest.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Job is no longer accepting applications'
      });
    }

    // Check if already applied
    const existingApplication = job.applications.find(
      app => app.provider.toString() === provider._id.toString()
    );

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Add application
    await job.addApplication(provider._id, proposal, quotedPrice, estimatedDuration);

    // Update provider statistics
    provider.statistics.jobMatches += 1;
    await provider.save();

    // Populate the updated job
    await job.populate('applications.provider', 'businessName user ratings');

    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: { 
        job,
        application: job.applications[job.applications.length - 1]
      }
    });

  } catch (error) {
    console.error('Apply for job error:', error);
    
    if (error.message === 'Provider has already applied for this job') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to apply for job',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Accept job application (Client only)
 * POST /api/jobs/:id/accept/:applicationId
 */
export const acceptApplication = async (req, res) => {
  try {
    const { id, applicationId } = req.params;
    const userId = req.user.userId;
    const { clientResponse } = req.body;

    const job = await JobRequest.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is the job owner
    if (job.client.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept applications for this job'
      });
    }

    if (job.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Job is no longer accepting applications'
      });
    }

    // Accept the application
    await job.acceptApplication(applicationId, clientResponse);

    // Populate updated job
    await job.populate('applications.provider', 'businessName user contact');
    await job.populate('selectedProvider', 'businessName user contact');

    res.json({
      success: true,
      message: 'Application accepted successfully',
      data: { job }
    });

  } catch (error) {
    console.error('Accept application error:', error);
    
    if (error.message === 'Application not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to accept application',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Complete job (Client only)
 * POST /api/jobs/:id/complete
 */
export const completeJob = async (req, res) => {
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
    const { finalCost, workQuality, rating, review } = req.body;

    const job = await JobRequest.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.client.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this job'
      });
    }

    if (job.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Job is not in progress'
      });
    }

    // Complete the job
    await job.completeJob(finalCost, workQuality);

    // Add client rating
    if (rating && review) {
      job.completionDetails.clientRating = {
        rating,
        review,
        ratedAt: new Date()
      };
      await job.save();

      // Update provider rating
      if (job.selectedProvider) {
        const provider = await Provider.findById(job.selectedProvider);
        if (provider) {
          const newCount = provider.ratings.count + 1;
          const newAverage = (
            (provider.ratings.average * provider.ratings.count) + rating
          ) / newCount;

          provider.ratings.average = Math.round(newAverage * 10) / 10;
          provider.ratings.count = newCount;
          
          // Update rating breakdown
          const ratingKey = ['', 'one', 'two', 'three', 'four', 'five'][rating];
          provider.ratings.breakdown[ratingKey] += 1;
          
          provider.statistics.projectsCompleted += 1;
          await provider.save();
        }
      }
    }

    await job.populate('selectedProvider', 'businessName user');

    res.json({
      success: true,
      message: 'Job completed successfully',
      data: { job }
    });

  } catch (error) {
    console.error('Complete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete job',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get AI suggestions for a job
 * GET /api/jobs/:id/suggestions
 */
export const getJobSuggestions = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const job = await JobRequest.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Only job owner can view suggestions
    if (job.client.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view suggestions for this job'
      });
    }

    // If no existing suggestions, generate new ones
    if (job.aiSuggestions.length === 0) {
      const nearbyProviders = await Provider.findNearby(
        job.location.coordinates.latitude,
        job.location.coordinates.longitude,
        25,
        { 'services.category': job.category }
      );

      if (nearbyProviders.length > 0) {
        const matches = await matchJobWithProviders(job, nearbyProviders);
        
        job.aiSuggestions = matches.map(match => ({
          provider: match.providerId,
          matchScore: match.matchScore,
          reasons: match.reasons,
          generatedAt: new Date()
        }));

        await job.save();
      }
    }

    // Populate suggestions with provider data
    await job.populate('aiSuggestions.provider', 'businessName user ratings location badges');

    res.json({
      success: true,
      data: {
        suggestions: job.aiSuggestions,
        count: job.aiSuggestions.length
      }
    });

  } catch (error) {
    console.error('Get job suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update job request
 * PUT /api/jobs/:id
 */
export const updateJob = async (req, res) => {
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

    const job = await JobRequest.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.client.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }

    if (job.status !== 'active' && job.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update job in current status'
      });
    }

    const updateData = { ...req.body };

    // Update coordinates if location changed
    if (updateData.location && (!updateData.location.coordinates || 
        !updateData.location.coordinates.latitude)) {
      const coords = getBarangayCoordinates(
        updateData.location.barangay, 
        updateData.location.municipality
      );
      updateData.location.coordinates = {
        latitude: coords.lat,
        longitude: coords.lng
      };
    }

    // Regenerate AI tags if title or description changed
    if (updateData.title || updateData.description) {
      try {
        const aiTags = await generateJobTags(
          updateData.title || job.title, 
          updateData.description || job.description
        );
        updateData.aiTags = aiTags.map(tag => ({
          tag,
          confidence: 0.8,
          category: 'ai_generated'
        }));
      } catch (aiError) {
        console.error('AI tag regeneration error:', aiError);
      }
    }

    const updatedJob = await JobRequest.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('client', 'name email profileImage');

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: { job: updatedJob }
    });

  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Delete job request
 * DELETE /api/jobs/:id
 */
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const job = await JobRequest.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.client.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job'
      });
    }

    if (job.status === 'in_progress' || job.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete job in current status'
      });
    }

    // Soft delete by marking as inactive
    job.isActive = false;
    job.status = 'canceled';
    await job.save();

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export default {
  createJob,
  getJobs,
  getJobById,
  applyForJob,
  acceptApplication,
  completeJob,
  getJobSuggestions,
  updateJob,
  deleteJob
}; 