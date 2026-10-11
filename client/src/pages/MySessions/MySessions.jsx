import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, X } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./MySessions.css";

function getId(value) {
  if (!value) return "";
  return String(value._id || value.id || value);
}

function getLocalDateTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");

  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function MySessions() {
  const { user, loading: authLoading } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");

  const [editingSession, setEditingSession] = useState(null);
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");

  // Review state
  const [reviewSession, setReviewSession] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewsBySession, setReviewsBySession] = useState({});
  const [reviewLoading, setReviewLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const currentUserId = getId(user);
  const isRescheduling = editingSession?.status === "ACCEPTED";

  const fetchSessions = useCallback(async () => {
    const userId = getId(user);

    if (!userId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get("/sessions");
      const fetchedSessions = response.data.sessions || [];

      const ownSessions = fetchedSessions.filter(
        (session) =>
          getId(session.teacher) === userId ||
          getId(session.learner) === userId,
      );

      setSessions(ownSessions);

      // Check review status only for completed sessions where
      // the current user was the learner.
      const completedLearnerSessions = ownSessions.filter(
        (session) =>
          session.status === "COMPLETED" && getId(session.learner) === userId,
      );

      const reviewResults = await Promise.all(
        completedLearnerSessions.map(async (session) => {
          try {
            const reviewResponse = await api.get(
              `/reviews/session/${session._id}/mine`,
            );

            return [
              session._id,
              {
                reviewed: Boolean(reviewResponse.data.review),
                review: reviewResponse.data.review || null,
                canReview: Boolean(reviewResponse.data.canReview),
              },
            ];
          } catch (reviewError) {
            console.error(
              `Unable to check review for session ${session._id}:`,
              reviewError.response?.data || reviewError.message,
            );

            return [
              session._id,
              {
                reviewed: false,
                review: null,
                canReview: false,
                checkFailed: true,
              },
            ];
          }
        }),
      );

      setReviewsBySession((current) => ({
        ...current,
        ...Object.fromEntries(reviewResults),
      }));
    } catch (err) {
      console.error("Failed to fetch sessions:", err);

      setSessions([]);
      setError(
        err.response?.data?.message ||
          "Unable to load your sessions. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) fetchSessions();
  }, [authLoading, fetchSessions]);

  const handleRequestAction = async (sessionId, action, body) => {
    try {
      setActionLoading(`${sessionId}-${action}`);
      setError("");
      setNotice("");

      const response = await api.patch(
        `/sessions/${sessionId}/${action}`,
        body,
      );

      setNotice(response.data.message || "Action completed successfully.");

      if (action === "accept" || action === "reschedule") {
        setEditingSession(null);
        setMeetingLink("");
        setMeetingDate("");
        setMeetingTime("");
      }

      await fetchSessions();
    } catch (err) {
      console.error(`Failed to ${action} session:`, err);

      setError(
        err.response?.data?.message ||
          `Unable to ${action} this session. Please try again.`,
      );
    } finally {
      setActionLoading("");
    }
  };

  const openScheduleModal = (session) => {
    const initialDate = session.scheduledAt
      ? new Date(session.scheduledAt)
      : new Date();

    const local = getLocalDateTime(initialDate);

    setError("");
    setNotice("");
    setMeetingLink(session.meetingLink || "");
    setMeetingDate(local.date);
    setMeetingTime(local.time);
    setEditingSession(session);
  };

  const closeScheduleModal = () => {
    if (actionLoading) return;

    setEditingSession(null);
    setMeetingLink("");
    setMeetingDate("");
    setMeetingTime("");
  };

  const handleSaveSchedule = async (event) => {
    event.preventDefault();

    if (!editingSession) return;

    let parsedUrl;

    try {
      parsedUrl = new URL(meetingLink.trim());

      const hostname = parsedUrl.hostname.toLowerCase();

      const isGoogleMeet = hostname === "meet.google.com";

      const isZoom = hostname === "zoom.us" || hostname.endsWith(".zoom.us");

      const isMicrosoftTeams =
        hostname === "teams.microsoft.com" ||
        hostname.endsWith(".teams.microsoft.com") ||
        hostname === "teams.live.com" ||
        hostname.endsWith(".teams.live.com");

      const isSupportedMeetingPlatform =
        ["https:"].includes(parsedUrl.protocol) &&
        (isGoogleMeet || isZoom || isMicrosoftTeams);

      if (!isSupportedMeetingPlatform) {
        setError(
          "Please enter a valid Google Meet, Zoom, or Microsoft Teams meeting link.",
        );
        return;
      }
    } catch {
      setError(
        "Please enter a valid Google Meet, Zoom, or Microsoft Teams meeting link.",
      );
      return;
    }

    if (!meetingDate || !meetingTime) {
      setError("Please select a meeting date and time.");
      return;
    }

    const localDateTime = new Date(`${meetingDate}T${meetingTime}`);

    if (
      Number.isNaN(localDateTime.getTime()) ||
      localDateTime.getTime() <= Date.now()
    ) {
      setError("Please choose a future date and time.");
      return;
    }

    const action =
      editingSession.status === "ACCEPTED" ? "reschedule" : "accept";

    await handleRequestAction(editingSession._id, action, {
      meetingLink: parsedUrl.href,
      scheduledAt: localDateTime.toISOString(),
    });
  };

  const handleCancel = (session) => {
    if (
      window.confirm(
        "Cancel this session? If credits were reserved, they will be refunded to the learner.",
      )
    ) {
      handleRequestAction(session._id, "cancel");
    }
  };

  // Open the review form for a completed session.
  const openReviewModal = (session) => {
    const existingReview = reviewsBySession[session._id]?.review;

    setError("");
    setNotice("");
    setReviewSession(session);
    setReviewRating(existingReview?.rating || 5);
    setReviewComment(existingReview?.comment || "");
    setHoverRating(0);
  };

  const closeReviewModal = () => {
    if (reviewLoading) return;

    setReviewSession(null);
    setReviewRating(5);
    setReviewComment("");
    setHoverRating(0);
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();

    if (!reviewSession || reviewLoading) return;

    if (
      !Number.isInteger(reviewRating) ||
      reviewRating < 1 ||
      reviewRating > 5
    ) {
      setError("Please select a rating from 1 to 5 stars.");
      return;
    }

    try {
      setReviewLoading(true);
      setError("");
      setNotice("");

      const response = await api.post(`/reviews/session/${reviewSession._id}`, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setReviewsBySession((current) => ({
        ...current,
        [reviewSession._id]: {
          reviewed: true,
          review: response.data.review,
          canReview: false,
        },
      }));

      setNotice("Your review was submitted successfully.");
      setReviewSession(null);
      setReviewRating(5);
      setReviewComment("");
      setHoverRating(0);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit your review. Please try again.",
      );

      // Refresh review status in case the review was already submitted
      // from another tab or device.
      if (err.response?.status === 409) {
        try {
          const checkResponse = await api.get(
            `/reviews/session/${reviewSession._id}/mine`,
          );

          if (checkResponse.data.review) {
            setReviewsBySession((current) => ({
              ...current,
              [reviewSession._id]: {
                reviewed: true,
                review: checkResponse.data.review,
                canReview: false,
              },
            }));

            setReviewSession(null);
            setNotice("This session has already been reviewed.");
          }
        } catch (checkError) {
          console.error("Unable to refresh review status:", checkError);
        }
      }
    } finally {
      setReviewLoading(false);
    }
  };

  const filteredSessions = sessions.filter((session) => {
    const teacherId = getId(session.teacher);
    const learnerId = getId(session.learner);

    if (activeTab === "INCOMING") return teacherId === currentUserId;
    if (activeTab === "SENT") return learnerId === currentUserId;

    return teacherId === currentUserId || learnerId === currentUserId;
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
          <Link to="/login" className="sessions-discover-btn">
            Go to login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="my-sessions-page">
      
<header className="sessions-header">
  <div>
    <p className="sessions-eyebrow">YOUR LEARNING JOURNEY</p>
    <h1>My Sessions</h1>
    <p className="sessions-subtitle">
      Manage your learning requests and teaching sessions.
    </p>
  </div>

  <div className="sessions-header-actions">
    <Link to="/dashboard" className="sessions-discover-btn">
      Back to Dashboard
    </Link>

    <Link to="/discover" className="sessions-discover-btn">
      Discover skills
    </Link>
  </div>
</header>


      <nav className="sessions-tabs" aria-label="Filter sessions">
        {[
          { label: "All sessions", value: "ALL" },
          { label: "Incoming", value: "INCOMING" },
          { label: "Sent by me", value: "SENT" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={activeTab === tab.value ? "active" : ""}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {error && (
        <div className="sessions-error" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="sessions-notice" role="status">
          {notice}
        </div>
      )}

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
          <Link to="/discover" className="sessions-discover-btn">
            Find someone to learn from
          </Link>
        </section>
      ) : (
        <section className="sessions-list">
          {filteredSessions.map((session) => {
            const teacherId = getId(session.teacher);
            const learnerId = getId(session.learner);
            const isTeacher = teacherId === currentUserId;
            const isLearner = learnerId === currentUserId;
            const otherPerson = isTeacher ? session.learner : session.teacher;
            const personName = otherPerson?.name || "SkillShare member";
            const skillName = session.skill?.name || "Learning session";

            const learnerConfirmed = Boolean(session.learnerConfirmedAt);
            const teacherConfirmed = Boolean(session.teacherConfirmedAt);
            const alreadyConfirmed = isTeacher
              ? teacherConfirmed
              : learnerConfirmed;

            const canCancel = ["PENDING", "ACCEPTED"].includes(session.status);
            const reviewInfo = reviewsBySession[session._id];

            let validMeetingLink = "";

            try {
              if (session.meetingLink) {
                const url = new URL(session.meetingLink);

                if (["http:", "https:"].includes(url.protocol)) {
                  validMeetingLink = url.href;
                }
              }
            } catch {
              validMeetingLink = "";
            }

            return (
              <article className="session-card" key={session._id}>
                <div className="session-card-top">
                  <div className="session-skill-icon">✦</div>

                  <div className="session-main-info">
                    <h2>{skillName}</h2>
                    <p>
                      {isTeacher ? "Learner" : "Teaching by"} {personName}
                    </p>
                  </div>

                  <span
                    className={`session-status ${getStatusClass(session.status)}`}
                  >
                    {session.status}
                  </span>
                </div>

                {session.message && (
                  <p className="session-message">“{session.message}”</p>
                )}

                <div className="session-details">
                  <span>
                    <strong>{session.duration}</strong>{" "}
                    {session.duration === 1 ? "hour" : "hours"}
                  </span>
                  <span>
                    <strong>{session.credits ?? session.duration}</strong>{" "}
                    credits
                  </span>
                  <span>{isTeacher ? "Incoming request" : "Your request"}</span>
                </div>

                {session.scheduledAt && (
                  <div className="session-scheduled-time">
                    <strong>Scheduled meeting</strong>
                    <p>
                      {new Date(session.scheduledAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <small>Shown in your local timezone</small>
                  </div>
                )}

                {session.status === "ACCEPTED" && (
                  <div className="session-meeting">
                    <strong>Online meeting</strong>

                    {validMeetingLink ? (
                      <a
                        className="session-join-btn"
                        href={validMeetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Join Meeting ↗
                      </a>
                    ) : (
                      <p className="session-no-meeting">
                        No valid meeting link is available yet.
                      </p>
                    )}
                  </div>
                )}

                {isTeacher && session.status === "PENDING" && (
                  <div className="session-actions">
                    <button
                      type="button"
                      className="session-reject-btn"
                      disabled={Boolean(actionLoading)}
                      onClick={() => handleRequestAction(session._id, "reject")}
                    >
                      {actionLoading === `${session._id}-reject`
                        ? "Rejecting..."
                        : "Reject"}
                    </button>

                    <button
                      type="button"
                      className="session-accept-btn"
                      disabled={Boolean(actionLoading)}
                      onClick={() => openScheduleModal(session)}
                    >
                      Accept & Schedule Meeting
                    </button>
                  </div>
                )}

                {isTeacher && session.status === "ACCEPTED" && (
                  <div className="session-actions">
                    <button
                      type="button"
                      className="session-accept-btn"
                      disabled={Boolean(actionLoading)}
                      onClick={() => openScheduleModal(session)}
                    >
                      Reschedule Meeting
                    </button>
                  </div>
                )}

                {session.status === "ACCEPTED" && (
                  <div className="session-actions">
                    <div className="session-confirmation-status">
                      <p>
                        Learner: {learnerConfirmed ? "Confirmed" : "Waiting"}
                      </p>
                      <p>
                        Teacher: {teacherConfirmed ? "Confirmed" : "Waiting"}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="session-accept-btn"
                      disabled={Boolean(actionLoading) || alreadyConfirmed}
                      onClick={() =>
                        handleRequestAction(session._id, "complete")
                      }
                    >
                      {actionLoading === `${session._id}-complete`
                        ? "Confirming..."
                        : alreadyConfirmed
                          ? "Completion confirmed"
                          : "Confirm completion"}
                    </button>
                  </div>
                )}

                {/* Learners can review their teacher after completion. */}
                {isLearner && session.status === "COMPLETED" && (
                  <div className="session-review-area">
                    {reviewInfo?.reviewed ? (
                      <div className="session-review-submitted">
                        <div
                          className="session-review-stars"
                          aria-label={`${reviewInfo.review.rating} out of 5 stars`}
                        >
                          {"★".repeat(reviewInfo.review.rating)}
                          {"☆".repeat(5 - reviewInfo.review.rating)}
                        </div>
                        <strong>Review submitted</strong>
                        {reviewInfo.review.comment && (
                          <p>{reviewInfo.review.comment}</p>
                        )}
                      </div>
                    ) : reviewInfo?.checkFailed ? (
                      <p className="session-review-help">
                        Could not check your review status. Refresh the page to
                        try again.
                      </p>
                    ) : (
                      <>
                        <p className="session-review-help">
                          How was your learning experience with {personName}?
                        </p>
                        <button
                          type="button"
                          className="session-accept-btn session-review-button"
                          onClick={() => openReviewModal(session)}
                        >
                          <Star size={16} />
                          Leave a review
                        </button>
                      </>
                    )}
                  </div>
                )}

                {canCancel && (
                  <div className="session-actions">
                    <button
                      type="button"
                      className="session-reject-btn"
                      disabled={Boolean(actionLoading)}
                      onClick={() => handleCancel(session)}
                    >
                      {actionLoading === `${session._id}-cancel`
                        ? "Cancelling..."
                        : "Cancel session"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      {!loading && (
        <button
          type="button"
          className="sessions-refresh-btn"
          onClick={fetchSessions}
        >
          Refresh sessions
        </button>
      )}

      {/* Scheduling and rescheduling modal */}
      {editingSession && (
        <div
          className="meeting-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeScheduleModal();
          }}
        >
          <section
            className="meeting-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="meeting-modal-title"
          >
            <button
              type="button"
              className="meeting-modal-close"
              aria-label="Close"
              onClick={closeScheduleModal}
              disabled={Boolean(actionLoading)}
            >
              ×
            </button>

            <p className="sessions-eyebrow">ONLINE SESSION</p>
            <h2 id="meeting-modal-title">
              {isRescheduling
                ? "Reschedule meeting"
                : "Accept & schedule session"}
            </h2>

            <p>
              {isRescheduling
                ? "Choose a new meeting date, time, or link. The learner will see the updated schedule."
                : "Add the meeting URL and choose when the learner should join."}
            </p>

            <form onSubmit={handleSaveSchedule}>
              <label htmlFor="meeting-link-input">Meeting URL</label>
              <input
                id="meeting-link-input"
                type="url"
                placeholder="https://meet.google.com/..."
                value={meetingLink}
                onChange={(event) => setMeetingLink(event.target.value)}
                required
                maxLength={2048}
              />
              <small>
                Use a Google Meet, Zoom, or Microsoft Teams meeting link.
              </small>
              <label htmlFor="meeting-date">Meeting date</label>
              <input
                id="meeting-date"
                type="date"
                min={getLocalDateTime().date}
                value={meetingDate}
                onChange={(event) => setMeetingDate(event.target.value)}
                required
              />

              <label htmlFor="meeting-time">Meeting start time</label>
              <input
                id="meeting-time"
                type="time"
                value={meetingTime}
                onChange={(event) => setMeetingTime(event.target.value)}
                required
              />

              <div className="meeting-modal-actions">
                <button
                  type="button"
                  className="session-reject-btn"
                  onClick={closeScheduleModal}
                  disabled={Boolean(actionLoading)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="session-accept-btn"
                  disabled={Boolean(actionLoading)}
                >
                  {actionLoading === `${editingSession._id}-reschedule`
                    ? "Rescheduling..."
                    : actionLoading === `${editingSession._id}-accept`
                      ? "Saving..."
                      : isRescheduling
                        ? "Save New Schedule"
                        : "Accept & Save Schedule"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Review modal */}
      {reviewSession && (
        <div
          className="meeting-modal-overlay review-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeReviewModal();
          }}
        >
          <section
            className="meeting-modal review-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
          >
            <button
              type="button"
              className="meeting-modal-close"
              aria-label="Close review form"
              onClick={closeReviewModal}
              disabled={reviewLoading}
            >
              <X size={22} />
            </button>

            <div className="review-modal-icon">
              <Star size={25} />
            </div>

            <p className="sessions-eyebrow">SHARE YOUR EXPERIENCE</p>
            <h2 id="review-modal-title">Rate your teacher</h2>
            <p>Your feedback helps other learners choose the right teacher.</p>

            <form onSubmit={handleSubmitReview}>
              <label>How would you rate this session?</label>

              <div
                className="review-star-picker"
                role="group"
                aria-label="Select a rating"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={
                      star <= (hoverRating || reviewRating)
                        ? "review-star selected"
                        : "review-star"
                    }
                    aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
                    aria-pressed={reviewRating === star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onFocus={() => setHoverRating(star)}
                    onBlur={() => setHoverRating(0)}
                    onClick={() => setReviewRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>

              <p className="review-rating-label">
                {
                  {
                    1: "Poor",
                    2: "Fair",
                    3: "Good",
                    4: "Very good",
                    5: "Excellent",
                  }[hoverRating || reviewRating]
                }
              </p>

              <label htmlFor="review-comment">Your feedback (optional)</label>
              <textarea
                id="review-comment"
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="What did you learn? What did you like about the session?"
                rows={4}
                maxLength={1000}
              />

              <small className="review-character-count">
                {reviewComment.length}/1000 characters
              </small>

              <div className="meeting-modal-actions">
                <button
                  type="button"
                  className="session-reject-btn"
                  onClick={closeReviewModal}
                  disabled={reviewLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="session-accept-btn"
                  disabled={reviewLoading}
                >
                  {reviewLoading ? "Submitting..." : "Submit review"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default MySessions;
