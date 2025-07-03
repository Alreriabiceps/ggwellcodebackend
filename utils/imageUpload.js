import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Upload and process profile picture
 * @param {Object} file - Multer file object
 * @param {String} userId - User ID for filename
 * @returns {String} - Relative path to uploaded file
 */
export const uploadProfilePicture = async (file, userId) => {
  try {
    // Ensure uploads/profiles directory exists
    const uploadsDir = path.join(__dirname, '../uploads/profiles');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    const filename = `profile-${userId}-${timestamp}${fileExtension}`;
    const filepath = path.join(uploadsDir, filename);

    // Move file to destination
    fs.writeFileSync(filepath, file.buffer);

    // Return relative path for database storage
    return `/uploads/profiles/${filename}`;

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw new Error('Failed to upload profile picture');
  }
};

/**
 * Delete old profile picture
 * @param {String} oldImagePath - Path to old image
 */
export const deleteOldProfilePicture = async (oldImagePath) => {
  try {
    if (oldImagePath && oldImagePath !== '/uploads/profiles/default-avatar.png') {
      const fullPath = path.join(__dirname, '..', oldImagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  } catch (error) {
    console.error('Error deleting old profile picture:', error);
    // Don't throw error as this is not critical
  }
};

/**
 * Validate image file
 * @param {Object} file - Multer file object
 * @returns {Boolean} - True if valid
 */
export const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.');
  }

  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  return true;
};

/**
 * Get file size in human readable format
 * @param {Number} bytes - File size in bytes
 * @returns {String} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 