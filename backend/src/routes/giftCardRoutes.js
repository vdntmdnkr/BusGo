/**
 * src/routes/giftCardRoutes.js
 */
const express = require('express');
const router = express.Router();
const { generateDemoGiftCard, redeemGiftCard, getMyRedeemedCards } = require('../controllers/giftCardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/generate-demo', generateDemoGiftCard);
router.post('/redeem', redeemGiftCard);
router.get('/my-redeemed', getMyRedeemedCards);

module.exports = router;
