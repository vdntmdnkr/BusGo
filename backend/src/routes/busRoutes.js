/**
 * src/routes/busRoutes.js
 */
const express = require('express');
const router = express.Router();
const { searchBuses, getBusById, createBus } = require('../controllers/busController');
const { protect, authorise } = require('../middleware/auth');

router.get('/', searchBuses);
router.get('/:id', getBusById);
router.post('/', protect, authorise('admin'), createBus);

module.exports = router;
