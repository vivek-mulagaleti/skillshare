import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Plus,
  Sparkles,
  X,
  Pencil,
  Trash2,
  Check,
  LoaderCircle,
} from "lucide-react";

import api from "../../services/api";

import "./MySkills.css";

function MySkills() {
  const [skills, setSkills] = useState([]);
  const [mySkills, setMySkills] = useState([]);

  const [type, setType] = useState("TEACH");
  const [skillId, setSkillId] = useState("");
  const [level, setLevel] = useState("BEGINNER");
  const [description, setDescription] = useState("");

  const [showNewSkillForm, setShowNewSkillForm] = useState(false);

  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("");
  const [newSkillDescription, setNewSkillDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingSkill, setCreatingSkill] = useState(false);

  const [editingSkill, setEditingSkill] = useState(null);
  const [editLevel, setEditLevel] = useState("BEGINNER");
  const [editDescription, setEditDescription] = useState("");
  const [updatingSkill, setUpdatingSkill] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getToken = () => {
    return localStorage.getItem("token");
  };

  /*
   * Load all available skills and
   * the skills belonging to the current user.
   */
  const loadSkills = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      const [skillsResponse, mySkillsResponse] = await Promise.all([
        api.get("/skills"),

        api.get("/user-skills/my-skills", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      /*
       * BACKEND:
       *
       * GET /skills returns:
       *
       * {
       *   skills: [...]
       * }
       */
      const availableSkills = skillsResponse.data.skills || [];

      /*
       * BACKEND:
       *
       * GET /user-skills/my-skills returns:
       *
       * {
       *   skillsToTeach: [...],
       *   skillsToLearn: [...]
       * }
       *
       * Combine both arrays so the UI can work
       * with one mySkills array.
       */
      const skillsToTeach = mySkillsResponse.data.skillsToTeach || [];

      const skillsToLearn = mySkillsResponse.data.skillsToLearn || [];

      const allMySkills = [...skillsToTeach, ...skillsToLearn];

      setSkills(availableSkills);
      setMySkills(allMySkills);
    } catch (error) {
      console.error(
        "Load skills error:",
        error.response?.data || error.message,
      );

      setError(error.response?.data?.message || "Unable to load your skills.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  /*
   * Create a completely new skill.
   */
  const handleCreateSkill = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!newSkillName.trim()) {
      setError("Please enter a skill name.");
      return;
    }

    if (!newSkillCategory.trim()) {
      setError("Please enter a category.");
      return;
    }

    try {
      setCreatingSkill(true);

      const token = getToken();

      const response = await api.post(
        "/skills",
        {
          name: newSkillName.trim(),
          category: newSkillCategory.trim(),
          description: newSkillDescription.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const createdSkill = response.data.skill;

      /*
       * If the backend says the skill already exists,
       * it sends the existing skill back.
       */
      if (!createdSkill?._id) {
        throw new Error("The server did not return a skill.");
      }

      /*
       * Add the new skill to the dropdown.
       */
      setSkills((currentSkills) => [...currentSkills, createdSkill]);

      /*
       * Automatically select the new skill.
       */
      setSkillId(createdSkill._id);

      /*
       * Close modal.
       */
      setShowNewSkillForm(false);

      /*
       * Clear modal fields.
       */
      setNewSkillName("");
      setNewSkillCategory("");
      setNewSkillDescription("");

      setSuccess(`"${createdSkill.name}" created successfully.`);
    } catch (error) {
      console.error(
        "Create skill error:",
        error.response?.data || error.message,
      );

      /*
       * If the skill already exists, the backend
       * sends the existing skill in response.data.skill.
       *
       * We can use it instead of showing a useless error.
       */
      if (error.response?.status === 409 && error.response?.data?.skill) {
        const existingSkill = error.response.data.skill;

        setSkills((currentSkills) => {
          const alreadyExists = currentSkills.some(
            (skill) => skill._id === existingSkill._id,
          );

          if (alreadyExists) {
            return currentSkills;
          }

          return [...currentSkills, existingSkill];
        });

        setSkillId(existingSkill._id);

        setShowNewSkillForm(false);

        setNewSkillName("");
        setNewSkillCategory("");
        setNewSkillDescription("");

        setSuccess(
          `"${existingSkill.name}" already exists and has been selected.`,
        );
      } else {
        setError(
          error.response?.data?.message || "Unable to create this skill.",
        );
      }
    } finally {
      setCreatingSkill(false);
    }
  };

  /*
   * Add selected skill to current user's profile.
   */
  const handleAddSkill = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!skillId) {
      setError("Please select a skill.");
      return;
    }

    try {
      setSaving(true);

      const token = getToken();

      /*
       * IMPORTANT:
       *
       * Your backend expects:
       *
       * skillId
       * type
       * level
       * description
       */
      await api.post(
        "/user-skills",
        {
          skillId,
          type,
          level,
          description: description.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setSuccess("Skill added successfully.");

      /*
       * Reset form.
       */
      setSkillId("");
      setLevel("BEGINNER");
      setDescription("");

      /*
       * Reload from MongoDB.
       *
       * This is what updates the right side.
       */
      await loadSkills();
    } catch (error) {
      console.error(
        "Add user skill error:",
        error.response?.data || error.message,
      );

      setError(error.response?.data?.message || "Unable to add this skill.");
    } finally {
      setSaving(false);
    }
  };

  // Open the edit form for a skill.
  const handleStartEdit = (userSkill) => {
    setEditingSkill(userSkill);
    setEditLevel(userSkill.level || "BEGINNER");
    setEditDescription(userSkill.description || "");
    setError("");
    setSuccess("");
  };

  // Save changes to a skill.
  const handleUpdateSkill = async (event) => {
    event.preventDefault();

    if (!editingSkill?._id) return;

    setError("");
    setSuccess("");

    if (
      !["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].includes(editLevel)
    ) {
      setError("Please select a valid skill level.");
      return;
    }

    if (editDescription.trim().length > 500) {
      setError("Description must be 500 characters or fewer.");
      return;
    }

    try {
      setUpdatingSkill(true);

      const response = await api.put(`/user-skills/${editingSkill._id}`, {
        level: editLevel,
        description: editDescription.trim(),
      });

      setSuccess(response.data?.message || "Skill updated successfully.");
      setEditingSkill(null);

      await loadSkills();
    } catch (error) {
      console.error(
        "Update user skill error:",
        error.response?.data || error.message,
      );

      setError(error.response?.data?.message || "Unable to update this skill.");
    } finally {
      setUpdatingSkill(false);
    }
  };

  // Delete a skill after the user confirms.
  const handleDeleteSkill = async (userSkill) => {
    const skillName = userSkill.skill?.name || "this skill";

    const confirmed = window.confirm(
      `Remove "${skillName}" from your profile?`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      setDeletingSkillId(userSkill._id);

      const response = await api.delete(`/user-skills/${userSkill._id}`);

      if (editingSkill?._id === userSkill._id) {
        setEditingSkill(null);
      }

      setSuccess(response.data?.message || "Skill removed from your profile.");

      await loadSkills();
    } catch (error) {
      console.error(
        "Delete user skill error:",
        error.response?.data || error.message,
      );

      setError(error.response?.data?.message || "Unable to remove this skill.");
    } finally {
      setDeletingSkillId("");
    }
  };

  /*
   * Separate skills for display.
   */
  const teachingSkills = mySkills.filter((skill) => skill.type === "TEACH");

  const learningSkills = mySkills.filter((skill) => skill.type === "LEARN");

  /*
   * Because your backend populates "skill",
   * each UserSkill looks like:
   *
   * {
   *   skill: {
   *     name: "Python",
   *     category: "Programming"
   *   },
   *   type: "TEACH",
   *   level: "ADVANCED"
   * }
   */
  const getSkillName = (userSkill) => {
    return userSkill.skill?.name || "Unknown skill";
  };

  const getSkillCategory = (userSkill) => {
    return userSkill.skill?.category || "Skill";
  };

  return (
    <main className="my-skills-page">
      {/* =========================================
          HEADER
      ========================================= */}

      {editingSkill && (
        <div className="edit-skill-overlay">
          <form className="edit-skill-modal" onSubmit={handleUpdateSkill}>
            <button
              type="button"
              className="close-modal-button"
              onClick={() => setEditingSkill(null)}
              aria-label="Close edit form"
              disabled={updatingSkill}
            >
              <X size={18} />
            </button>

            <div className="new-skill-heading">
              <div className="new-skill-icon">
                <Pencil size={20} />
              </div>
              <div>
                <p>UPDATE YOUR PROFILE</p>
                <h2>Edit skill</h2>
              </div>
            </div>

            <p className="edit-skill-name">
              {getSkillName(editingSkill)}
              {" · "}
              {editingSkill.type === "TEACH" ? "Teaching" : "Learning"}
            </p>

            <div className="skill-form-group">
              <label htmlFor="editSkillLevel">Your level</label>
              <select
                id="editSkillLevel"
                value={editLevel}
                onChange={(event) => setEditLevel(event.target.value)}
                disabled={updatingSkill}
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>

            <div className="skill-form-group">
              <label htmlFor="editSkillDescription">
                Description <span>Optional</span>
              </label>
              <textarea
                id="editSkillDescription"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                placeholder="Describe your experience or learning goals..."
                maxLength={500}
                rows={4}
                disabled={updatingSkill}
              />
              <p className="edit-character-count">
                {editDescription.length}/500 characters
              </p>
            </div>

            {error && (
              <div className="skill-message error" role="alert">
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setEditingSkill(null)}
                disabled={updatingSkill}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="create-skill-button"
                disabled={updatingSkill}
              >
                {updatingSkill ? (
                  <>
                    <LoaderCircle size={16} className="skill-action-spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Save changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <header className="my-skills-header">
        <Link to="/dashboard" className="back-button">
          <ArrowLeft size={18} />
          Dashboard
        </Link>

        <div className="my-skills-logo">
          <div className="my-skills-logo-icon">
            <Sparkles size={17} />
          </div>

          <span>
            Skill<span>Share</span>
          </span>
        </div>
      </header>

      {/* =========================================
          INTRO
      ========================================= */}

      <section className="my-skills-intro">
        <p className="my-skills-label">YOUR SKILLS</p>

        <h1>
          Build your
          <span> skill profile.</span>
        </h1>

        <p>Tell the community what you can teach and what you want to learn.</p>
      </section>

      {/* =========================================
          MAIN LAYOUT
      ========================================= */}

      <section className="my-skills-layout">
        {/* =====================================
            ADD SKILL
        ===================================== */}

        <div className="add-skill-card">
          <div className="card-heading">
            <div className="card-heading-icon">
              <Plus size={19} />
            </div>

            <div>
              <h2>Add a skill</h2>

              <p>Add something you teach or want to learn.</p>
            </div>
          </div>

          {error && <div className="skill-message error">{error}</div>}

          {success && <div className="skill-message success">{success}</div>}

          {/* TEACH / LEARN */}

          <div className="skill-type-selector">
            <button
              type="button"
              className={
                type === "TEACH" ? "type-option active" : "type-option"
              }
              onClick={() => {
                setType("TEACH");
                setError("");
                setSuccess("");
              }}
            >
              <GraduationCap size={18} />

              <span>I can teach</span>
            </button>

            <button
              type="button"
              className={
                type === "LEARN" ? "type-option active" : "type-option"
              }
              onClick={() => {
                setType("LEARN");
                setError("");
                setSuccess("");
              }}
            >
              <BookOpen size={18} />

              <span>I want to learn</span>
            </button>
          </div>

          {/* FORM */}

          <form onSubmit={handleAddSkill}>
            {/* SKILL */}

            <div className="skill-form-group">
              <div className="skill-label-row">
                <label htmlFor="skill">Skill</label>

                <button
                  type="button"
                  className="new-skill-link"
                  onClick={() => {
                    setShowNewSkillForm(true);
                    setError("");
                    setSuccess("");
                  }}
                >
                  + Create new skill
                </button>
              </div>

              <select
                id="skill"
                value={skillId}
                onChange={(event) => setSkillId(event.target.value)}
                disabled={loading}
              >
                <option value="">
                  {loading ? "Loading skills..." : "Select a skill"}
                </option>

                {skills.map((skill) => (
                  <option key={skill._id} value={skill._id}>
                    {skill.name}
                  </option>
                ))}
              </select>
            </div>

            {/* LEVEL */}

            <div className="skill-form-group">
              <label htmlFor="level">Your level</label>

              <select
                id="level"
                value={level}
                onChange={(event) => setLevel(event.target.value)}
              >
                <option value="BEGINNER">Beginner</option>

                <option value="INTERMEDIATE">Intermediate</option>

                <option value="ADVANCED">Advanced</option>

                <option value="EXPERT">Expert</option>
              </select>
            </div>

            {/* DESCRIPTION */}

            <div className="skill-form-group">
              <label htmlFor="description">
                Description
                <span>Optional</span>
              </label>

              <textarea
                id="description"
                placeholder={
                  type === "TEACH"
                    ? "What can you teach?"
                    : "What do you want to learn?"
                }
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows="4"
              />
            </div>

            {/* ADD */}

            <button
              type="submit"
              className="add-skill-button"
              disabled={saving || loading || !skillId}
            >
              <Plus size={18} />

              {saving ? "Adding..." : "Add skill"}
            </button>
          </form>
        </div>

        {/* =====================================
            RIGHT SIDE
        ===================================== */}

        <div className="current-skills">
          {/* TEACH */}

          <div className="skill-list-section">
            <div className="skill-list-heading">
              <div>
                <p className="list-label">SHARING KNOWLEDGE</p>

                <h2>Skills I can teach</h2>
              </div>

              <span>{teachingSkills.length}</span>
            </div>

            {loading ? (
              <div className="empty-skills">Loading your skills...</div>
            ) : teachingSkills.length === 0 ? (
              <div className="empty-skills">
                <GraduationCap size={25} />

                <p>You haven't added any teaching skills yet.</p>
              </div>
            ) : (
              <div className="skill-list">
                {teachingSkills.map((userSkill) => (
                  <div className="user-skill-card" key={userSkill._id}>
                    <div className="user-skill-icon teach">
                      <GraduationCap size={19} />
                    </div>

                    <div className="user-skill-info">
                      <h3>{getSkillName(userSkill)}</h3>

                      <p>{getSkillCategory(userSkill)}</p>
                    </div>

                    <div className="skill-card-actions">
                      <span className="skill-level">{userSkill.level}</span>

                      <button
                        type="button"
                        className="skill-action-button edit-skill-button"
                        onClick={() => handleStartEdit(userSkill)}
                        aria-label={`Edit ${getSkillName(userSkill)}`}
                        title="Edit skill"
                        disabled={!!deletingSkillId || updatingSkill}
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        className="skill-action-button delete-skill-button"
                        onClick={() => handleDeleteSkill(userSkill)}
                        aria-label={`Delete ${getSkillName(userSkill)}`}
                        title="Delete skill"
                        disabled={!!deletingSkillId || updatingSkill}
                      >
                        {deletingSkillId === userSkill._id ? (
                          <LoaderCircle
                            size={15}
                            className="skill-action-spinner"
                          />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LEARN */}

          <div className="skill-list-section">
            <div className="skill-list-heading">
              <div>
                <p className="list-label">KEEP LEARNING</p>

                <h2>Skills I want to learn</h2>
              </div>

              <span>{learningSkills.length}</span>
            </div>

            {loading ? (
              <div className="empty-skills">Loading your skills...</div>
            ) : learningSkills.length === 0 ? (
              <div className="empty-skills">
                <BookOpen size={25} />

                <p>You haven't added any learning skills yet.</p>
              </div>
            ) : (
              <div className="skill-list">
                {learningSkills.map((userSkill) => (
                  <div className="user-skill-card" key={userSkill._id}>
                    <div className="user-skill-icon learn">
                      <BookOpen size={19} />
                    </div>

                    <div className="user-skill-info">
                      <h3>{getSkillName(userSkill)}</h3>

                      <p>{getSkillCategory(userSkill)}</p>
                    </div>

                    <div className="skill-card-actions">
                      <span className="skill-level">{userSkill.level}</span>

                      <button
                        type="button"
                        className="skill-action-button edit-skill-button"
                        onClick={() => handleStartEdit(userSkill)}
                        aria-label={`Edit ${getSkillName(userSkill)}`}
                        title="Edit skill"
                        disabled={!!deletingSkillId || updatingSkill}
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        className="skill-action-button delete-skill-button"
                        onClick={() => handleDeleteSkill(userSkill)}
                        aria-label={`Delete ${getSkillName(userSkill)}`}
                        title="Delete skill"
                        disabled={!!deletingSkillId || updatingSkill}
                      >
                        {deletingSkillId === userSkill._id ? (
                          <LoaderCircle
                            size={15}
                            className="skill-action-spinner"
                          />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================
          CREATE NEW SKILL MODAL
      ========================================= */}

      {showNewSkillForm && (
        <div className="new-skill-overlay">
          <div className="new-skill-modal">
            <button
              type="button"
              className="close-modal-button"
              onClick={() => setShowNewSkillForm(false)}
            >
              <X size={18} />
            </button>

            <div className="new-skill-heading">
              <div className="new-skill-icon">
                <Plus size={20} />
              </div>

              <div>
                <p>ADD SOMETHING NEW</p>

                <h2>Create a skill</h2>
              </div>
            </div>

            <p className="new-skill-description">
              Can't find the skill you're looking for? Create it and share it
              with the SkillShare community.
            </p>

            <form onSubmit={handleCreateSkill}>
              <div className="skill-form-group">
                <label htmlFor="newSkillName">Skill name</label>

                <input
                  id="newSkillName"
                  type="text"
                  placeholder="e.g. 3D Printing"
                  value={newSkillName}
                  onChange={(event) => setNewSkillName(event.target.value)}
                  autoFocus
                />
              </div>

              <div className="skill-form-group">
                <label htmlFor="newSkillCategory">Category</label>

                <input
                  id="newSkillCategory"
                  type="text"
                  placeholder="e.g. Technology"
                  value={newSkillCategory}
                  onChange={(event) => setNewSkillCategory(event.target.value)}
                />
              </div>

              <div className="skill-form-group">
                <label htmlFor="newSkillDescription">
                  Description
                  <span>Optional</span>
                </label>

                <textarea
                  id="newSkillDescription"
                  placeholder="Briefly describe this skill..."
                  value={newSkillDescription}
                  onChange={(event) =>
                    setNewSkillDescription(event.target.value)
                  }
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowNewSkillForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="create-skill-button"
                  disabled={creatingSkill}
                >
                  {creatingSkill ? "Creating..." : "Create skill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default MySkills;
