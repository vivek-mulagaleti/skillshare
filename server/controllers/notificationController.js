
const mongoose = require("mongoose");
const Notification = require("../models/Notification");

const getCurrentUserId = (req) =>
  req.user?.userId || req.user?._id || req.user?.id;

const isValidId = (id) => mongoose.isValidObjectId(id);

const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

// GET /api/notifications
const getMyNotifications = async (req, res, next) => {
  try {
    const userId = getCurrentUserId(req);

    if (!userId || !isValidId(userId)) {
      return sendError(res, 401, "Invalid authenticated user.");
    }

    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
      : 30;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .populate("actor", "name avatar")
        .populate("session", "status scheduledAt")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),

      Notification.countDocuments({
        recipient: userId,
        readAt: null,
      }),
    ]);

    return res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/notifications/unread-count
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = getCurrentUserId(req);

    if (!userId || !isValidId(userId)) {
      return sendError(res, 401, "Invalid authenticated user.");
    }

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      readAt: null,
    });

    return res.json({ success: true, unreadCount });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/read-all
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = getCurrentUserId(req);

    if (!userId || !isValidId(userId)) {
      return sendError(res, 401, "Invalid authenticated user.");
    }

    const result = await Notification.updateMany(
      { recipient: userId, readAt: null },
      { $set: { readAt: new Date() } }
    );

    return res.json({
      success: true,
      message: "All notifications marked as read.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const userId = getCurrentUserId(req);
    const { id } = req.params;

    if (!userId || !isValidId(userId)) {
      return sendError(res, 401, "Invalid authenticated user.");
    }

    if (!isValidId(id)) {
      return sendError(res, 400, "Invalid notification ID.");
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { $set: { readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      return sendError(res, 404, "Notification not found.");
    }

    return res.json({
      success: true,
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notifications/:id
const deleteNotification = async (req, res, next) => {
  try {
    const userId = getCurrentUserId(req);
    const { id } = req.params;

    if (!userId || !isValidId(userId)) {
      return sendError(res, 401, "Invalid authenticated user.");
    }

    if (!isValidId(id)) {
      return sendError(res, 400, "Invalid notification ID.");
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId,
    });

    if (!notification) {
      return sendError(res, 404, "Notification not found.");
    }

    return res.json({
      success: true,
      message: "Notification deleted.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  deleteNotification,
};
