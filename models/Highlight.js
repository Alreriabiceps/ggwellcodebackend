import mongoose from 'mongoose';

const HighlightSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: [true, 'Provider is required']
  },
  title: {
    type: String,
    required: [true, 'Highlight title is required'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters']
  },
  description: {
    type: String,
    required: [true, 'Highlight description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: [
      'featured_provider',
      'success_story',
      'project_showcase',
      'new_member',
      'community_choice',
      'seasonal_special',
      'emergency_hero',
      'innovation_award'
    ],
    required: [true, 'Highlight type is required']
  },
  featuredImage: {
    type: String,
    required: [true, 'Featured image is required']
  },
  additionalImages: [{
    url: String,
    caption: String
  }],
  content: {
    story: String,
    achievements: [String],
    projectDetails: {
      name: String,
      location: String,
      duration: String,
      value: Number,
      challenges: String,
      solution: String,
      results: String
    },
    clientTestimonial: {
      name: String,
      review: String,
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      date: Date
    },
    metrics: {
      projectsCompleted: Number,
      clientsSatisfied: Number,
      yearsExperience: Number,
      responseTime: String
    }
  },
  badge: {
    text: String,
    color: {
      type: String,
      enum: ['blue', 'green', 'yellow', 'red', 'purple', 'orange'],
      default: 'blue'
    }
  },
  period: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    week: Number, // Week number of the year
    year: Number,
    season: {
      type: String,
      enum: ['spring', 'summer', 'fall', 'winter', 'holiday', 'special']
    }
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'expired', 'archived'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  statistics: {
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    inquiries: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  location: {
    barangay: String,
    municipality: {
      type: String,
      default: 'Bataan'
    },
    featured: {
      type: Boolean,
      default: false
    }
  },
  socialMedia: {
    shareable: {
      type: Boolean,
      default: true
    },
    hashtags: [String],
    mentions: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  autoGenerated: {
    type: Boolean,
    default: false
  },
  aiSuggestions: {
    generated: {
      type: Boolean,
      default: false
    },
    score: Number,
    reasons: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
HighlightSchema.index({ status: 1 });
HighlightSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });
HighlightSchema.index({ type: 1 });
HighlightSchema.index({ priority: -1 });
HighlightSchema.index({ isFeatured: 1 });
HighlightSchema.index({ provider: 1 });
HighlightSchema.index({ createdAt: -1 });

// Virtual for days remaining
HighlightSchema.virtual('daysRemaining').get(function() {
  if (!this.period.endDate) return null;
  const now = new Date();
  const diffTime = this.period.endDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for is currently active
HighlightSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         now >= this.period.startDate && 
         now <= this.period.endDate;
});

// Virtual for engagement rate
HighlightSchema.virtual('engagementRate').get(function() {
  if (this.statistics.views === 0) return 0;
  return ((this.statistics.clicks + this.statistics.inquiries) / this.statistics.views * 100).toFixed(2);
});

// Method to activate highlight
HighlightSchema.methods.activate = function() {
  const now = new Date();
  if (now < this.period.startDate) {
    this.status = 'scheduled';
  } else if (now >= this.period.startDate && now <= this.period.endDate) {
    this.status = 'active';
  } else {
    this.status = 'expired';
  }
  return this.save();
};

// Method to increment views
HighlightSchema.methods.incrementViews = function() {
  this.statistics.views += 1;
  return this.save({ validateBeforeSave: false });
};

// Method to increment clicks
HighlightSchema.methods.incrementClicks = function() {
  this.statistics.clicks += 1;
  return this.save({ validateBeforeSave: false });
};

// Method to increment inquiries
HighlightSchema.methods.incrementInquiries = function() {
  this.statistics.inquiries += 1;
  return this.save({ validateBeforeSave: false });
};

// Static method to get current active highlights
HighlightSchema.statics.getCurrentHighlights = function(limit = 5) {
  const now = new Date();
  return this.find({
    status: 'active',
    isActive: true,
    'period.startDate': { $lte: now },
    'period.endDate': { $gte: now }
  })
  .populate('provider', 'businessName user')
  .populate({
    path: 'provider',
    populate: {
      path: 'user',
      select: 'name profileImage'
    }
  })
  .sort({ priority: -1, isFeatured: -1, createdAt: -1 })
  .limit(limit);
};

// Static method to get highlights by type
HighlightSchema.statics.getByType = function(type, limit = 10) {
  const now = new Date();
  return this.find({
    type,
    status: 'active',
    isActive: true,
    'period.startDate': { $lte: now },
    'period.endDate': { $gte: now }
  })
  .populate('provider', 'businessName user')
  .populate({
    path: 'provider',
    populate: {
      path: 'user',
      select: 'name profileImage'
    }
  })
  .sort({ priority: -1, createdAt: -1 })
  .limit(limit);
};

// Static method to get weekly highlights
HighlightSchema.statics.getWeeklyHighlights = function(year, week) {
  return this.find({
    'period.year': year,
    'period.week': week,
    status: { $in: ['active', 'expired'] },
    isActive: true
  })
  .populate('provider', 'businessName user')
  .populate({
    path: 'provider',
    populate: {
      path: 'user',
      select: 'name profileImage'
    }
  })
  .sort({ priority: -1, isFeatured: -1 });
};

// Pre-save middleware to set week and year
HighlightSchema.pre('save', function(next) {
  if (this.period.startDate) {
    const date = new Date(this.period.startDate);
    this.period.year = date.getFullYear();
    
    // Calculate week number
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date - firstDayOfYear) / (24 * 60 * 60 * 1000));
    this.period.week = Math.ceil((dayOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
  next();
});

// Pre-save middleware to auto-update status based on dates
HighlightSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.status === 'scheduled' || this.status === 'active') {
    if (now < this.period.startDate) {
      this.status = 'scheduled';
    } else if (now >= this.period.startDate && now <= this.period.endDate) {
      this.status = 'active';
    } else if (now > this.period.endDate) {
      this.status = 'expired';
    }
  }
  
  next();
});

const Highlight = mongoose.model('Highlight', HighlightSchema);

export default Highlight; 