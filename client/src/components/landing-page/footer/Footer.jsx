import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

import "./Footer.css";

function Footer() {
  return (
    <motion.footer
      className="footer"

      initial={{
        opacity: 0,
      }}

      whileInView={{
        opacity: 1,
      }}

      viewport={{
        once: true,
      }}

      transition={{
        duration: 0.6,
      }}
    >

      <div className="footer-content">

        {/* Brand */}

        <div className="footer-brand">

          <Link
            to="/"
            className="footer-logo"
          >

            <div className="footer-logo-icon">
              <Sparkles size={18} />
            </div>

            <span>
              Skill<span>Share</span>
            </span>

          </Link>

          <p>
            Learn what you want.
            Teach what you know.
          </p>

        </div>


        {/* Product links */}

        <div className="footer-column">

          <h3>
            Product
          </h3>

          <a href="#how-it-works">
            How it works
          </a>

          <a href="#skills">
            Explore skills
          </a>

          <Link to="/register">
            Get started
          </Link>

        </div>


        {/* Account links */}

        <div className="footer-column">

          <h3>
            Account
          </h3>

          <Link to="/login">
            Log in
          </Link>

          <Link to="/register">
            Create account
          </Link>

        </div>

      </div>


      {/* Footer bottom */}

      <div className="footer-bottom">

        <p>
          © 2026 SkillShare. All rights reserved.
        </p>

        <p>
          Built for people who love learning.
        </p>

      </div>

    </motion.footer>
  );
}

export default Footer;