/**
 * src/routes/operatorRoutes.js
 */
const express = require('express');
const router = express.Router();
const {
  registerOperator,
  loginOperator,
  getDashboardStats,
  getMyBuses,
  addBus,
  updateBus,
  deleteBus,
  getOperatorBookings,
  toggleVerification,
  getPopularOperators,
} = require('../controllers/operatorController');
const { protect, authorise } = require('../middleware/auth');

// Public routes
router.post('/register', registerOperator);
router.post('/login', loginOperator);
router.get('/popular', getPopularOperators);

// Operator protected routes
router.use(protect);

router.get('/dashboard-stats', authorise('operator', 'admin'), getDashboardStats);
router.get('/my-buses', authorise('operator', 'admin'), getMyBuses);
router.post('/my-buses', authorise('operator', 'admin'), addBus);
router.put('/my-buses/:id', authorise('operator', 'admin'), updateBus);
router.delete('/my-buses/:id', authorise('operator', 'admin'), deleteBus);
router.get('/my-bookings', authorise('operator', 'admin'), getOperatorBookings);
router.put('/verify-toggle/:id?', toggleVerification);

module.exports = router;
