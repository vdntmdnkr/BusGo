/**
 * src/models/Bus.js
 * Bus route / schedule model for BusGo app.
 */
const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const busSchema = new mongoose.Schema(
  {
    operator: {
      type: String,
      required: [true, 'Operator name is required'],
      trim: true,
    },
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    busNumber: {
      type: String,
      required: true,
      trim: true,
    },
    busType: {
      type: String,
      enum: [
        'AC Sleeper',
        'Non-AC Sleeper',
        'AC Seater',
        'Non-AC Seater',
        'Volvo AC',
        'Semi Sleeper',
        'Bharat Benz AC',
        'Multi-Axle Sleeper',
      ],
      default: 'AC Seater',
    },
    from: {
      type: String,
      required: [true, 'Source city is required'],
      trim: true,
      lowercase: true,
    },
    to: {
      type: String,
      required: [true, 'Destination city is required'],
      trim: true,
      lowercase: true,
    },
    departureTime: { type: String, required: true }, // e.g. "08:00"
    arrivalTime: { type: String, required: true },   // e.g. "12:30"
    duration: { type: String, required: true },      // e.g. "4h 30m"
    fare: { type: Number, required: true, min: 0 },
    totalSeats: { type: Number, default: 40, min: 10, max: 60 },
    availableSeats: { type: Number, default: 40, min: 0 },
    amenities: [{ type: String }],                   // e.g. ['WiFi', 'Charging', 'Blanket', 'Water Bottle']
    boardingPoints: [pointSchema],
    droppingPoints: [pointSchema],
    rating: { type: Number, default: 4.2, min: 1, max: 5 },
    isActive: { type: Boolean, default: true },
    cancellationPolicy: {
      type: String,
      default: 'Free cancellation up to 6 hours before departure. 50% refund within 6 hours.',
    },
  },
  { timestamps: true }
);

// Index for fast city-pair search
busSchema.index({ from: 1, to: 1, isActive: 1 });
busSchema.index({ operatorId: 1 });

module.exports = mongoose.model('Bus', busSchema);
