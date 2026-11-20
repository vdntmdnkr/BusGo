/**
 * src/controllers/busController.js
 * Search buses, retrieve bus details, boarding/dropping points.
 */
const Bus = require('../models/Bus');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ──────────────────────────────────────────────────────────
// @route   GET /api/buses?from=pune&to=mumbai&date=2026-10-27
// @access  Public
// ──────────────────────────────────────────────────────────
const searchBuses = async (req, res, next) => {
  try {
    const { from, to, type } = req.query;
    if (!from || !to) {
      return sendError(res, 400, 'Please provide both departure and destination cities');
    }

    const query = {
      from: from.trim().toLowerCase(),
      to: to.trim().toLowerCase(),
      isActive: true,
      availableSeats: { $gt: 0 },
    };

    if (type && type !== 'all') {
      if (type === 'ac') query.busType = { $regex: /ac/i, $not: /non-ac/i };
      else if (type === 'nonac') query.busType = { $regex: /non-ac/i };
      else if (type === 'sleeper') query.busType = { $regex: /sleeper/i };
      else if (type === 'seater') query.busType = { $regex: /seater/i };
    }

    const buses = await Bus.find(query).sort({ fare: 1 });

    return sendSuccess(res, 200, `${buses.length} bus(es) found`, buses);
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────
// @route   GET /api/buses/:id
// @access  Public
// ──────────────────────────────────────────────────────────
const getBusById = async (req, res, next) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) return sendError(res, 404, 'Bus not found');
    return sendSuccess(res, 200, 'Bus fetched', bus);
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────────────
// @route   POST /api/buses (Admin/Seed route)
// @access  Private (Admin only)
// ──────────────────────────────────────────────────────────
const createBus = async (req, res, next) => {
  try {
    const bus = await Bus.create(req.body);
    return sendSuccess(res, 201, 'Bus created', bus);
  } catch (err) {
    next(err);
  }
};

module.exports = { searchBuses, getBusById, createBus };
