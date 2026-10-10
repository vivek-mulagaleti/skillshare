import { motion } from "framer-motion";

import "./Skills.css";

function Skills() {
  return (
    <section className="skills-section" id="skills">

      {/* =========================
          SECTION HEADING
      ========================= */}

      <motion.div
        className="skills-heading"

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

        <p className="skills-label">
          EXPLORE SKILLS
        </p>

        <h2>
          Learn something
          <span> new today.</span>
        </h2>

        <p>
          Find people who can teach what you want to learn,
          or share something you're already good at.
        </p>

      </motion.div>


      {/* =========================
          SKILL CARDS
      ========================= */}

      <div className="skill-cards">

        {/* Programming */}

        <motion.div
          className="skill-card programming"

          initial={{
            opacity: 0,
            y: 40,
          }}

          whileInView={{
            opacity: 1,
            y: 0,
          }}

          whileHover={{
            y: -10,
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

          <div className="skill-icon">
            &lt;/&gt;
          </div>

          <h3>
            Programming
          </h3>

          <p>
            Learn web development, Python,
            JavaScript and more.
          </p>

          <span>
            120+ mentors
          </span>

        </motion.div>


        {/* Design */}

        <motion.div
          className="skill-card design"

          initial={{
            opacity: 0,
            y: 40,
          }}

          whileInView={{
            opacity: 1,
            y: 0,
          }}

          whileHover={{
            y: -10,
          }}

          viewport={{
            once: true,
            amount: 0.2,
          }}

          transition={{
            duration: 0.5,
            delay: 0.2,
          }}
        >

          <div className="skill-icon">
            ✦
          </div>

          <h3>
            Design
          </h3>

          <p>
            Learn UI/UX, graphic design,
            illustration and more.
          </p>

          <span>
            85+ mentors
          </span>

        </motion.div>


        {/* Languages */}

        <motion.div
          className="skill-card languages"

          initial={{
            opacity: 0,
            y: 40,
          }}

          whileInView={{
            opacity: 1,
            y: 0,
          }}

          whileHover={{
            y: -10,
          }}

          viewport={{
            once: true,
            amount: 0.2,
          }}

          transition={{
            duration: 0.5,
            delay: 0.3,
          }}
        >

          <div className="skill-icon">
            A
          </div>

          <h3>
            Languages
          </h3>

          <p>
            Practice English, Spanish,
            French and other languages.
          </p>

          <span>
            200+ mentors
          </span>

        </motion.div>


        {/* Music */}

        <motion.div
          className="skill-card music"

          initial={{
            opacity: 0,
            y: 40,
          }}

          whileInView={{
            opacity: 1,
            y: 0,
          }}

          whileHover={{
            y: -10,
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

          <div className="skill-icon">
            ♪
          </div>

          <h3>
            Music
          </h3>

          <p>
            Learn guitar, piano, singing
            and music production.
          </p>

          <span>
            70+ mentors
          </span>

        </motion.div>

      </div>

    </section>
  );
}

export default Skills;