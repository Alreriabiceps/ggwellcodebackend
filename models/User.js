import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['client', 'provider', 'admin'],
    default: 'client'
  },
  phone: {
    type: String,
    match: [/^(\+639|09)\d{9}$/, 'Please enter a valid Philippine phone number']
  },
  profileImage: {
    type: String,
    default: null
  },
  location: {
    barangay: String,
    municipality: {
      type: String,
      default: 'Bataan'
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    privacy: {
      showPhone: { type: Boolean, default: true },
      showLocation: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for geospatial queries
UserSchema.index({ 'location.coordinates': '2dsphere' });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

// Virtual for user's age-like info
UserSchema.virtual('memberSince').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) return `${diffDays} days`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
  return `${Math.floor(diffDays / 365)} years`;
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Only hash password if it's modified or new
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update last login
UserSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Static method to find users by location
UserSchema.statics.findByLocation = function(latitude, longitude, radiusInKm = 10) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusInKm * 1000 // Convert km to meters
      }
    }
  });
};

// Remove password from JSON output
UserSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model('User', UserSchema);

export default User; 