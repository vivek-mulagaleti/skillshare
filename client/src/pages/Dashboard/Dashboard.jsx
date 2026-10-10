
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
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

import "./Dashboard.css";

function Dashboard() {
  const { user, loading, logout } = useAuth();

  const [mySkills, setMySkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(true);

  // Load the user's skills from MongoDB.
  useEffect(() => {
    const loadMySkills = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await api.get("/user-skills/my-skills", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const skillsToTeach = response.data.skillsToTeach || [];
        const skillsToLearn = response.data.skillsToLearn || [];

        setMySkills([...skillsToTeach, ...skillsToLearn]);
      } catch (error) {
        console.error(
          "Failed to load dashboard skills:",
          error.response?.data || error.message
        );

        setMySkills([]);
      } finally {
        setSkillsLoading(false);
      }
    };

    if (user) {
      loadMySkills();
    }
  }, [user]);

  // Logout.
  const handleLogout = () => {
    logout();
  };

  // Wait for authentication to finish.
  if (loading) {
    return (
      <main className="dashboard-loading">
        <div className="dashboard-loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </main>
    );
  }

  // Protect dashboard.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

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

        <nav className="dashboard-nav">
          <Link
            to="/dashboard"
            className="dashboard-nav-link active"
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/discover"
            className="dashboard-nav-link"
          >
            <Compass size={19} />
            <span>Discover</span>
          </Link>

          <Link
            to="/my-skills"
            className="dashboard-nav-link"
          >
            <BookOpen size={19} />
            <span>My Skills</span>
          </Link>

          {/* FIXED: Sessions now opens the My Sessions page */}
          <Link
            to="/my-sessions"
            className="dashboard-nav-link"
          >
            <CalendarDays size={19} />
            <span>Sessions</span>
          </Link>
        </nav>

        <div className="dashboard-sidebar-bottom">
          <Link
            to="/dashboard"
            className="dashboard-nav-link"
          >
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

          <div className="dashboard-avatar">
            {user.name?.charAt(0).toUpperCase()}
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
              Discover people who can teach you something new,
              or share your own knowledge with the community.
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
          {/* CREDITS */}
          <motion.div
            className="dashboard-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="stat-icon credits">
              <Clock size={20} />
            </div>

            <div>
              <p>Time credits</p>
              <strong>{user.timeCredits ?? 0}</strong>
            </div>
          </motion.div>

          {/* SKILLS */}
          <motion.div
            className="dashboard-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="stat-icon skills">
              <BookOpen size={20} />
            </div>

            <div>
              <p>Skills</p>
              <strong>
                {skillsLoading ? "..." : mySkills.length}
              </strong>
            </div>
          </motion.div>

          {/* SESSIONS */}
          <motion.div
            className="dashboard-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="stat-icon sessions">
              <CalendarDays size={20} />
            </div>

            <div>
              <p>Upcoming sessions</p>
              <strong>0</strong>
            </div>
          </motion.div>
        </div>

        {/* GETTING STARTED */}
        <motion.section
          className="getting-started"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
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
            {/* TEACH */}
            <div className="setup-card">
              <div className="setup-number">01</div>

              <div>
                <h3>Add skills you can teach</h3>

                <p>
                  Share your knowledge and start earning time
                  credits.
                </p>

                <Link to="/my-skills" className="setup-button">
                  <Plus size={14} />
                  Add teaching skills
                </Link>
              </div>
            </div>

            {/* LEARN */}
            <div className="setup-card">
              <div className="setup-number">02</div>

              <div>
                <h3>Add skills you want to learn</h3>

                <p>
                  Tell SkillShare what you would like to learn
                  from others.
                </p>

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
