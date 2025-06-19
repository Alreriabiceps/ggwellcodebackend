import mongoose from 'mongoose';

const JobRequestSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Job category is required'],
    enum: [
      'Construction',
      'Electrical',
      'Plumbing',
      'Carpentry',
      'Painting',
      'Roofing',
      'Landscaping',
      'Cleaning',
      'HVAC',
      'Solar Installation',
      'Renovation',
      'Masonry',
      'Welding',
      'Interior Design',
      'Security Systems',
      'Other'
    ]
  },
  subCategories: [{
    type: String,
    trim: true
  }],
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'emergency'],
    default: 'medium'
  },
  timeline: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: Date,
    flexible: {
      type: Boolean,
      default: false
    },
    preferredTime: String // "morning", "afternoon", "evening", "anytime"
  },
  budget: {
    min: {
      type: Number,
      min: 0
    },
    max: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'PHP'
    },
    negotiable: {
      type: Boolean,
      default: true
    },
    paymentTerms: {
      type: String,
      enum: ['upfront', 'milestone', 'completion', 'hourly'],
      default: 'completion'
    }
  },
  location: {
    address: {
      type: String,
      required: [true, 'Job address is required']
    },
    barangay: {
      type: String,
      required: [true, 'Barangay is required']
    },
    municipality: {
      type: String,
      default: 'Bataan'
    },
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: -180,
        max: 180
      }
    },
    accessNotes: String // Special instructions for finding the location
  },
  requirements: {
    skillsNeeded: [{
      type: String,
      trim: true
    }],
    toolsRequired: [{
      type: String,
      trim: true
    }],
    materialsProvided: {
      type: Boolean,
      default: false
    },
    experience: {
      type: String,
      enum: ['entry', 'intermediate', 'experienced', 'expert'],
      default: 'intermediate'
    },
    certifications: [String],
    insurance: {
      type: Boolean,
      default: false
    }
  },
  attachments: [{
    filename: String,
    url: String,
    type: {
      type: String,
      enum: ['image', 'document', 'video']
    },
    description: String
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'in_progress', 'completed', 'canceled', 'expired'],
    default: 'active'
  },
  applications: [{
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      required: true
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    proposal: String,
    quotedPrice: Number,
    estimatedDuration: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending'
    },
    clientResponse: String,
    responseDate: Date
  }],
  aiSuggestions: [{
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider'
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100
    },
    reasons: [String],
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  aiTags: [{
    tag: String,
    confidence: Number,
    category: String
  }],
  selectedProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider'
  },
  completionDetails: {
    completedAt: Date,
    clientRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      review: String,
      ratedAt: Date
    },
    providerRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      review: String,
      ratedAt: Date
    },
    finalCost: Number,
    workQuality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent']
    }
  },
  views: {
    count: {
      type: Number,
      default: 0
    },
    uniqueProviders: [{
      provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Provider'
      },
      viewedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiry is 30 days from creation
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
JobRequestSchema.index({ 'location.coordinates': '2dsphere' });
JobRequestSchema.index({ category: 1 });
JobRequestSchema.index({ status: 1 });
JobRequestSchema.index({ client: 1 });
JobRequestSchema.index({ urgency: 1 });
JobRequestSchema.index({ 'timeline.startDate': 1 });
JobRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
JobRequestSchema.index({ createdAt: -1 });

// Virtual for days until expiry
JobRequestSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiresAt) return null;
  const now = new Date();
  const diffTime = this.expiresAt - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for application count
JobRequestSchema.virtual('applicationCount').get(function() {
  return this.applications.length;
});

// Virtual for full location
JobRequestSchema.virtual('fullLocation').get(function() {
  const parts = [this.location.address, this.location.barangay, this.location.municipality];
  return parts.filter(Boolean).join(', ');
});

// Method to add application
JobRequestSchema.methods.addApplication = function(providerId, proposal, quotedPrice, estimatedDuration) {
  // Check if provider already applied
  const existingApplication = this.applications.find(
    app => app.provider.toString() === providerId.toString()
  );
  
  if (existingApplication) {
    throw new Error('Provider has already applied for this job');
  }
  
  this.applications.push({
    provider: providerId,
    proposal,
    quotedPrice,
    estimatedDuration
  });
  
  return this.save();
};

// Method to accept application
JobRequestSchema.methods.acceptApplication = function(applicationId, clientResponse = '') {
  const application = this.applications.id(applicationId);
  if (!application) {
    throw new Error('Application not found');
  }
  
  // Set all other applications to rejected
  this.applications.forEach(app => {
    if (app._id.toString() === applicationId.toString()) {
      app.status = 'accepted';
      app.clientResponse = clientResponse;
      app.responseDate = new Date();
    } else if (app.status === 'pending') {
      app.status = 'rejected';
    }
  });
  
  this.selectedProvider = application.provider;
  this.status = 'in_progress';
  
  return this.save();
};

// Method to increment views
JobRequestSchema.methods.incrementViews = function(providerId = null) {
  this.views.count += 1;
  
  if (providerId) {
    const existingView = this.views.uniqueProviders.find(
      view => view.provider.toString() === providerId.toString()
    );
    
    if (!existingView) {
      this.views.uniqueProviders.push({
        provider: providerId,
        viewedAt: new Date()
      });
    }
  }
  
  return this.save({ validateBeforeSave: false });
};

// Method to complete job
JobRequestSchema.methods.completeJob = function(finalCost, workQuality) {
  this.status = 'completed';
  this.completionDetails.completedAt = new Date();
  this.completionDetails.finalCost = finalCost;
  this.completionDetails.workQuality = workQuality;
  
  return this.save();
};

// Static method to find nearby jobs for providers
JobRequestSchema.statics.findNearbyForProvider = function(providerId, latitude, longitude, radiusInKm = 20) {
  return this.find({
    status: 'active',
    isActive: true,
    expiresAt: { $gt: new Date() },
    'applications.provider': { $ne: providerId },
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusInKm * 1000
      }
    }
  }).populate('client', 'name profileImage')
    .sort({ urgency: -1, createdAt: -1 });
};

// Static method to find jobs by category
JobRequestSchema.statics.findByCategory = function(categories, limit = 10) {
  return this.find({
    status: 'active',
    isActive: true,
    expiresAt: { $gt: new Date() },
    category: { $in: categories }
  }).populate('client', 'name profileImage')
    .limit(limit)
    .sort({ urgency: -1, createdAt: -1 });
};

// Pre remove middleware to clean up references
JobRequestSchema.pre('remove', async function(next) {
  try {
    // Remove job references from provider statistics
    await mongoose.model('Provider').updateMany(
      { _id: { $in: this.applications.map(app => app.provider) } },
      { $inc: { 'statistics.jobMatches': -1 } }
    );
    next();
  } catch (error) {
    next(error);
  }
});

const JobRequest = mongoose.model('JobRequest', JobRequestSchema);

export default JobRequest; 