import { useCallback, useEffect, useMemo, useState } from "react";

import { Link, Navigate } from "react-router-dom";

import { motion } from "framer-motion";

import {

  ArrowLeft,

  BookOpen,

  Compass,

  Sparkles,

  UserRound,

  Clock,

  Search,

  AlertCircle,

  X,

  SlidersHorizontal,

  ArrowUpDown,

  Star,
  Send,
  LoaderCircle,
  CheckCircle2,
  Coins,
} from "lucide-react";



import { useAuth } from "../../context/AuthContext";

import api from "../../services/api";

import "./Discover.css";



function getId(value) {

  if (!value) return "";

  return String(value._id || value.id || value);

}



function Discover() {

  const { user, loading: authLoading } = useAuth();



  const [matches, setMatches] = useState([]);

  const [matchesLoading, setMatchesLoading] = useState(true);

  const [error, setError] = useState("");

  const [teacherRatings, setTeacherRatings] = useState({});

  // Session request modal state
  const [requestTeacher, setRequestTeacher] = useState(null);
  const [requestSkillId, setRequestSkillId] = useState("");
  const [requestDuration, setRequestDuration] = useState("1");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");



  // Search and filter state

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("all");

  const [selectedLevel, setSelectedLevel] = useState("all");

  const [sortBy, setSortBy] = useState("name");



  const currentUserId = getId(user);



  const loadMatches = useCallback(async () => {

    if (!currentUserId) {

      setMatches([]);

      setTeacherRatings({});

      setMatchesLoading(false);

      return;

    }



    try {

      setMatchesLoading(true);

      setError("");



      const response = await api.get("/matches/learn");

      const returnedMatches = response.data.matches || [];



      const normalizedMatches = returnedMatches

        .map((match) => {

          const teacher = match.user;

          if (!teacher) return null;



          const teacherId = getId(teacher);



          // Never show the logged-in user's own profile.

          if (!teacherId || teacherId === currentUserId) {

            return null;

          }



          const skills = Array.isArray(match.skills)

            ? match.skills

            : match.skill

              ? [match.skill]

              : [];



          const uniqueSkills = Array.from(

            new Map(

              skills

                .filter((skill) => skill && getId(skill))

                .map((skill) => [getId(skill), skill]),

            ).values(),

          );



          if (uniqueSkills.length === 0) return null;



          return {

            _id: teacherId,

            user: teacher,

            skills: uniqueSkills,

          };

        })

        .filter(Boolean);



      // Merge multiple records for the same teacher.

      const teachersById = new Map();



      for (const match of normalizedMatches) {

        const teacherId = getId(match.user);



        if (!teachersById.has(teacherId)) {

          teachersById.set(teacherId, {

            ...match,

            skills: [...match.skills],

          });

        } else {

          const existing = teachersById.get(teacherId);

          const knownIds = new Set(

            existing.skills.map((skill) => getId(skill)),

          );



          for (const skill of match.skills) {

            if (!knownIds.has(getId(skill))) {

              existing.skills.push(skill);

              knownIds.add(getId(skill));

            }

          }

        }

      }



      const finalMatches = Array.from(teachersById.values());



      setMatches(finalMatches);



      // Fetch each teacher's rating independently.

      // A failed rating request will not break the Discover page.

      const ratingResults = await Promise.all(

        finalMatches.map(async (match) => {

          const teacherId = getId(match.user);



          try {

            const ratingResponse = await api.get(

              `/reviews/teacher/${teacherId}`,

            );



            return [

              teacherId,

              {

                averageRating: Number(ratingResponse.data.averageRating) || 0,

                count: Number(ratingResponse.data.count) || 0,

                loaded: true,

              },

            ];

          } catch (ratingError) {

            console.error(

              `Failed to load ratings for teacher ${teacherId}:`,

              ratingError.response?.data || ratingError.message,

            );



            return [

              teacherId,

              {

                averageRating: 0,

                count: 0,

                loaded: false,

              },

            ];

          }

        }),

      );



      setTeacherRatings(Object.fromEntries(ratingResults));

    } catch (err) {

      console.error(

        "Failed to load matches:",

        err.response?.data || err.message,

      );



      setError(

        err.response?.data?.message ||

          "Something went wrong while finding your matches.",

      );



      setMatches([]);

      setTeacherRatings({});

    } finally {

      setMatchesLoading(false);

    }

  }, [currentUserId]);



  useEffect(() => {

    if (!authLoading) {

      loadMatches();

    }

  }, [authLoading, loadMatches]);



  // Build category options from the skills returned by the API.

  const categories = useMemo(() => {

    const categorySet = new Set();



    matches.forEach((match) => {

      match.skills.forEach((skill) => {

        if (skill.category) {

          categorySet.add(skill.category);

        }

      });

    });



    return Array.from(categorySet).sort((a, b) => a.localeCompare(b));

  }, [matches]);



  // Search, filter, and sort the available matches.

  const filteredMatches = useMemo(() => {

    const query = searchTerm.trim().toLowerCase();



    const filtered = matches.filter((match) => {

      const teacher = match.user;



      const matchesSearch =

        !query ||

        (teacher.name || "").toLowerCase().includes(query) ||

        (teacher.bio || "").toLowerCase().includes(query) ||

        match.skills.some(

          (skill) =>

            (skill.name || "").toLowerCase().includes(query) ||

            (skill.category || "").toLowerCase().includes(query),

        );



      const matchesCategory =

        selectedCategory === "all" ||

        match.skills.some(

          (skill) =>

            (skill.category || "").toLowerCase() ===

            selectedCategory.toLowerCase(),

        );



      const matchesLevel =

        selectedLevel === "all" ||

        match.skills.some(

          (skill) =>

            (skill.level || "BEGINNER").toUpperCase() === selectedLevel,

        );



      return matchesSearch && matchesCategory && matchesLevel;

    });



    return filtered.sort((a, b) => {

      const nameA = (a.user.name || "").toLowerCase();

      const nameB = (b.user.name || "").toLowerCase();



      if (sortBy === "name-desc") {

        return nameB.localeCompare(nameA);

      }



      if (sortBy === "skills") {

        return b.skills.length - a.skills.length || nameA.localeCompare(nameB);

      }



      if (sortBy === "rating") {

        const ratingA = teacherRatings[getId(a.user)]?.averageRating || 0;

        const ratingB = teacherRatings[getId(b.user)]?.averageRating || 0;

        const countA = teacherRatings[getId(a.user)]?.count || 0;

        const countB = teacherRatings[getId(b.user)]?.count || 0;



        // Teachers with reviews appear before teachers without reviews.

        if (countA === 0 && countB > 0) return 1;

        if (countB === 0 && countA > 0) return -1;



        return ratingB - ratingA || nameA.localeCompare(nameB);

      }



      return nameA.localeCompare(nameB);

    });

  }, [

    matches,

    searchTerm,

    selectedCategory,

    selectedLevel,

    sortBy,

    teacherRatings,

  ]);



  const hasActiveFilters =

    searchTerm.trim() !== "" ||

    selectedCategory !== "all" ||

    selectedLevel !== "all";



  const clearFilters = () => {

    setSearchTerm("");

    setSelectedCategory("all");

    setSelectedLevel("all");

    setSortBy("name");

  };



  const openRequestModal = (match, skill) => {
    setRequestTeacher(match);
    setRequestSkillId(getId(skill));
    setRequestDuration("1");
    setRequestMessage("");
    setRequestError("");
    setRequestSuccess("");
  };

  const closeRequestModal = () => {
    if (requestLoading) return;
    setRequestTeacher(null);
    setRequestError("");
    setRequestSuccess("");
  };

  const handleSessionRequest = async (event) => {
    event.preventDefault();
    if (!requestTeacher || !requestSkillId) {
      setRequestError("Please select a skill to learn.");
      return;
    }
    const hours = Number(requestDuration);
    if (!Number.isInteger(hours) || hours < 1 || hours > 4) {
      setRequestError("Choose a duration between 1 and 4 hours.");
      return;
    }
    if (requestMessage.trim().length > 500) {
      setRequestError("Your message must be 500 characters or fewer.");
      return;
    }

    try {
      setRequestLoading(true);
      setRequestError("");
      setRequestSuccess("");
      await api.post("/sessions/request", {
        teacherId: getId(requestTeacher.user),
        skillId: requestSkillId,
        duration: hours,
        message: requestMessage.trim(),
      });
      setRequestSuccess("Session request sent! You can follow its status in My Sessions.");
    } catch (err) {
      setRequestError(
        err.response?.data?.message ||
          (err.response?.status === 409
            ? "You already have a pending request for this teacher and skill."
            : "Could not send your session request. Please try again."),
      );
    } finally {
      setRequestLoading(false);
    }
  };

  useEffect(() => {
    if (!requestTeacher) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape" && !requestLoading) closeRequestModal();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [requestTeacher, requestLoading]);

  if (authLoading) {

    return (

      <main className="discover-loading">

        <div className="discover-loading-spinner" />

        <p>Loading Discover...</p>

      </main>

    );

  }



  if (!user) {

    return <Navigate to="/login" replace />;

  }



  return (

    <main className="discover-page">

      <aside className="discover-sidebar">

        <Link to="/" className="discover-logo">

          <div className="discover-logo-icon">

            <Sparkles size={18} />

          </div>



          <span>

            Skill<span>Share</span>

          </span>

        </Link>



        <nav className="discover-nav">

          <Link to="/dashboard" className="discover-nav-link">

            <Compass size={19} />

            <span>Dashboard</span>

          </Link>



          <Link to="/discover" className="discover-nav-link active">

            <Search size={19} />

            <span>Discover</span>

          </Link>



          <Link to="/my-skills" className="discover-nav-link">

            <BookOpen size={19} />

            <span>My Skills</span>

          </Link>



          <Link to="/my-sessions" className="discover-nav-link">

            <Clock size={19} />

            <span>Sessions</span>

          </Link>

        </nav>



        <div className="discover-sidebar-bottom">

          <Link to="/dashboard" className="discover-nav-link">

            <ArrowLeft size={19} />

            <span>Back to dashboard</span>

          </Link>

        </div>

      </aside>



      <section className="discover-content">

        <header className="discover-header">

          <div>

            <p className="discover-label">DISCOVER</p>



            <h1>

              Find someone who can

              <span> teach you.</span>

            </h1>



            <p className="discover-subtitle">

              Discover members who teach the skills you want to learn. Search

              the community to find your next learning partner.

            </p>

          </div>



          <Link

            to={`/profile/${getId(user)}`}

            className="discover-user-avatar"

            title="View your profile"

            aria-label="View your profile"

          >

            {user.avatar ? (

              <img

                src={user.avatar}

                alt={user.name || "Your profile"}

                className="discover-avatar-image"

                onError={(event) => {

                  event.currentTarget.style.display = "none";

                }}

              />

            ) : (

              user.name?.charAt(0).toUpperCase() || <UserRound size={20} />

            )}

          </Link>

        </header>



        <motion.section

          className="discover-intro"

          initial={{ opacity: 0, y: 20 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.5 }}

        >

          <div className="discover-intro-icon">

            <Sparkles size={24} />

          </div>



          <div>

            <p className="discover-intro-label">YOUR MATCHES</p>



            <h2>Learn from people in the SkillShare community.</h2>



            <p>

              Your matches are based on the skills you have added to your

              learning profile.

            </p>

          </div>

        </motion.section>



        <div className="discover-section-heading">

          <div>

            <p className="discover-label">PEOPLE FOR YOU</p>



            <h2>

              {matchesLoading

                ? "Finding your matches..."

                : `${filteredMatches.length} ${

                    filteredMatches.length === 1 ? "person" : "people"

                  } found`}

            </h2>

          </div>

        </div>



        {/* Search and filter controls */}

        {!matchesLoading && !error && matches.length > 0 && (

          <section className="discover-filters">

            <div className="discover-search">

              <Search size={19} />



              <input

                type="search"

                placeholder="Search people, skills, or categories..."

                value={searchTerm}

                onChange={(event) => setSearchTerm(event.target.value)}

                aria-label="Search teachers and skills"

              />



              {searchTerm && (

                <button

                  type="button"

                  className="discover-search-clear"

                  onClick={() => setSearchTerm("")}

                  aria-label="Clear search"

                >

                  <X size={17} />

                </button>

              )}

            </div>



            <div className="discover-filter-controls">

              <label className="discover-filter-select">

                <SlidersHorizontal size={17} />



                <select

                  value={selectedCategory}

                  onChange={(event) => setSelectedCategory(event.target.value)}

                  aria-label="Filter by skill category"

                >

                  <option value="all">All categories</option>



                  {categories.map((category) => (

                    <option key={category} value={category}>

                      {category}

                    </option>

                  ))}

                </select>

              </label>



              <label className="discover-filter-select">

                <SlidersHorizontal size={17} />



                <select

                  value={selectedLevel}

                  onChange={(event) => setSelectedLevel(event.target.value)}

                  aria-label="Filter by teacher skill level"

                >

                  <option value="all">All skill levels</option>

                  <option value="BEGINNER">Beginner</option>

                  <option value="INTERMEDIATE">Intermediate</option>

                  <option value="ADVANCED">Advanced</option>

                  <option value="EXPERT">Expert</option>

                </select>

              </label>



              <label className="discover-filter-select">

                <ArrowUpDown size={17} />



                <select

                  value={sortBy}

                  onChange={(event) => setSortBy(event.target.value)}

                  aria-label="Sort teachers"

                >

                  <option value="name">Name: A–Z</option>

                  <option value="name-desc">Name: Z–A</option>

                  <option value="skills">Most skills</option>

                  <option value="rating">Highest rating</option>

                </select>

              </label>



              {hasActiveFilters && (

                <button

                  type="button"

                  className="discover-clear-filters"

                  onClick={clearFilters}

                >

                  <X size={15} />

                  Clear filters

                </button>

              )}

            </div>

          </section>

        )}



        {matchesLoading && (

          <div className="discover-state">

            <div className="discover-loading-spinner" />

            <h3>Finding your matches</h3>

            <p>

              We're looking for people who can teach what you want to learn.

            </p>

          </div>

        )}



        {!matchesLoading && error && (

          <div className="discover-state discover-error-state">

            <div className="discover-state-icon">

              <AlertCircle size={28} />

            </div>



            <h3>We couldn't load your matches</h3>

            <p>{error}</p>



            <button

              className="discover-retry-button"

              onClick={loadMatches}

              type="button"

            >

              Try again

            </button>

          </div>

        )}



        {!matchesLoading && !error && matches.length === 0 && (

          <div className="discover-state">

            <div className="discover-state-icon">

              <BookOpen size={28} />

            </div>



            <h3>No matches yet</h3>



            <p>

              Add skills you want to learn, or check back when more members

              teach those skills.

            </p>



            <Link to="/my-skills" className="discover-state-button">

              Add learning skills

            </Link>

          </div>

        )}



        {!matchesLoading &&

          !error &&

          matches.length > 0 &&

          filteredMatches.length === 0 && (

            <div className="discover-state">

              <div className="discover-state-icon">

                <Search size={28} />

              </div>



              <h3>No matching people found</h3>



              <p>

                Try a different name, skill, or category, or clear your filters

                to see everyone again.

              </p>



              <button

                type="button"

                className="discover-state-button"

                onClick={clearFilters}

              >

                Clear filters

              </button>

            </div>

          )}



        {!matchesLoading && !error && filteredMatches.length > 0 && (

          <div className="matches-grid">

            {filteredMatches.map((match, index) => {

              const teacher = match.user;

              const teacherId = getId(teacher);

              const rating = teacherRatings[teacherId];

              const reviewCount = rating?.count || 0;

              const averageRating = rating?.averageRating || 0;



              // Show only skills in the selected category.

              const visibleSkills = match.skills.filter((skill) => {

  const matchesCategory =

    selectedCategory === "all" ||

    (skill.category || "").toLowerCase() ===

      selectedCategory.toLowerCase();



  const matchesLevel =

    selectedLevel === "all" ||

    (skill.level || "BEGINNER").toUpperCase() === selectedLevel;



  return matchesCategory && matchesLevel;

});



              return (

                <motion.article

                  key={match._id}

                  className="match-card"

                  initial={{ opacity: 0, y: 25 }}

                  animate={{ opacity: 1, y: 0 }}

                  transition={{

                    duration: 0.45,

                    delay: Math.min(index * 0.05, 0.3),

                  }}

                >

                  <div className="match-card-top">

                    <div className="match-avatar">

                      {teacher.avatar ? (

                        <img

                          src={teacher.avatar}

                          alt={teacher.name || "Teacher"}

                          className="match-avatar-image"

                          onError={(event) => {

                            event.currentTarget.style.display = "none";

                          }}

                        />

                      ) : (

                        teacher.name?.charAt(0).toUpperCase() || (

                          <UserRound size={24} />

                        )

                      )}

                    </div>



                    <div className="match-person">

                      <h3>{teacher.name || "SkillShare member"}</h3>



                      <p>

                        <UserRound size={14} />

                        SkillShare member

                      </p>



                      <div className="match-rating">

                        {rating?.loaded === false ? (

                          <span className="match-no-rating">

                            Rating unavailable

                          </span>

                        ) : reviewCount > 0 ? (

                          <>

                            <span

                              className="match-rating-stars"

                              aria-label={`${averageRating} out of 5 stars`}

                            >

                              {[1, 2, 3, 4, 5].map((star) => (

                                <Star

                                  key={star}

                                  size={14}

                                  fill={

                                    star <= Math.round(averageRating)

                                      ? "currentColor"

                                      : "none"

                                  }

                                />

                              ))}

                            </span>



                            <strong>{averageRating.toFixed(1)}</strong>



                            <span className="match-rating-count">

                              ({reviewCount}{" "}

                              {reviewCount === 1 ? "review" : "reviews"})

                            </span>

                          </>

                        ) : rating?.loaded ? (

                          <span className="match-no-rating">

                            No reviews yet

                          </span>

                        ) : (

                          <span className="match-no-rating">

                            Loading rating...

                          </span>

                        )}

                      </div>

                    </div>

                  </div>



                  <div className="match-skill-section">

                    <p className="match-section-label">CAN TEACH YOU</p>



                    {visibleSkills.map((skill) => (

                      <div className="match-skill" key={getId(skill)}>

                        <div className="match-skill-icon">

                          <BookOpen size={18} />

                        </div>



                        <div className="match-skill-details">

  <h4>{skill.name || "Skill"}</h4>



  <span className="match-skill-category">

    {skill.category || "SKILL"}

  </span>



  <span

    className={`match-skill-level match-skill-level-${(

      skill.level || "BEGINNER"

    ).toLowerCase()}`}

  >

    {(skill.level || "BEGINNER").charAt(0).toUpperCase() +

      (skill.level || "BEGINNER").slice(1).toLowerCase()}

  </span>



  {skill.teachingDescription && (

    <p className="match-skill-description">

      {skill.teachingDescription}

    </p>

  )}

</div>

                      </div>

                    ))}

                  </div>



                  {teacher.bio && (

                    <p className="match-description">{teacher.bio}</p>

                  )}



                  <div className="match-card-actions">
                    <Link to={`/profile/${teacherId}`} className="match-button match-profile-button">
                      View profile
                    </Link>
                    <button
                      type="button"
                      className="match-button match-request-button"
                      onClick={() => openRequestModal(match, visibleSkills[0] || match.skills[0])}
                      disabled={!visibleSkills.length}
                    >
                      <Send size={15} /> Request session
                    </button>
                  </div>

                </motion.article>

              );

            })}

          </div>

        )}

      </section>

      {requestTeacher && (
        <div
          className="session-request-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeRequestModal();
          }}
        >
          <form className="session-request-modal" onSubmit={handleSessionRequest}>
            <button
              type="button"
              className="session-request-close"
              onClick={closeRequestModal}
              disabled={requestLoading}
              aria-label="Close session request"
            >
              <X size={19} />
            </button>

            <div className="session-request-heading-icon"><Send size={21} /></div>
            <p className="session-request-eyebrow">START LEARNING</p>
            <h2>Request a session</h2>
            <p className="session-request-subtitle">
              Send a request to {requestTeacher.user?.name || "this teacher"}. They can accept or decline it.
            </p>

            {requestSuccess ? (
              <div className="session-request-success" role="status">
                <CheckCircle2 size={22} />
                <div>
                  <strong>Request sent</strong>
                  <p>{requestSuccess}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="session-request-credit-note">
                  <Coins size={18} />
                  <span>Credits are reserved when the teacher accepts your request.</span>
                </div>

                <div className="session-request-field">
                  <label htmlFor="requestSkill">Skill you want to learn</label>
                  <select
                    id="requestSkill"
                    value={requestSkillId}
                    onChange={(event) => setRequestSkillId(event.target.value)}
                    required
                    disabled={requestLoading}
                  >
                    {requestTeacher.skills.map((skill) => (
                      <option key={getId(skill)} value={getId(skill)}>
                        {skill.name || "Skill"}{skill.level ? ` · ${skill.level.charAt(0) + skill.level.slice(1).toLowerCase()}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="session-request-field">
                  <label htmlFor="requestDuration">Session duration</label>
                  <select
                    id="requestDuration"
                    value={requestDuration}
                    onChange={(event) => setRequestDuration(event.target.value)}
                    required
                    disabled={requestLoading}
                  >
                    <option value="1">1 hour · 1 credit</option>
                    <option value="2">2 hours · 2 credits</option>
                    <option value="3">3 hours · 3 credits</option>
                    <option value="4">4 hours · 4 credits</option>
                  </select>
                </div>

                <div className="session-request-field">
                  <label htmlFor="requestMessage">Message <span>Optional</span></label>
                  <textarea
                    id="requestMessage"
                    value={requestMessage}
                    onChange={(event) => setRequestMessage(event.target.value)}
                    placeholder="What would you like to learn in this session?"
                    rows={4}
                    maxLength={500}
                    disabled={requestLoading}
                  />
                  <span className="session-request-count">{requestMessage.length}/500</span>
                </div>

                {requestError && <div className="session-request-error" role="alert">{requestError}</div>}

                <button type="submit" className="session-request-submit" disabled={requestLoading}>
                  {requestLoading ? <><LoaderCircle className="session-request-spinner" size={17} /> Sending request...</> : <><Send size={16} /> Send request</>}
                </button>
              </>
            )}

            {requestSuccess && (
              <div className="session-request-success-actions">
                <Link to="/my-sessions" className="session-request-submit">View my sessions</Link>
                <button type="button" className="session-request-secondary" onClick={closeRequestModal}>Done</button>
              </div>
            )}
          </form>
        </div>
      )}
    </main>
  );
}



export default Discover;
