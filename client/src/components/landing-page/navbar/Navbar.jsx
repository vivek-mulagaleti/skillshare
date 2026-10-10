import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">

      {/* Logo */}
      <Link to="/" className="navbar-logo">
        Skill<span>Share</span>
      </Link>

      {/* Navigation links */}
      <div className="navbar-links">

        <a href="#how-it-works">
          How it works
        </a>

        <a href="#skills">
          Explore skills
        </a>

        <Link to="/login">
          Log in
        </Link>

        <Link to="/register" className="navbar-button">
          Get started
        </Link>

      </div>

    </nav>
  );
}

export default Navbar;