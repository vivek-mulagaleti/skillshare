import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const { refreshUser } = useAuth();

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Send login request to backend.
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      // Save JWT.
      localStorage.setItem("token", response.data.token);

      /*
        Immediately load the logged-in user's information.

        This is important because the dashboard needs
        the user's name, credits, etc. immediately after login.
      */
      await refreshUser();

      // Now go to dashboard.
      navigate("/dashboard");

    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";

      setError(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">

      {/* LEFT SIDE */}

      <div className="login-info">

        <Link to="/" className="login-logo">
          Skill<span>Share</span>
        </Link>

        <div className="login-message">

          <p>LEARN • TEACH • SHARE</p>

          <h1>
            Welcome
            <span>back.</span>
          </h1>

          <p>
            Continue your learning journey,
            share your knowledge, and connect
            with people who want to grow with you.
          </p>

        </div>

      </div>


      {/* RIGHT SIDE */}

      <div className="login-form-container">

        <div className="login-form-box">

          <div className="login-heading">

            <h2>Welcome back</h2>

            <p>
              Log in to continue to SkillShare.
            </p>

          </div>


          {error && (
            <div className="login-error">
              {error}
            </div>
          )}


          <form onSubmit={handleLogin}>

            <div className="login-form-group">

              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />

            </div>


            <div className="login-form-group">

              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />

            </div>


            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : "Log in"}
            </button>

          </form>


          <p className="register-link">

            Don't have an account?

            <Link to="/register">
              Create one
            </Link>

          </p>

        </div>

      </div>

    </main>
  );
}

export default Login;