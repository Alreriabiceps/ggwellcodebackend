import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import database connection
import connectDB from './config/db.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// ES modules dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

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
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://bataan-connect.vercel.app'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Bataan Connect API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Welcome to Bataan Connect API',
    version: '1.0.0',
    description: 'Smart Contractor & MSME Discovery Platform',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      providers: '/api/providers',
      jobs: '/api/jobs',
      ai: '/api/ai',
      admin: '/api/admin'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Route ${req.originalUrl} does not exist`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error stack:', err.stack);
  
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ============================================================
  🚀 BATAAN CONNECT API SERVER STARTED
  ============================================================
  📡 Server running on port: ${PORT}
  🌍 Environment: ${process.env.NODE_ENV || 'development'}
  📅 Started at: ${new Date().toLocaleString()}
  ============================================================
  `);
});

export default app; 