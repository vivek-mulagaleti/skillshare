import { motion } from "framer-motion";

import "./HowItWorks.css";

function HowItWorks() {
  return (
    <section className="how-it-works" id="how-it-works">

      {/* =========================
          SECTION HEADING
      ========================= */}

      <motion.div
        className="how-it-works-heading"

        initial={{
          opacity: 0,
          y: 30,
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
          duration: 0.6,
        }}
      >

        <p className="section-label">
          HOW IT WORKS
        </p>

        <h2>
          Give an hour.
          <span> Get an hour.</span>
        </h2>

        <p className="section-description">
          SkillShare turns your knowledge into time that
          you can use to learn something new.
        </p>

      </motion.div>


      {/* =========================
          THREE STEPS
      ========================= */}

      <div className="steps">

        {/* Step 1 */}

        <motion.div
          className="step-card"

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
            amount: 0.2,
          }}

          transition={{
            duration: 0.5,
            delay: 0.1,
          }}
        >

          <span className="step-number">
            01
          </span>

          <h3>
            Choose your skills
          </h3>

          <p>
            Tell the community what you can teach
            and what you want to learn.
          </p>

        </motion.div>


        {/* Step 2 */}

        <motion.div
          className="step-card"

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
            amount: 0.2,
          }}

          transition={{
            duration: 0.5,
            delay: 0.25,
          }}
        >

          <span className="step-number">
            02
          </span>

          <h3>
            Find your match
          </h3>

          <p>
            Discover people whose skills match
            what you want to learn.
          </p>

        </motion.div>


        {/* Step 3 */}

        <motion.div
          className="step-card"

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
            amount: 0.2,
          }}

          transition={{
            duration: 0.5,
            delay: 0.4,
          }}
        >

          <span className="step-number">
            03
          </span>

          <h3>
            Exchange time
          </h3>

          <p>
            Teach a session, earn time credits,
            and use them to learn.
          </p>

        </motion.div>

      </div>

    </section>
  );
}

export default HowItWorks;