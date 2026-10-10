
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./MySessions.css";

function getId(value) {
  if (!value) return "";
  return String(value._id || value.id || value);
}

function MySessions() {
  const { user, loading: authLoading } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");

  const currentUserId = getId(user);

  const fetchSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get("/sessions");
      setSessions(response.data.sessions || []);
    } catch (err) {
      console.error(
        "Failed to fetch sessions:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          "Unable to load your sessions. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchSessions();
    }
  }, [authLoading, fetchSessions]);

  const handleRequestAction = async (sessionId, action) => {
    try {
      setActionLoading(`${sessionId}-${action}`);
      setError("");

      await api.patch(`/sessions/${sessionId}/${action}`);

      await fetchSessions();
    } catch (err) {
      console.error(
        `Failed to ${action} session:`,
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          `Unable to ${action} this request. Please try again.`
      );
    } finally {
      setActionLoading("");
    }
  };

  const filteredSessions = sessions.filter((session) => {
    const teacherId = getId(session.teacher);
    const learnerId = getId(session.learner);

    if (activeTab === "INCOMING") {
      return teacherId === currentUserId;
    }

    if (activeTab === "SENT") {
      return learnerId === currentUserId;
    }

    return (
      teacherId === currentUserId ||
      learnerId === currentUserId
    );
  });

  const getStatusClass = (status) => {
    switch (status) {
      case "PENDING":
        return "pending";
      case "ACCEPTED":
        return "accepted";
      case "REJECTED":
        return "rejected";
      case "COMPLETED":
        return "completed";
      case "CANCELLED":
        return "cancelled";
      default:
        return "";
    }
  };

  if (authLoading) {
    return (
      <main className="my-sessions-page">
        <div className="sessions-state">
          <div className="sessions-spinner" />
          <p>Checking your account...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="my-sessions-page">
        <section className="sessions-empty">
          <div className="sessions-empty-icon">🔐</div>
          <h2>Please log in</h2>
          <p>Log in to view and manage your sessions.</p>

          <Link
            to="/login"
            className="sessions-discover-btn"
          >
            Go to login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="my-sessions-page">
      {/* Header */}
      <header className="sessions-header">
        <div>
          <p className="sessions-eyebrow">
            YOUR LEARNING JOURNEY
          </p>

          <h1>My Sessions</h1>

          <p className="sessions-subtitle">
            Manage your learning requests and teaching sessions.
          </p>
        </div>

        <Link
          to="/discover"
          className="sessions-discover-btn"
        >
          Discover skills
        </Link>
      </header>

      {/* Tabs */}
      <nav
        className="sessions-tabs"
        aria-label="Filter sessions"
      >
        {[
          { label: "All sessions", value: "ALL" },
          { label: "Incoming", value: "INCOMING" },
          { label: "Sent by me", value: "SENT" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={
              activeTab === tab.value ? "active" : ""
            }
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Error */}
      {error && (
        <div className="sessions-error" role="alert">
          {error}
        </div>
      )}

      {/* Session content */}
      {loading ? (
        <div className="sessions-state">
          <div className="sessions-spinner" />
          <p>Loading your sessions...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <section className="sessions-empty">
          <div className="sessions-empty-icon">📚</div>

          <h2>
            {activeTab === "INCOMING"
              ? "No incoming requests"
              : activeTab === "SENT"
                ? "No requests sent yet"
                : "No sessions yet"}
          </h2>

          <p>
            {activeTab === "INCOMING"
              ? "Requests from learners will appear here."
              : activeTab === "SENT"
                ? "Sessions you request from other members will appear here."
                : "Your sent and received session requests will appear here."}
          </p>

          <Link
            to="/discover"
            className="sessions-discover-btn"
          >
            Find someone to learn from
          </Link>
        </section>
      ) : (
        <section className="sessions-list">
          {filteredSessions.map((session) => {
            const teacherId = getId(session.teacher);
            const learnerId = getId(session.learner);

            const isTeacher =
              teacherId === currentUserId;
            const isLearner =
              learnerId === currentUserId;

            const otherPerson = isTeacher
              ? session.learner
              : session.teacher;

            const personName =
              otherPerson?.name || "SkillShare member";

            const skillName =
              session.skill?.name || "Learning session";

            return (
              <article
                className="session-card"
                key={session._id}
              >
                <div className="session-card-top">
                  <div className="session-skill-icon">
                    ✦
                  </div>

                  <div className="session-main-info">
                    <h2>{skillName}</h2>

                    <p>
                      {isTeacher
                        ? "Learner"
                        : "Teaching by"}{" "}
                      {personName}
                    </p>
                  </div>

                  <span
                    className={`session-status ${getStatusClass(
                      session.status
                    )}`}
                  >
                    {session.status}
                  </span>
                </div>

                {session.message && (
                  <p className="session-message">
                    “{session.message}”
                  </p>
                )}

                <div className="session-details">
                  <span>
                    <strong>{session.duration}</strong>{" "}
                    {session.duration === 1
                      ? "hour"
                      : "hours"}
                  </span>

                  <span>
                    <strong>
                      {session.credits ?? session.duration}
                    </strong>{" "}
                    credits
                  </span>

                  <span>
                    {isTeacher
                      ? "Incoming request"
                      : "Your request"}
                  </span>
                </div>

                {/* Teacher can accept or reject pending requests */}
                {isTeacher && session.status === "PENDING" && (
                  <div className="session-actions">
                    <button
                      type="button"
                      className="session-reject-btn"
                      disabled={Boolean(actionLoading)}
                      onClick={() =>
                        handleRequestAction(
                          session._id,
                          "reject"
                        )
                      }
                    >
                      {actionLoading ===
                      `${session._id}-reject`
                        ? "Rejecting..."
                        : "Reject"}
                    </button>

                    <button
                      type="button"
                      className="session-accept-btn"
                      disabled={Boolean(actionLoading)}
                      onClick={() =>
                        handleRequestAction(
                          session._id,
                          "accept"
                        )
                      }
                    >
                      {actionLoading ===
                      `${session._id}-accept`
                        ? "Accepting..."
                        : "Accept request"}
                    </button>
                  </div>
                )}

                {/* Either participant can complete an accepted session */}
                {(isTeacher || isLearner) &&
                  session.status === "ACCEPTED" && (
                    <div className="session-actions">
                      <button
                        type="button"
                        className="session-accept-btn"
                        disabled={Boolean(actionLoading)}
                        onClick={() =>
                          handleRequestAction(
                            session._id,
                            "complete"
                          )
                        }
                      >
                        {actionLoading ===
                        `${session._id}-complete`
                          ? "Completing..."
                          : "Complete session"}
                      </button>
                    </div>
                  )}
              </article>
            );
          })}
        </section>
      )}

      {/* Refresh */}
      {!loading && (
        <button
          type="button"
          className="sessions-refresh-btn"
          onClick={fetchSessions}
        >
          Refresh sessions
        </button>
      )}
    </main>
  );
}

export default MySessions;
