/**
 * src/routes/productRoutes.js
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, authorise } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const productRules = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
];

// ─── Routes ──────────────────────────────────────────────
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected — must be logged in
router.post('/', protect, productRules, validate, createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
