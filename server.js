import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import database connection
import connectDB from './config/db.js';

// Load environment variables
dotenv.config();

// Set a default JWT_SECRET if not provided in .env for development purposes
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your-default-jwt-secret-for-development';
}

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes - Updated to use module structure
import authRoutes from './modules/auth/authRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import aiSmartMatchingRoutes from './routes/aiSmartMatchingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Rekomendito API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-smart-matching', aiSmartMatchingRoutes);
app.use('/api/admin', adminRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Welcome to Rekomendito API',
    version: '1.0.0',
    description: 'Smart Provider Discovery Platform for Bataan Province',
    endpoints: {
      auth: '/api/auth',
      providers: '/api/providers',
      jobs: '/api/jobs',
      ai: '/api/ai',
      aiSmartMatching: '/api/ai-smart-matching',
      admin: '/api/admin'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`
🚀 REKOMENDITO API SERVER STARTED
📡 Server running on port ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
📊 Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}
🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Not configured'}
⚡ Gemini AI: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured'}
  `);
  }); 