
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Trash2 } from "lucide-react";
import api from "../services/api";
import "./NotificationBell.css";

function timeAgo(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get("/notifications?limit=8");

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
      setError("");
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Unable to load notifications.");
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const intervalId = setInterval(fetchNotifications, 60000);

    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const toggleDropdown = async () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);

    if (willOpen) {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    }
  };

  const markAsRead = async (notification) => {
    if (notification.readAt) return;

    try {
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
        err.response?.data?.message || "Unable to mark as read."
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");

      const readAt = new Date().toISOString();

      setNotifications((current) =>
        current.map((item) => ({ ...item, readAt }))
      );

      setUnreadCount(0);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to mark all as read."
      );
    }
  };

  const deleteNotification = async (notification) => {
    try {
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
        err.response?.data?.message || "Unable to delete notification."
      );
    }
  };

  const openNotification = async (notification) => {
    await markAsRead(notification);
    setIsOpen(false);

    navigate(
      notification.session ? "/my-sessions" : "/notifications"
    );
  };

  return (
    <div className="notification-bell-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="notification-bell-button"
        onClick={toggleDropdown}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell size={21} />

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          className="notification-dropdown"
          aria-label="Recent notifications"
        >
          <header className="notification-dropdown-header">
            <div>
              <h3>Notifications</h3>
              <p>
                {unreadCount === 0
                  ? "You're all caught up"
                  : `${unreadCount} unread`}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-link-button"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </header>

          {error && (
            <p className="notification-error" role="alert">
              {error}
              <button
                type="button"
                className="notification-link-button"
                onClick={fetchNotifications}
              >
                Retry
              </button>
            </p>
          )}

          {loading ? (
            <p className="notification-empty">Loading...</p>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              <Bell size={25} />
              <p>No notifications yet.</p>
            </div>
          ) : (
            <div className="notification-items">
              {notifications.map((notification) => (
                <article
                  key={notification._id}
                  className={`notification-item ${
                    notification.readAt ? "is-read" : "is-unread"
                  }`}
                >
                  <button
                    type="button"
                    className="notification-item-content"
                    onClick={() => openNotification(notification)}
                  >
                    <span className="notification-item-dot" />

                    <span className="notification-item-text">
                      <strong>{notification.title}</strong>
                      <span>{notification.message}</span>
                      <small>{timeAgo(notification.createdAt)}</small>
                    </span>
                  </button>

                  <div className="notification-item-actions">
                    {!notification.readAt && (
                      <button
                        type="button"
                        title="Mark as read"
                        aria-label="Mark as read"
                        onClick={() => markAsRead(notification)}
                      >
                        <Check size={15} />
                      </button>
                    )}

                    <button
                      type="button"
                      title="Delete notification"
                      aria-label="Delete notification"
                      onClick={() => deleteNotification(notification)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <footer className="notification-dropdown-footer">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate("/notifications");
              }}
            >
              View all notifications
            </button>
          </footer>
        </section>
      )}
    </div>
  );
}

export default NotificationBell;
