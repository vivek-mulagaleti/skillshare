
const mongoose = require("mongoose");
const Notification = require("../models/Notification");

const ALLOWED_TYPES = [
  "SESSION_REQUEST",
  "SESSION_ACCEPTED",
  "SESSION_REJECTED",
  "SESSION_RESCHEDULED",
  "SESSION_CANCELLED",
  "SESSION_COMPLETED",
  "GENERAL",
];

const createNotification = async ({
  recipient,
  actor = null,
  type = "GENERAL",
  title,
  message,
  session = null,
} = {}) => {
  try {
    if (
      !recipient ||
      !mongoose.isValidObjectId(recipient) ||
      (actor !== null && !mongoose.isValidObjectId(actor)) ||
      (session !== null && !mongoose.isValidObjectId(session)) ||
      typeof title !== "string" ||
      typeof message !== "string" ||
      !title.trim() ||
      !message.trim() ||
      title.trim().length > 120 ||
      message.trim().length > 500 ||
      !ALLOWED_TYPES.includes(type)
    ) {
      console.error("Notification skipped: invalid notification data.");
      return null;
    }

    return await Notification.create({
      recipient,
      actor,
      type,
      title: title.trim(),
      message: message.trim(),
      session,
    });
  } catch (error) {
    // Notification failure must not undo the main session operation.
    console.error("Failed to create notification:", error.message);
    return null;
  }
};

module.exports = createNotification;
