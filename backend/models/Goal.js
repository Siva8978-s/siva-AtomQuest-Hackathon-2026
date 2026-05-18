const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    thrustArea: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    uom: {
      type: String,
      enum: ['numeric_min', 'numeric_max', 'timeline', 'zero'],
      required: true,
    },
    target: {
      type: String,
      required: true,
    },
    weightage: {
      type: Number,
      required: true,
      min: 10,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rework'],
      default: 'draft',
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    sharedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      default: null,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    quarterlyUpdates: [
      {
        quarter: {
          type: String,
          enum: ['Q1', 'Q2', 'Q3', 'Q4'],
        },
        achievement: {
          type: String,
          default: '',
        },
        progressStatus: {
          type: String,
          enum: ['not_started', 'on_track', 'completed'],
          default: 'not_started',
        },
        progressScore: {
          type: Number,
          default: 0,
        },
        managerComment: {
          type: String,
          default: '',
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Goal', goalSchema);