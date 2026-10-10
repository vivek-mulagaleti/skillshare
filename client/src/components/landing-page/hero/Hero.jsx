import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import "./Hero.css";

function Hero() {
  return (
    <section className="hero">

      <div className="hero-container">

        {/* =========================
            LEFT SIDE - HERO TEXT
        ========================= */}

        <motion.div
          className="hero-content"

          initial={{
            opacity: 0,
            x: -40,
          }}

          animate={{
            opacity: 1,
            x: 0,
          }}

          transition={{
            duration: 0.7,
          }}
        >

          <p className="hero-small-text">
            Learn from people. Teach what you know.
          </p>


          <h1 className="hero-title">
            Your skills are
            <span> worth sharing.</span>
          </h1>


          <p className="hero-description">
            SkillShare connects people who want to learn
            with people who already know how.
          </p>


          {/* Buttons */}

          <div className="hero-buttons">

            <Link
              to="/register"
              className="hero-primary-button"
            >
              Start learning
            </Link>


            <a
              href="#how-it-works"
              className="hero-secondary-button"
            >
              See how it works
            </a>

          </div>

        </motion.div>


        {/* =========================
            RIGHT SIDE - SKILL MATCH
        ========================= */}

        <motion.div
          className="hero-visual"

          initial={{
            opacity: 0,
            x: 40,
          }}

          animate={{
            opacity: 1,
            x: 0,
          }}

          transition={{
            duration: 0.7,
            delay: 0.2,
          }}
        >

          {/* =========================
              MAIN MATCH CARD
          ========================= */}

          <motion.div
            className="match-card"

            animate={{
              y: [0, -10, 0],
            }}

            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >

            <p className="match-label">
              SKILL MATCH
            </p>


            <h2>
              Photography
            </h2>


            <p className="match-description">
              Find someone who can teach
              you what you want to learn.
            </p>


            {/* Mentor information */}

            <div className="mentor">

              <div className="mentor-avatar">
                A
              </div>


              <div className="mentor-info">

                <h3>
                  Alex
                </h3>

                <p>
                  Photography mentor
                </p>

              </div>


              <div className="match-percent">
                98%
              </div>

            </div>


            {/* Session information */}

            <div className="session-info">

              <div>

                <span>
                  Session
                </span>

                <strong>
                  1 hour
                </strong>

              </div>


              <div>

                <span>
                  Cost
                </span>

                <strong>
                  1 credit
                </strong>

              </div>

            </div>

          </motion.div>


          {/* =========================
              FLOATING CREDIT CARD
          ========================= */}

          <motion.div
            className="credit-card"

            animate={{
              y: [0, -8, 0],
            }}

            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >

            <span>
              Your balance
            </span>

            <strong>
              4.5 credits
            </strong>

          </motion.div>


          {/* =========================
              FLOATING TEACH CARD
          ========================= */}

          <motion.div
            className="teach-card"

            animate={{
              y: [0, 8, 0],
            }}

            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >

            <span>
              You can teach
            </span>

            <strong>
              JavaScript
            </strong>

          </motion.div>

        </motion.div>

      </div>

    </section>
  );
}

export default Hero;