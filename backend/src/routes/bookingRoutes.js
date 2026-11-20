/**
 * src/routes/bookingRoutes.js
 */
const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getTakenSeats,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

// Public seat availability query
router.get('/taken/:busId', getTakenSeats);

// Protected booking actions
router.use(protect);
router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/:id', getBookingById);
router.put('/:id/cancel', cancelBooking);

module.exports = router;
