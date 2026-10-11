
import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Bell, CheckCheck, RefreshCw, Trash2 } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./Notifications.css";

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Notifications() {
  const { user, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/notifications?limit=100");

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load notifications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchNotifications();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, fetchNotifications]);

  const markAsRead = async (notification) => {
    if (notification.readAt) return;

    try {
      setActionLoading(notification._id);

      await api.patch(`/notifications/${notification._id}/read`);

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? { ...item, readAt: new Date().toISOString() }
            : item
        )
      );

      setUnreadCount((count) => Math.max(0, count - 1));
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to mark notification as read."
      );
    } finally {
      setActionLoading("");
    }
  };

  const markAllAsRead = async () => {
    try {
      setActionLoading("all");

      await api.patch("/notifications/read-all");

      const readAt = new Date().toISOString();

      setNotifications((current) =>
        current.map((item) => ({ ...item, readAt }))
      );

      setUnreadCount(0);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to mark all notifications as read."
      );
    } finally {
      setActionLoading("");
    }
  };

  const deleteNotification = async (notification) => {
    try {
      setActionLoading(notification._id);

      await api.delete(`/notifications/${notification._id}`);

      setNotifications((current) =>
        current.filter((item) => item._id !== notification._id)
      );

      if (!notification.readAt) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete notification."
      );
    } finally {
      setActionLoading("");
    }
  };

  if (authLoading) {
    return (
      <main className="notifications-page">
        <p>Checking your account...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="notifications-page">
      <header className="notifications-page-header">
        <div className="notifications-title">
          <span className="notifications-title-icon">
            <Bell size={23} />
          </span>

          <div>
            <p className="notifications-eyebrow">STAY UP TO DATE</p>
            <h1>Notifications</h1>
            <p>Updates about your learning and teaching sessions.</p>
          </div>
        </div>

        <div className="notifications-header-actions">
          <button
            type="button"
            className="notifications-secondary-button"
            onClick={fetchNotifications}
            disabled={loading || actionLoading !== ""}
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            type="button"
            className="notifications-primary-button"
            onClick={markAllAsRead}
            disabled={
              loading || unreadCount === 0 || actionLoading !== ""
            }
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        </div>
      </header>

      <div className="notifications-summary">
        <span>
          {notifications.length}{" "}
          {notifications.length === 1
            ? "notification"
            : "notifications"}
        </span>

        <strong>{unreadCount} unread</strong>
      </div>

      {error && (
        <div className="notifications-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <section className="notifications-empty">
          <p>Loading notifications...</p>
        </section>
      ) : notifications.length === 0 ? (
        <section className="notifications-empty">
          <Bell size={34} />
          <h2>You're all caught up</h2>
          <p>New session updates will appear here.</p>
          <Link to="/discover">Discover skills</Link>
        </section>
      ) : (
        <section className="notifications-list">
          {notifications.map((notification) => (
            <article
              key={notification._id}
              className={`notifications-card ${
                notification.readAt ? "read" : "unread"
              }`}
            >
              <span className="notifications-card-dot" />

              <div className="notifications-card-content">
                <div className="notifications-card-heading">
                  <h2>{notification.title}</h2>

                  {!notification.readAt && (
                    <span className="notifications-new-label">
                      NEW
                    </span>
                  )}
                </div>

                <p>{notification.message}</p>

                <time dateTime={notification.createdAt}>
                  {formatDate(notification.createdAt)}
                </time>

                {notification.session && (
                  <Link
                    to="/my-sessions"
                    className="notifications-session-link"
                  >
                    View session
                  </Link>
                )}
              </div>

              <div className="notifications-card-actions">
                {!notification.readAt && (
                  <button
                    type="button"
                    disabled={actionLoading !== ""}
                    onClick={() => markAsRead(notification)}
                  >
                    <CheckCheck size={15} />
                    Mark read
                  </button>
                )}

                <button
                  type="button"
                  className="notifications-delete"
                  disabled={actionLoading !== ""}
                  onClick={() => deleteNotification(notification)}
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default Notifications;
