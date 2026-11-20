/**
 * src/routes/walletRoutes.js
 */
const express = require('express');
const router = express.Router();
const { getWallet, topupWallet, getTransactions } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getWallet);
router.post('/topup', topupWallet);
router.get('/transactions', getTransactions);

module.exports = router;
