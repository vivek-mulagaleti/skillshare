import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, UserRound, Languages } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

import "./EditProfile.css";

function EditProfile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    bio: "",
    avatar: "",
    languages: "",
  });

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const response = await api.get("/users/me");
        const profile = response.data.user;

        if (!active) return;

        setForm({
          name: profile.name || "",
          bio: profile.bio || "",
          avatar: profile.avatar || "",
          languages: Array.isArray(profile.languages)
            ? profile.languages.join(", ")
            : "",
        });
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load your profile."
          );
        }
      } finally {
        if (active) setPageLoading(false);
      }
    };

    if (user) {
      loadProfile();
    } else {
      setPageLoading(false);
    }

    return () => {
      active = false;
    };
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = form.name.trim();

    if (!name) {
      setError("Name is required.");
      return;
    }

    const languages = [
      ...new Set(
        form.languages
          .split(",")
          .map((language) => language.trim())
          .filter(Boolean)
      ),
    ];

    try {
      setSaving(true);

      const response = await api.put("/users/me", {
        name,
        bio: form.bio.trim(),
        avatar: form.avatar.trim(),
        languages,
      });

      setSuccess(
        response.data.message || "Profile updated successfully."
      );

      // Update the shared auth user if your context exposes a setter.
      // Reloading the profile page will fetch the saved profile.
      const updatedUserId =
        response.data.user?.id ||
        response.data.user?._id ||
        user?._id ||
        user?.id ||
        user?.userId;

      window.setTimeout(() => {
        if (updatedUserId) {
          navigate(`/profile/${updatedUserId}`, {
            replace: true,
          });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }, 800);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || pageLoading) {
    return (
      <main className="edit-profile-loading">
        <div className="edit-profile-spinner" />
        <p>Loading your profile...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="edit-profile-page">
      <header className="edit-profile-header">
        <Link to="/dashboard" className="edit-profile-brand">
          <span className="edit-profile-brand-icon">
            <UserRound size={20} />
          </span>
          Skill<span>Share</span>
        </Link>

        <Link
          to={`/profile/${user._id || user.id || user.userId}`}
          className="edit-profile-back"
        >
          <ArrowLeft size={17} />
          View profile
        </Link>
      </header>

      <section className="edit-profile-container">
        <div className="edit-profile-heading">
          <p className="edit-profile-eyebrow">ACCOUNT SETTINGS</p>
          <h1>Edit your profile</h1>
          <p>
            Help the community learn about you, your interests,
            and the languages you speak.
          </p>
        </div>

        <form
          className="edit-profile-form"
          onSubmit={handleSubmit}
        >
          <div className="edit-profile-form-heading">
            <div className="edit-profile-form-icon">
              <UserRound size={22} />
            </div>
            <div>
              <h2>Personal information</h2>
              <p>Update the information shown on your profile.</p>
            </div>
          </div>

          <div className="edit-profile-field">
            <label htmlFor="edit-name">Full name</label>
            <input
              id="edit-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your name"
              maxLength={80}
              required
            />
          </div>

          <div className="edit-profile-field">
            <label htmlFor="edit-bio">About you</label>
            <textarea
              id="edit-bio"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="Tell others about your experience and interests..."
              maxLength={1000}
              rows={5}
            />
            <span className="edit-profile-counter">
              {form.bio.length}/1000
            </span>
          </div>

          <div className="edit-profile-field">
            <label htmlFor="edit-avatar">Avatar image URL</label>
            <input
              id="edit-avatar"
              name="avatar"
              type="url"
              value={form.avatar}
              onChange={handleChange}
              placeholder="https://example.com/avatar.jpg"
            />
            <span className="edit-profile-hint">
              Enter a publicly accessible image URL.
            </span>
          </div>

          {form.avatar.trim() && (
            <div className="edit-profile-avatar-preview">
              <img
                src={form.avatar.trim()}
                alt="Avatar preview"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
                onLoad={(event) => {
                  event.currentTarget.style.display = "block";
                }}
              />
              <span>Avatar preview</span>
            </div>
          )}

          <div className="edit-profile-field">
            <label htmlFor="edit-languages">
              <Languages size={16} />
              Languages
            </label>
            <input
              id="edit-languages"
              name="languages"
              type="text"
              value={form.languages}
              onChange={handleChange}
              placeholder="English, Hindi, Telugu"
              maxLength={300}
            />
            <span className="edit-profile-hint">
              Separate languages with commas.
            </span>
          </div>

          {error && (
            <div className="edit-profile-message error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div
              className="edit-profile-message success"
              role="status"
            >
              {success}
            </div>
          )}

          <div className="edit-profile-actions">
            <Link
              to={`/profile/${user._id || user.id || user.userId}`}
              className="edit-profile-cancel"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="edit-profile-save"
              disabled={saving}
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default EditProfile;