import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Compass,
  Sparkles,
  UserRound,
  Clock,
  Search,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

import "./Discover.css";

function Discover() {
  const { user, loading } = useAuth();

  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMatches = async () => {
    try {
      setMatchesLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await api.get("/matches/learn", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMatches(response.data.matches || []);
    } catch (error) {
      console.error(
        "Failed to load matches:",
        error.response?.data || error.message,
      );

      setError(
        error.response?.data?.message ||
          "Something went wrong while finding your matches.",
      );

      setMatches([]);
    } finally {
      setMatchesLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMatches();
    }
  }, [user]);

  if (loading) {
    return (
      <main className="discover-loading">
        <div className="discover-loading-spinner"></div>
        <p>Loading Discover...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="discover-page">
      {/* Sidebar */}
      <aside className="discover-sidebar">
        <Link to="/" className="discover-logo">
          <div className="discover-logo-icon">
            <Sparkles size={18} />
          </div>

          <span>
            Skill<span>Share</span>
          </span>
        </Link>

        <nav className="discover-nav">
          <Link to="/dashboard" className="discover-nav-link">
            <Compass size={19} />
            <span>Dashboard</span>
          </Link>

          <Link to="/discover" className="discover-nav-link active">
            <Search size={19} />
            <span>Discover</span>
          </Link>

          <Link to="/my-skills" className="discover-nav-link">
            <BookOpen size={19} />
            <span>My Skills</span>
          </Link>

          <Link to="/dashboard" className="discover-nav-link">
            <Clock size={19} />
            <span>Sessions</span>
          </Link>
        </nav>

        <div className="discover-sidebar-bottom">
          <Link to="/dashboard" className="discover-nav-link">
            <ArrowLeft size={19} />
            <span>Back to dashboard</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <section className="discover-content">
        <header className="discover-header">
          <div>
            <p className="discover-label">DISCOVER</p>

            <h1>
              Find someone who can
              <span> teach you.</span>
            </h1>

            <p className="discover-subtitle">
              We found people who teach the skills you want to learn.
            </p>
          </div>

          <div className="discover-user-avatar">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        </header>

        {/* Search / intro card */}
        <motion.section
          className="discover-intro"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="discover-intro-icon">
            <Sparkles size={24} />
          </div>

          <div>
            <p className="discover-intro-label">YOUR MATCHES</p>

            <h2>Learn from people in the SkillShare community.</h2>

            <p>
              Your matches are based on the skills you've added to your learning
              profile.
            </p>
          </div>
        </motion.section>

        {/* Section heading */}
        <div className="discover-section-heading">
          <div>
            <p className="discover-label">PEOPLE FOR YOU</p>
            <h2>
              {matchesLoading
                ? "Finding your matches..."
                : `${matches.length} ${
                    matches.length === 1 ? "person" : "people"
                  } found`}
            </h2>
          </div>
        </div>

        {/* Loading */}
        {matchesLoading && (
          <div className="discover-state">
            <div className="discover-loading-spinner"></div>
            <h3>Finding your matches</h3>
            <p>
              We're looking for people who can teach what you want to learn.
            </p>
          </div>
        )}

        {/* Error */}
        {!matchesLoading && error && (
          <div className="discover-state discover-error-state">
            <div className="discover-state-icon">
              <AlertCircle size={28} />
            </div>

            <h3>We couldn't load your matches</h3>

            <p>{error}</p>

            <button className="discover-retry-button" onClick={loadMatches}>
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!matchesLoading && !error && matches.length === 0 && (
          <div className="discover-state">
            <div className="discover-state-icon">
              <BookOpen size={28} />
            </div>

            <h3>No matches yet</h3>

            <p>
              Add some skills you want to learn and we'll find people who can
              teach them.
            </p>

            <Link to="/my-skills" className="discover-state-button">
              Add learning skills
            </Link>
          </div>
        )}

        {/* Match cards */}
        {!matchesLoading && !error && matches.length > 0 && (
          <div className="matches-grid">
            {matches.map((match, index) => (
              <motion.article
                key={
                  match._id || `${match.user?._id}-${match.skill?._id}` || index
                }
                className="match-card"
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                }}
              >
                {/* Card top */}
                <div className="match-card-top">
                  <div className="match-avatar">
                    {match.user?.name?.charAt(0).toUpperCase() || (
                      <UserRound size={24} />
                    )}
                  </div>

                  <div className="match-person">
                    <h3>{match.user?.name || "SkillShare member"}</h3>

                    <p>
                      <UserRound size={14} />
                      SkillShare member
                    </p>
                  </div>
                </div>

                {/* Matched skill */}
                <div className="match-skill-section">
                  <p className="match-section-label">CAN TEACH YOU</p>

                  <div className="match-skill">
                    <div className="match-skill-icon">
                      <BookOpen size={18} />
                    </div>

                    <div>
                      <h4>{match.skill?.name || "Skill"}</h4>

                      <span>{match.level || "LEVEL NOT SPECIFIED"}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {match.description && (
                  <p className="match-description">{match.description}</p>
                )}

                {/* Action */}
                <Link
                  to={`/profile/${match.user?._id}?skill=${match.skill?._id}`}
                  className="match-button"
                >
                  View profile
                </Link>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Discover;
