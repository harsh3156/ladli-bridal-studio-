const cloudinary = require('cloudinary').v2;
// NOTE: cloudinary v1.x is used for multer-storage-cloudinary compatibility
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const logger = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

logger.info('✅ Cloudinary configured');

// Storage for Services
const serviceStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ladli-bridal/services',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'fill', quality: 'auto' }],
  },
});

// Storage for Gallery
const galleryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ladli-bridal/gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 900, crop: 'fill', quality: 'auto' }],
  },
});

// Storage for Team
const teamStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ladli-bridal/team',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }],
  },
});

// Storage for Testimonials
const testimonialStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ladli-bridal/testimonials',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 'auto' }],
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
  }
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB

// Multer upload instances
const uploadServiceImage = multer({ storage: serviceStorage, fileFilter, limits });
const uploadGalleryImages = multer({ storage: galleryStorage, fileFilter, limits });
const uploadTeamImage = multer({ storage: teamStorage, fileFilter, limits });
const uploadTestimonialImage = multer({ storage: testimonialStorage, fileFilter, limits });

// Delete from cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info(`Deleted image from Cloudinary: ${publicId}`);
  } catch (error) {
    logger.error(`Failed to delete from Cloudinary: ${error.message}`);
    throw error;
  }
};

// Extract public ID from URL
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  const folder = parts[parts.length - 2];
  const parentFolder = parts[parts.length - 3];
  return `${parentFolder}/${folder}/${filename.split('.')[0]}`;
};

module.exports = {
  cloudinary,
  uploadServiceImage,
  uploadGalleryImages,
  uploadTeamImage,
  uploadTestimonialImage,
  deleteFromCloudinary,
  getPublicIdFromUrl,
};
