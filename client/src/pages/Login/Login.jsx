
import { useEffect, useState } from "react";
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleError = params.get("googleError");

    if (googleError) {
      setError(googleError);

      // Remove the error query parameter from the visible URL.
      window.history.replaceState(
        null,
        "",
        window.location.pathname
      );
    }
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);

      await refreshUser();

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError("");
    window.location.assign(
      `${api.defaults.baseURL}/auth/google`
    );
  };

  return (
    <main className="login-page">
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
            Continue your learning journey, share your
            knowledge, and connect with people who want
            to grow with you.
          </p>
        </div>
      </div>

      <div className="login-form-container">
        <div className="login-form-box">
          <div className="login-heading">
            <h2>Welcome back</h2>
            <p>Log in to continue to SkillShare.</p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="button"
            className="google-login-button"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 48 48"
              width="22"
              height="22"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.02 13.22l7.98 6.19C12.9 13.72 18.03 9.5 24 9.5Z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.98 46.98 31.86 46.98 24.55Z"
              />
              <path
                fill="#FBBC05"
                d="M10.99 28.59A14.4 14.4 0 0 1 10.22 24c0-1.59.27-3.13.76-4.59L3 13.22A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l8.43-6.19Z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-5.97 0-11.1-4.22-12.99-9.91L3.02 34.78C6.51 42.62 14.62 48 24 48Z"
              />
            </svg>

            <span>Continue with Google</span>
          </button>

          <div className="login-divider">
            <span>or continue with email</span>
          </div>

          <form onSubmit={handleLogin}>
            <div className="login-form-group">
              <label htmlFor="email">Email</label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="login-form-group">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                type="password"
                placeholder="Your password"
                autoComplete="current-password"
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
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="register-link">
            Don't have an account?{" "}
            <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default Login;
