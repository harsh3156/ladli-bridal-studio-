const express = require('express');
const router = express.Router();
const {
  login, logout, refreshToken, getMe, updateProfile, changePassword, forgotPassword, resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  loginValidator, forgotPasswordValidator, resetPasswordValidator, changePasswordValidator,
} = require('../validators');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & session management
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Admin login
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: admin@ladlibridalstudio.com }
 *               password: { type: string, example: Admin@123456 }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, loginValidator, validate, login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current session
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', protect, logout);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     security: []
 */
router.post('/refresh-token', refreshToken);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current logged-in user profile
 *     tags: [Auth]
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /auth/update-profile:
 *   put:
 *     summary: Update own profile (name, phone)
 *     tags: [Auth]
 */
router.put('/update-profile', protect, updateProfile);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change own password
 *     tags: [Auth]
 */
router.put('/change-password', protect, changePasswordValidator, validate, changePassword);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Send password reset email
 *     tags: [Auth]
 *     security: []
 */
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, forgotPassword);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset password using token from email
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 */
router.post('/reset-password/:token', authLimiter, resetPasswordValidator, validate, resetPassword);

module.exports = router;
