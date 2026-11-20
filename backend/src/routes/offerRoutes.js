/**
 * src/routes/offerRoutes.js
 */
const express = require('express');
const router = express.Router();
const { getOffers, validateOffer } = require('../controllers/offerController');
const { protect } = require('../middleware/auth');

router.get('/', getOffers);
router.post('/validate', protect, validateOffer);

module.exports = router;
