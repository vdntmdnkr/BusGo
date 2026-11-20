/**
 * src/routes/userRoutes.js
 * Admin-only user management routes.
 */
const express = require('express');
const router = express.Router();

const { getAllUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { protect, authorise } = require('../middleware/auth');

// All routes below require authentication AND admin role
router.use(protect, authorise('admin'));

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
