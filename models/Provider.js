import mongoose from 'mongoose';

const ProviderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [150, 'Business name cannot exceed 150 characters']
  },
  businessDescription: {
    type: String,
    required: [true, 'Business description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  services: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
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
    description: String,
    priceRange: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        enum: ['per_hour', 'per_day', 'per_project', 'per_sqm'],
        default: 'per_project'
      }
    }
  }],
  specialties: [{
    type: String,
    trim: true
  }],
  experience: {
    years: {
      type: Number,
      min: 0,
      max: 50
    },
    description: String
  },
  location: {
    barangay: {
      type: String,
      required: [true, 'Barangay is required']
    },
    municipality: {
      type: String,
      default: 'Bataan'
    },
    address: String,
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
    serviceRadius: {
      type: Number,
      default: 15, // km
      min: 1,
      max: 100
    }
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^(\+639|09)\d{9}$/, 'Please enter a valid Philippine phone number']
    },
    email: String,
    website: String,
    facebook: String
  },
  portfolio: [{
    title: String,
    description: String,
    images: [String],
    completedDate: Date,
    projectValue: Number,
    clientTestimonial: String
  }],
  badges: [{
    type: {
      type: String,
      enum: [
        'verified',
        'top_rated',
        'experienced',
        'quick_response',
        'budget_friendly',
        'premium_service',
        'eco_friendly',
        'emergency_service'
      ]
    },
    earnedDate: {
      type: Date,
      default: Date.now
    },
    description: String
  }],
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    breakdown: {
      five: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      three: { type: Number, default: 0 },
      two: { type: Number, default: 0 },
      one: { type: Number, default: 0 }
    }
  },
  availability: {
    status: {
      type: String,
      enum: ['available', 'busy', 'unavailable'],
      default: 'available'
    },
    schedule: {
      monday: { start: String, end: String, available: { type: Boolean, default: true } },
      tuesday: { start: String, end: String, available: { type: Boolean, default: true } },
      wednesday: { start: String, end: String, available: { type: Boolean, default: true } },
      thursday: { start: String, end: String, available: { type: Boolean, default: true } },
      friday: { start: String, end: String, available: { type: Boolean, default: true } },
      saturday: { start: String, end: String, available: { type: Boolean, default: true } },
      sunday: { start: String, end: String, available: { type: Boolean, default: false } }
    },
    responseTime: {
      type: String,
      enum: ['within_hour', 'within_day', 'within_week'],
      default: 'within_day'
    }
  },
  pricing: {
    structure: {
      type: String,
      enum: ['hourly', 'daily', 'project_based', 'consultation'],
      default: 'project_based'
    },
    consultation: {
      free: { type: Boolean, default: true },
      fee: Number
    }
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    documents: [{
      type: {
        type: String,
        enum: ['business_permit', 'tax_id', 'insurance', 'certification', 'portfolio']
      },
      url: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  statistics: {
    profileViews: { type: Number, default: 0 },
    jobMatches: { type: Number, default: 0 },
    projectsCompleted: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0 }, // percentage
    lastActiveDate: { type: Date, default: Date.now }
  },
  aiTags: [{
    tag: String,
    confidence: Number,
    generatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumExpiresAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
ProviderSchema.index({ 'location.coordinates': '2dsphere' });
ProviderSchema.index({ 'services.category': 1 });
ProviderSchema.index({ 'location.barangay': 1 });
ProviderSchema.index({ 'ratings.average': -1 });
ProviderSchema.index({ 'verification.isVerified': 1 });
ProviderSchema.index({ isActive: 1 });
ProviderSchema.index({ createdAt: -1 });

// Virtual for full address
ProviderSchema.virtual('fullAddress').get(function() {
  const parts = [this.location.address, this.location.barangay, this.location.municipality];
  return parts.filter(Boolean).join(', ');
});

// Virtual for service categories list
ProviderSchema.virtual('serviceCategories').get(function() {
  return [...new Set(this.services.map(service => service.category))];
});

// Method to calculate distance from a point
ProviderSchema.methods.distanceFrom = function(latitude, longitude) {
  const R = 6371; // Earth's radius in km
  const dLat = (latitude - this.location.coordinates.latitude) * Math.PI/180;
  const dLon = (longitude - this.location.coordinates.longitude) * Math.PI/180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.location.coordinates.latitude * Math.PI/180) * Math.cos(latitude * Math.PI/180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

// Method to add a badge
ProviderSchema.methods.addBadge = function(badgeType, description = '') {
  const existingBadge = this.badges.find(badge => badge.type === badgeType);
  if (!existingBadge) {
    this.badges.push({
      type: badgeType,
      description,
      earnedDate: new Date()
    });
  }
  return this.save();
};

// Method to update statistics
ProviderSchema.methods.incrementViews = function() {
  this.statistics.profileViews += 1;
  this.statistics.lastActiveDate = new Date();
  return this.save({ validateBeforeSave: false });
};

// Static method for proximity search
ProviderSchema.statics.findNearby = function(latitude, longitude, radiusInKm = 15, filters = {}) {
  const query = {
    isActive: true,
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusInKm * 1000 // Convert to meters
      }
    },
    ...filters
  };
  
  return this.find(query).populate('user', 'name email profileImage');
};

// Static method for service matching
ProviderSchema.statics.findByServices = function(serviceCategories, location = null, limit = 10) {
  let query = {
    isActive: true,
    'services.category': { $in: serviceCategories }
  };
  
  let findQuery = this.find(query).populate('user', 'name email profileImage');
  
  if (location) {
    findQuery = findQuery.near('location.coordinates', {
      center: [location.longitude, location.latitude],
      maxDistance: 50000 // 50km in meters
    });
  }
  
  return findQuery.limit(limit).sort({ 'ratings.average': -1, createdAt: -1 });
};

const Provider = mongoose.model('Provider', ProviderSchema);

export default Provider; 