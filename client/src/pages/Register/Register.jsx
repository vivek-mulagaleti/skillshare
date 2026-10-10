import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../../services/api";

import "./Register.css";

function Register() {
  // Form values
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Page state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Used to move the user to another page
  const navigate = useNavigate();


  // =========================
  // HANDLE FORM SUBMISSION
  // =========================

  const handleRegister = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Send registration data to backend
      await api.post("/auth/register", {
        name,
        email,
        password,
      });

      // Registration successful
      navigate("/login");

    } catch (error) {

      // Show backend error
      const message =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";

      setError(message);

    } finally {

      setLoading(false);

    }
  };


  return (
    <main className="register-page">

      {/* =========================
          LEFT SIDE
      ========================= */}

      <div className="register-info">

        <Link
          to="/"
          className="register-logo"
        >
          Skill<span>Share</span>
        </Link>

        <div className="register-message">

          <p>
            LEARN • TEACH • SHARE
          </p>

          <h1>
            Turn your knowledge
            <span> into opportunity.</span>
          </h1>

          <p>
            Join a community where your skills
            can help someone learn — and their
            skills can help you grow.
          </p>

        </div>

      </div>


      {/* =========================
          RIGHT SIDE
      ========================= */}

      <div className="register-form-container">

        <div className="register-form-box">

          <div className="register-heading">

            <h2>
              Create your account
            </h2>

            <p>
              Start learning and sharing skills.
            </p>

          </div>


          {/* Error message */}

          {error && (
            <div className="register-error">
              {error}
            </div>
          )}


          {/* Form */}

          <form onSubmit={handleRegister}>

            {/* Name */}

            <div className="form-group">

              <label htmlFor="name">
                Name
              </label>

              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
              />

            </div>


            {/* Email */}

            <div className="form-group">

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


            {/* Password */}

            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                minLength={6}
                required
              />

            </div>


            {/* Submit button */}

            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >

              {loading
                ? "Creating account..."
                : "Create account"}

            </button>

          </form>


          {/* Login link */}

          <p className="login-link">

            Already have an account?

            <Link to="/login">
              Log in
            </Link>

          </p>

        </div>

      </div>

    </main>
  );
}

export default Register;