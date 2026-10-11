import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
  LayoutDashboard,
  Compass,
  BookOpen,
  CalendarDays,
  Settings,
  LogOut,
  Sparkles,
  Clock,
  Plus,
  Bell,
  Star,
  Users,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import NotificationBell from "../../components/NotificationBell";

import "./Dashboard.css";

function Dashboard() {
  const { user, loading, logout } = useAuth();

  const [mySkills, setMySkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(true);

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadMySkills = async () => {
      try {
        const response = await api.get("/user-skills/my-skills");

        if (!active) return;

        const skillsToTeach = response.data.skillsToTeach || [];
        const skillsToLearn = response.data.skillsToLearn || [];

        setMySkills([...skillsToTeach, ...skillsToLearn]);
      } catch (error) {
        console.error(
          "Failed to load dashboard skills:",
          error.response?.data || error.message,
        );

        if (active) setMySkills([]);
      } finally {
        if (active) setSkillsLoading(false);
      }
    };

    if (user) {
      loadMySkills();
    } else {
      setSkillsLoading(false);
    }

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    let active = true;

    const loadSessions = async () => {
      try {
        const response = await api.get("/sessions");
        const sessionList = response.data.sessions || [];

        if (active) {
          setSessions(sessionList);
        }
      } catch (error) {
        console.error(
          "Failed to load dashboard sessions:",
          error.response?.data || error.message,
        );

        if (active) setSessions([]);
      } finally {
        if (active) setSessionsLoading(false);
      }
    };

    if (user) {
      loadSessions();
    } else {
      setSessionsLoading(false);
    }

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    let active = true;

    const loadTeacherRating = async () => {
      const userId = user?._id || user?.id || user?.userId;

      if (!userId) {
        setRatingLoading(false);
        return;
      }

      try {
        const response = await api.get(`/reviews/teacher/${userId}`);

        if (!active) return;

        setAverageRating(Number(response.data.averageRating) || 0);

        setReviewCount(Number(response.data.count) || 0);
      } catch (error) {
        console.error(
          "Failed to load teacher rating:",
          error.response?.data || error.message,
        );

        if (active) {
          setAverageRating(0);
          setReviewCount(0);
        }
      } finally {
        if (active) setRatingLoading(false);
      }
    };

    if (user) {
      loadTeacherRating();
    } else {
      setRatingLoading(false);
    }

    return () => {
      active = false;
    };
  }, [user]);

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <main className="dashboard-loading">
        <div className="dashboard-loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const now = Date.now();

  const upcomingSessions = sessions
    .filter((session) => {
      const scheduledTime = session.scheduledAt
        ? new Date(session.scheduledAt).getTime()
        : 0;

      return session.status === "ACCEPTED" && scheduledTime > now;
    })
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const completedSessions = sessions.filter(
    (session) => session.status === "COMPLETED",
  ).length;

  const formatSessionDate = (date) => {
    if (!date) return "Date not set";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString([], {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getOtherParticipant = (session) => {
    const currentUserId = String(user._id || user.id || user.userId);

    const teacherId = String(session.teacher?._id || session.teacher?.id || "");

    return teacherId === currentUserId ? session.learner : session.teacher;
  };

  const getParticipantId = (participant) => participant?._id || participant?.id;

  return (
    <main className="dashboard-page">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-logo">
          <div className="dashboard-logo-icon">
            <Sparkles size={18} />
          </div>

          <span>
            Skill<span>Share</span>
          </span>
        </Link>

        <nav className="dashboard-nav" aria-label="Main navigation">
          <Link to="/dashboard" className="dashboard-nav-link active">
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </Link>

          <Link to="/discover" className="dashboard-nav-link">
            <Compass size={19} />
            <span>Discover</span>
          </Link>

          <Link to="/my-skills" className="dashboard-nav-link">
            <BookOpen size={19} />
            <span>My Skills</span>
          </Link>

          <Link to="/my-sessions" className="dashboard-nav-link">
            <CalendarDays size={19} />
            <span>Sessions</span>
          </Link>

          <Link to="/notifications" className="dashboard-nav-link">
            <Bell size={19} />
            <span>Notifications</span>
          </Link>
        </nav>

        <div className="dashboard-sidebar-bottom">
          <Link to="/dashboard" className="dashboard-nav-link">
            <Settings size={19} />
            <span>Settings</span>
          </Link>

          <button
            type="button"
            className="dashboard-logout"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <section className="dashboard-content">
        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <p className="dashboard-label">YOUR DASHBOARD</p>

            <h1>
              Welcome back, <span>{user.name}</span> 👋
            </h1>
          </div>

          <div className="dashboard-header-actions">
            <NotificationBell />

            <Link
              to={`/profile/${user._id || user.id || user.userId}`}
              className="dashboard-avatar"
              title="View your profile"
              aria-label="View your profile"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || "Profile"}
                  className="dashboard-avatar-image"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                user.name?.charAt(0).toUpperCase() || "U"
              )}
            </Link>
          </div>
        </header>

        {/* WELCOME CARD */}
        <motion.section
          className="dashboard-welcome"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="welcome-content">
            <p className="welcome-label">READY TO LEARN?</p>

            <h2>
              Your next skill
              <span> is waiting.</span>
            </h2>

            <p>
              Discover people who can teach you something new, or share your own
              knowledge with the community.
            </p>

            <Link to="/discover" className="welcome-button">
              <Compass size={18} />
              Explore skills
            </Link>
          </div>

          <div className="welcome-decoration">
            <Sparkles size={90} />
          </div>
        </motion.section>

        {/* STATS */}
        <div className="dashboard-stats">
          <motion.div
            className="dashboard-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="stat-icon credits">
              <Clock size={20} />
            </div>

            <div>
              <p>Time credits</p>
              <strong>{user.timeCredits ?? 0}</strong>
            </div>
          </motion.div>

          <motion.div
            className="dashboard-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className="stat-icon skills">
              <BookOpen size={20} />
            </div>

            <div>
              <p>Skills</p>
              <strong>{skillsLoading ? "..." : mySkills.length}</strong>
            </div>
          </motion.div>

          <motion.div
            className="dashboard-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="stat-icon sessions">
              <CalendarDays size={20} />
            </div>

            <div>
              <p>Upcoming sessions</p>
              <strong>
                {sessionsLoading ? "..." : upcomingSessions.length}
              </strong>
            </div>
          </motion.div>

          <motion.div
            className="dashboard-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <div className="stat-icon completed">
              <Users size={20} />
            </div>

            <div>
              <p>Completed sessions</p>
              <strong>{sessionsLoading ? "..." : completedSessions}</strong>
            </div>
          </motion.div>

          <motion.div
            className="dashboard-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="stat-icon rating">
              <Star size={20} />
            </div>

            <div>
              <p>Teacher rating</p>

              <strong>
                {ratingLoading
                  ? "..."
                  : reviewCount > 0
                    ? `${averageRating.toFixed(1)} / 5`
                    : "—"}
              </strong>

              {!ratingLoading && (
                <small className="dashboard-stat-note">
                  {reviewCount > 0
                    ? `${reviewCount} ${
                        reviewCount === 1 ? "review" : "reviews"
                      }`
                    : "No reviews yet"}
                </small>
              )}
            </div>
          </motion.div>
        </div>

        {/* UPCOMING SESSIONS */}
        <motion.section
          className="dashboard-upcoming"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
        >
          <div className="section-heading">
            <div>
              <p className="dashboard-label">YOUR SCHEDULE</p>
              <h2>Upcoming sessions</h2>
            </div>

            <Link to="/my-sessions" className="dashboard-section-link">
              View all
            </Link>
          </div>

          {sessionsLoading ? (
            <div className="dashboard-session-message">
              Loading your sessions...
            </div>
          ) : upcomingSessions.length === 0 ? (
            <div className="dashboard-session-empty">
              <div className="dashboard-session-empty-icon">
                <CalendarDays size={24} />
              </div>

              <h3>No upcoming sessions</h3>

              <p>
                Your accepted sessions with a future schedule will appear here.
              </p>

              <Link to="/discover" className="dashboard-section-link">
                Discover skills
              </Link>
            </div>
          ) : (
            <div className="dashboard-upcoming-list">
              {upcomingSessions.slice(0, 3).map((session) => {
                const participant = getOtherParticipant(session);
                const participantId = getParticipantId(participant);

                return (
                  <article className="dashboard-session-card" key={session._id}>
                    <div className="dashboard-session-date-icon">
                      <CalendarDays size={20} />
                    </div>

                    <div className="dashboard-session-details">
                      <h3>{session.skill?.name || "Skill session"}</h3>

                      <p>With {participant?.name || "Your session partner"}</p>

                      <span>
                        <Clock size={14} />
                        {formatSessionDate(session.scheduledAt)}
                      </span>
                    </div>

                    {participantId ? (
                      <Link
                        to={`/profile/${participantId}`}
                        className="dashboard-session-link"
                      >
                        Profile
                      </Link>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* GETTING STARTED */}
        <motion.section
          className="getting-started"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3 }}
        >
          <div className="section-heading">
            <div>
              <p className="dashboard-label">GET STARTED</p>
              <h2>Build your SkillShare profile</h2>
            </div>

            <span className="progress-text">
              {mySkills.length >= 2
                ? "2 / 2 complete"
                : `${mySkills.length} / 2 complete`}
            </span>
          </div>

          <div className="getting-started-grid">
            <div className="setup-card">
              <div className="setup-number">01</div>

              <div>
                <h3>Add skills you can teach</h3>
                <p>Share your knowledge and start earning time credits.</p>

                <Link to="/my-skills" className="setup-button">
                  <Plus size={14} />
                  Add teaching skills
                </Link>
              </div>
            </div>

            <div className="setup-card">
              <div className="setup-number">02</div>

              <div>
                <h3>Add skills you want to learn</h3>
                <p>Tell SkillShare what you would like to learn from others.</p>

                <Link to="/my-skills" className="setup-button">
                  <Plus size={14} />
                  Add learning skills
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      </section>
    </main>
  );
}

export default Dashboard;
