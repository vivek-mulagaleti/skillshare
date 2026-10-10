import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import "./CTA.css";

function CTA() {
  return (
    <section className="cta-section">

      <motion.div
        className="cta-content"

        initial={{
          opacity: 0,
          y: 40,
        }}

        whileInView={{
          opacity: 1,
          y: 0,
        }}

        viewport={{
          once: true,
          amount: 0.3,
        }}

        transition={{
          duration: 0.7,
        }}
      >

        <p className="cta-label">
          START YOUR JOURNEY
        </p>

        <h2>
          Someone out there knows
          <span> what you need to learn.</span>
        </h2>

        <p className="cta-description">
          Join SkillShare and turn your own knowledge
          into opportunities to learn.
        </p>

        <Link
          to="/register"
          className="cta-button"
        >
          Create your account
        </Link>

      </motion.div>

    </section>
  );
}

export default CTA;