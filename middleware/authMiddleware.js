import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user still exists and is active
      const user = await User.findById(decoded.userId).select('-password');
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. User not found or deactivated.'
        });
      }

      req.user = {
        userId: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      };

      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

/**
 * Middleware to check if user has provider role
 */
export const requireProvider = (req, res, next) => {
  if (req.user.role !== 'provider') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Provider account required.'
    });
  }
  next();
};

/**
 * Middleware to check if user has client role
 */
export const requireClient = (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Client account required.'
    });
  }
  next();
};

/**
 * Middleware to check if user has provider or admin role
 */
export const requireProviderOrAdmin = (req, res, next) => {
  if (req.user.role !== 'provider' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Provider or admin account required.'
    });
  }
  next();
};

/**
 * Middleware to check if user has client or admin role
 */
export const requireClientOrAdmin = (req, res, next) => {
  if (req.user.role !== 'client' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Client or admin account required.'
    });
  }
  next();
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.userId).select('-password');
      if (user && user.isActive) {
        req.user = {
          userId: user._id,
          email: user.email,
          role: user.role,
          name: user.name
        };
      }
    } catch (jwtError) {
      // Token invalid, but we continue without authentication
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue without authentication
  }
};

export default {
  authenticate,
  requireAdmin,
  requireProvider,
  requireClient,
  requireProviderOrAdmin,
  requireClientOrAdmin,
  optionalAuth
}; 