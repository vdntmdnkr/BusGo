/**
 * src/controllers/productController.js
 * Full CRUD for Product resource with pagination & search.
 */
const Product = require('../models/Product');
const { sendSuccess, sendError, paginationMeta } = require('../utils/apiResponse');

// ──────────────────────────────────────────────────────────
// @route   GET /api/products
// @access  Public
// ──────────────────────────────────────────────────────────
const getAllProducts = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isPublished: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    // Sorting
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('createdBy', 'name email')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    return sendSuccess(
      res,
      200,
      'Products fetched',
      products,
      paginationMeta(total, page, limit)
    );
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────
// @route   GET /api/products/:id
// @access  Public
// ──────────────────────────────────────────────────────────
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      'createdBy',
      'name email'
    );
    if (!product) return sendError(res, 404, 'Product not found');

    return sendSuccess(res, 200, 'Product fetched', product);
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────
// @route   POST /api/products
// @access  Private
// ──────────────────────────────────────────────────────────
const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({ ...req.body, createdBy: req.user._id });
    return sendSuccess(res, 201, 'Product created', product);
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────
// @route   PUT /api/products/:id
// @access  Private (owner or admin)
// ──────────────────────────────────────────────────────────
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 404, 'Product not found');

    // Only owner or admin may update
    if (
      product.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return sendError(res, 403, 'Not authorised to update this product');
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    return sendSuccess(res, 200, 'Product updated', updated);
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────
// @route   DELETE /api/products/:id
// @access  Private (owner or admin)
// ──────────────────────────────────────────────────────────
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return sendError(res, 404, 'Product not found');

    if (
      product.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return sendError(res, 403, 'Not authorised to delete this product');
    }

    await product.deleteOne();
    return sendSuccess(res, 200, 'Product deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
