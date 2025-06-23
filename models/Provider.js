import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    type: String // Image URLs/paths
  }],
  completedDate: {
    type: Date,
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  client: {
    type: String // Client name (anonymized)
  }
});

const badgesSchema = new mongoose.Schema({
  verified: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  topRated: {
    type: Boolean,
    default: false
  },
  fastResponse: {
    type: Boolean,
    default: false
  },
  emergency: {
    type: Boolean,
    default: false
  },
  expert: {
    type: Boolean,
    default: false
  },
  licensed: {
    type: Boolean,
    default: false
  },
  specialist: {
    type: Boolean,
    default: false
  },
  eco_friendly: {
    type: Boolean,
    default: false
  },
  artisan: {
    type: Boolean,
    default: false
  }
});

const priceRangeSchema = new mongoose.Schema({
  min: {
    type: Number,
    required: true,
    min: 0
  },
  max: {
    type: Number,
    required: true,
    min: 0
  }
});

const locationSchema = new mongoose.Schema({
  municipality: {
    type: String,
    required: true,
    enum: [
      'Abucay', 'Bagac', 'Balanga', 'Dinalupihan', 'Hermosa',
      'Limay', 'Mariveles', 'Morong', 'Orani', 'Orion', 'Pilar', 'Samal'
    ]
  },
  barangay: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  }
});

const providerSchema = new mongoose.Schema({
  // Basic Information
  businessName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  ownerName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },

  // Location
  municipality: {
    type: String,
    required: true,
    enum: [
      'Abucay', 'Bagac', 'Balanga', 'Dinalupihan', 'Hermosa',
      'Limay', 'Mariveles', 'Morong', 'Orani', 'Orion', 'Pilar', 'Samal'
    ]
  },
  barangay: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },

  // Service Information
  category: {
    type: String,
    required: true,
    enum: [
      'Plumbing', 'Electrical', 'Construction', 'Appliance Repair',
      'Cleaning', 'Carpentry', 'Landscaping', 'Painting', 'Roofing',
      'HVAC', 'Security', 'Interior Design', 'Pest Control', 'Moving'
    ]
  },
  services: [{
    type: String,
    required: true
  }],
  specialties: [{
    type: String
  }],

  // Experience & Ratings
  yearsExperience: {
    type: Number,
    required: true,
    min: 0,
    max: 50
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Operational Details
  responseTime: {
    type: String,
    default: "2 hours"
  },
  workingHours: {
    type: String,
    default: "8:00 AM - 5:00 PM"
  },
  priceRange: priceRangeSchema,

  // Verification & Badges
  badges: badgesSchema,

  // Portfolio
  portfolio: [portfolioSchema],

  // Credentials
  certifications: [{
    type: String
  }],
  insurance: {
    type: Boolean,
    default: false
  },
  warranty: {
    type: String
  },
  languages: [{
    type: String,
    default: ['Filipino']
  }],

  // Business Details
  businessRegistration: {
    type: String // DTI/SEC registration number
  },
  taxId: {
    type: String // TIN
  },
  
  // AI Enhancement Fields
  aiScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastAIAnalysis: {
    type: Date
  },
  aiInsights: {
    strengths: [String],
    improvements: [String],
    marketPosition: String
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },

  // Performance Metrics
  totalJobs: {
    type: Number,
    default: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  cancelledJobs: {
    type: Number,
    default: 0
  },
  averageResponseTime: {
    type: Number, // in minutes
    default: 120
  },

  // Social Proof
  testimonials: [{
    client: String,
    rating: Number,
    comment: String,
    date: Date,
    jobType: String
  }],

  // Contact Preferences
  preferredContact: {
    type: String,
    enum: ['phone', 'email', 'sms', 'whatsapp'],
    default: 'phone'
  },
  availability: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
    saturday: { type: Boolean, default: true },
    sunday: { type: Boolean, default: false }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
providerSchema.index({ municipality: 1, category: 1 });
providerSchema.index({ rating: -1, reviewCount: -1 });
providerSchema.index({ 'badges.verified': 1 });
providerSchema.index({ services: 1 });
providerSchema.index({ isActive: 1, isVerified: 1 });

// Virtual for full address
providerSchema.virtual('fullAddress').get(function() {
  return `${this.address}, ${this.barangay}, ${this.municipality}, Bataan`;
});

// Virtual for success rate
providerSchema.virtual('successRate').get(function() {
  if (this.totalJobs === 0) return 0;
  return Math.round((this.completedJobs / this.totalJobs) * 100);
});

// Virtual for average rating display
providerSchema.virtual('ratingDisplay').get(function() {
  return this.rating.toFixed(1);
});

// Pre-save middleware
providerSchema.pre('save', function(next) {
  // Update completion rate
  if (this.totalJobs > 0) {
    this.completionRate = Math.round((this.completedJobs / this.totalJobs) * 100);
  }
  
  // Auto-verify if meets criteria
  if (this.rating >= 4.5 && this.reviewCount >= 10 && this.completionRate >= 95) {
    this.badges.topRated = true;
  }
  
  if (this.averageResponseTime <= 30) {
    this.badges.fastResponse = true;
  }
  
  next();
});

// Static methods
providerSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true, isVerified: true });
};

providerSchema.statics.findByMunicipality = function(municipality) {
  return this.find({ municipality, isActive: true, isVerified: true });
};

providerSchema.statics.findTopRated = function(limit = 10) {
  return this.find({ isActive: true, isVerified: true })
    .sort({ rating: -1, reviewCount: -1 })
    .limit(limit);
};

providerSchema.statics.searchByService = function(service) {
  return this.find({
    services: { $regex: service, $options: 'i' },
    isActive: true,
    isVerified: true
  });
};

// Instance methods
providerSchema.methods.updateRating = function(newRating) {
  const totalRating = this.rating * this.reviewCount + newRating;
  this.reviewCount += 1;
  this.rating = totalRating / this.reviewCount;
  return this.save();
};

providerSchema.methods.addJob = function(completed = false) {
  this.totalJobs += 1;
  if (completed) {
    this.completedJobs += 1;
  }
  return this.save();
};

const Provider = mongoose.model('Provider', providerSchema);

export default Provider; 