import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../../middleware/authMiddleware.js';
import { validateImageFile } from '../../utils/imageUpload.js';
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  refreshToken
} from './authController.js';

const router = express.Router();

// Multer configuration for profile picture uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    try {
      validateImageFile(file);
      cb(null, true);
    } catch (error) {
      cb(new Error(error.message));
    }
  }
});

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, upload.single('profilePicture'), updateProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/refresh', authenticate, refreshToken);

export default router; 