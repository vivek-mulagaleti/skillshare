
const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    learner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      required: true,
    },

    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },

    credits: {
      type: Number,
      required: true,
      min: 1,
    },

    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "ACCEPTED",
        "REJECTED",
        "CANCELLED",
        "COMPLETED",
      ],
      default: "PENDING",
      index: true,
    },

    // True after credits are deducted from the learner.
    creditsReserved: {
      type: Boolean,
      default: false,
    },

    // True after reserved credits have been returned.
    creditsRefunded: {
      type: Boolean,
      default: false,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cancellationReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    learnerConfirmedAt: {
      type: Date,
      default: null,
    },

    teacherConfirmedAt: {
      type: Date,
      default: null,
    },

    scheduledAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    meetingLink: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ learner: 1, createdAt: -1 });
sessionSchema.index({ teacher: 1, createdAt: -1 });

module.exports = mongoose.model("Session", sessionSchema);
