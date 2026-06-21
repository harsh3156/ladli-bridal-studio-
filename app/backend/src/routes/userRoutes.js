const express = require('express');
const router = express.Router();
const {
  getAllUsers, getUserById, createUser, updateUser, deleteUser, toggleUserActive,
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerValidator, mongoIdValidator } = require('../validators');

// All user routes require admin authentication
router.use(protect);
router.use(restrictTo('super_admin', 'manager'));

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Admin user management
 */

router.get('/', getAllUsers);
router.post('/', restrictTo('super_admin'), registerValidator, validate, createUser);
router.get('/:id', mongoIdValidator, validate, getUserById);
router.put('/:id', mongoIdValidator, validate, updateUser);
router.delete('/:id', restrictTo('super_admin'), mongoIdValidator, validate, deleteUser);
router.put('/:id/toggle-active', restrictTo('super_admin'), mongoIdValidator, validate, toggleUserActive);

module.exports = router;
