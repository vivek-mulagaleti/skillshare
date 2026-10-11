import "./NotFound.css";
import { Link, useLocation } from "react-router-dom";

export default function NotFound() {
  const location = useLocation();

  const isUnknownApiPath = location.pathname.startsWith("/api/");

  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <p className="not-found-code">404</p>

        <h1>
          {isUnknownApiPath
            ? "API route not found"
            : "Page not found"}
        </h1>

        <p>
          {isUnknownApiPath
            ? "This API endpoint does not exist."
            : "The page you're looking for doesn't exist or may have moved."}
        </p>

        <Link to="/dashboard" className="not-found-button">
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
