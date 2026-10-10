import { useEffect, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Languages,
  Sparkles,
  UserRound,
  MessageCircle,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

import "./Profile.css";

function Profile() {
  const { user, loading } = useAuth();

  const { userId } = useParams();

  const [searchParams] = useSearchParams();

  const skillId = searchParams.get("skill");

  const [profile, setProfile] = useState(null);

  const [profileLoading, setProfileLoading] = useState(true);

  const [error, setError] = useState("");

  const [showRequestModal, setShowRequestModal] = useState(false);

  const [duration, setDuration] = useState(1);

  const [message, setMessage] = useState("");

  const [requestLoading, setRequestLoading] = useState(false);

  const [requestError, setRequestError] = useState("");

  const [requestSuccess, setRequestSuccess] = useState("");

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await api.get(`/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProfile(response.data.user);
    } catch (error) {
      console.error(
        "Failed to load profile:",
        error.response?.data || error.message,
      );

      setError(error.response?.data?.message || "Unable to load this profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSessionRequest = async (event) => {
  event.preventDefault();

  try {
    setRequestLoading(true);
    setRequestError("");
    setRequestSuccess("");

    const token = localStorage.getItem("token");

    const response = await api.post(
      "/sessions/request",
      {
        teacherId: userId,
        skillId,
        duration: Number(duration),
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setRequestSuccess(
      response.data.message ||
        "Session request sent successfully."
    );

    setMessage("");
    setDuration(1);

    setTimeout(() => {
      setShowRequestModal(false);
      setRequestSuccess("");
    }, 1500);
  } catch (error) {
    console.error(
      "Session request failed:",
      error.response?.data || error.message
    );

    setRequestError(
      error.response?.data?.message ||
        "Unable to send your session request."
    );
  } finally {
    setRequestLoading(false);
  }
};

  useEffect(() => {
    if (user && userId) {
      loadProfile();
    }
  }, [user, userId]);

  if (loading) {
    return (
      <main className="profile-loading">
        <div className="profile-spinner"></div>
        <p>Loading profile...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profileLoading) {
    return (
      <main className="profile-loading">
        <div className="profile-spinner"></div>
        <p>Loading profile...</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="profile-page">
        <div className="profile-error">
          <div className="profile-error-icon">
            <AlertCircle size={28} />
          </div>

          <h2>Profile unavailable</h2>

          <p>{error || "We couldn't find this user."}</p>

          <Link to="/discover" className="profile-back-button">
            <ArrowLeft size={17} />
            Back to Discover
          </Link>
        </div>
      </main>
    );
  }

  const initials = profile.name?.charAt(0).toUpperCase() || "?";

  return (
    <main className="profile-page">
      {/* Header */}
      <header className="profile-header">
        <Link to="/discover" className="profile-back-link">
          <ArrowLeft size={18} />
          Back to Discover
        </Link>

        <Link to="/" className="profile-logo">
          <div className="profile-logo-icon">
            <Sparkles size={17} />
          </div>

          <span>
            Skill<span>Share</span>
          </span>
        </Link>
      </header>

      {/* Main */}
      <section className="profile-content">
        <motion.div
          className="profile-card"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile hero */}
          <div className="profile-hero">
            <div className="profile-avatar">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} />
              ) : (
                initials
              )}
            </div>

            <div className="profile-hero-info">
              <p className="profile-eyebrow">SKILLSHARE MEMBER</p>

              <h1>{profile.name}</h1>

              <p className="profile-bio">
                {profile.bio || "This member hasn't added a bio yet."}
              </p>
            </div>

            <button
  className="profile-message-button"
  onClick={() => {
    setRequestError("");
    setRequestSuccess("");
    setShowRequestModal(true);
  }}
>
  <MessageCircle size={17} />
  Request session
</button>
          </div>

          {/* Stats */}
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-icon">
                <Clock size={18} />
              </div>

              <div>
                <strong>{profile.timeCredits ?? 0}</strong>

                <span>Time credits</span>
              </div>
            </div>

            <div className="profile-stat">
              <div className="profile-stat-icon">
                <Languages size={18} />
              </div>

              <div>
                <strong>{profile.languages?.length || 0}</strong>

                <span>Languages</span>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="profile-section">
            <div className="profile-section-heading">
              <BookOpen size={19} />

              <h2>About this member</h2>
            </div>

            <p className="profile-about">
              {profile.bio || "No additional information has been provided."}
            </p>
          </div>

          {/* Languages */}
          {profile.languages?.length > 0 && (
            <div className="profile-section">
              <div className="profile-section-heading">
                <Languages size={19} />

                <h2>Languages</h2>
              </div>

              <div className="profile-tags">
                {profile.languages.map((language) => (
                  <span key={language}>{language}</span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </section>
      {showRequestModal && (
  <div
    className="session-modal-overlay"
    onClick={() => {
      if (!requestLoading) {
        setShowRequestModal(false);
      }
    }}
  >
    <motion.div
      className="session-modal"
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="session-modal-header">
        <div>
          <p className="session-modal-eyebrow">
            REQUEST A SESSION
          </p>

          <h2>Learn from {profile.name}</h2>

          <p>
            Send a request and start your learning journey.
          </p>
        </div>

        <button
          type="button"
          className="session-modal-close"
          onClick={() => setShowRequestModal(false)}
          disabled={requestLoading}
        >
          ×
        </button>
      </div>

      <form
        className="session-form"
        onSubmit={handleSessionRequest}
      >
        <div className="session-form-group">
          <label>Skill</label>

          <div className="session-selected-skill">
            <BookOpen size={17} />

            <span>
              Learning session
            </span>
          </div>
        </div>

        <div className="session-form-group">
          <label htmlFor="duration">
            Session duration
          </label>

          <select
            id="duration"
            value={duration}
            onChange={(event) =>
              setDuration(Number(event.target.value))
            }
            disabled={requestLoading}
          >
            <option value={1}>
              1 hour — 1 time credit
            </option>

            <option value={2}>
              2 hours — 2 time credits
            </option>

            <option value={3}>
              3 hours — 3 time credits
            </option>

            <option value={4}>
              4 hours — 4 time credits
            </option>
          </select>
        </div>

        <div className="session-form-group">
          <label htmlFor="message">
            Message
          </label>

          <textarea
            id="message"
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            placeholder={`Tell ${profile.name} what you'd like to learn...`}
            maxLength={500}
            disabled={requestLoading}
            rows={4}
          />

          <span className="session-character-count">
            {message.length}/500
          </span>
        </div>

        {requestError && (
          <div className="session-form-error">
            <AlertCircle size={16} />
            <span>{requestError}</span>
          </div>
        )}

        {requestSuccess && (
          <div className="session-form-success">
            ✓ {requestSuccess}
          </div>
        )}

        <div className="session-form-footer">
          <p>
            You won't lose credits until the session is
            completed.
          </p>

          <button
            type="submit"
            className="session-submit-button"
            disabled={requestLoading}
          >
            {requestLoading
              ? "Sending..."
              : "Send request"}
          </button>
        </div>
      </form>
    </motion.div>
  </div>
)}
    </main>
  );
}

export default Profile;
