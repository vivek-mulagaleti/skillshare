
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function GoogleCallback() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const started = useRef(false);

  const [message, setMessage] = useState(
    "Signing you in with Google..."
  );

  useEffect(() => {
    // Prevent duplicate processing during React Strict Mode.
    if (started.current) return;
    started.current = true;

    const finishLogin = async () => {
      const hashParams = new URLSearchParams(
        window.location.hash.slice(1)
      );

      const queryParams = new URLSearchParams(
        window.location.search
      );

      const token =
        hashParams.get("token") || queryParams.get("token");

      console.log(
        "[Google OAuth] Callback token present:",
        Boolean(token)
      );

      // Clean the URL after capturing the token.
      window.history.replaceState(
        null,
        "",
        window.location.pathname
      );

      if (!token) {
        setMessage("Google sign-in did not return a token.");

        navigate(
          "/login?googleError=" +
            encodeURIComponent(
              "Google did not return a token. Please try again."
            ),
          { replace: true }
        );

        return;
      }

      try {
        localStorage.setItem("token", token);

        const currentUser = await refreshUser();

if (!currentUser) {
  throw new Error("Could not load the authenticated user.");
}

        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error(
          "[Google OAuth] Login completion failed:",
          error.message
        );

        localStorage.removeItem("token");

        setMessage("Unable to complete Google sign-in.");

        navigate(
          "/login?googleError=" +
            encodeURIComponent(
              "Unable to load your account. Please try again."
            ),
          { replace: true }
        );
      }
    };

    finishLogin();
  }, [navigate, refreshUser]);

  return (
    <main className="google-callback-page">
      <div className="google-callback-card">
        <div className="google-callback-spinner" />
        <h2>{message}</h2>
        <p>
          Please wait while SkillShare prepares your account.
        </p>
      </div>
    </main>
  );
}

export default GoogleCallback;
