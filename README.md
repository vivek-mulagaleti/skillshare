# SkillShare

### Learn together. Grow together.

A peer-to-peer learning platform where people exchange knowledge, teach what they know, and learn new skills using time-based credits.

**[Live Demo](https://skillshare-nine-inky.vercel.app)** · **[GitHub Repository](https://github.com/vivek-mulagaleti/skillshare)**

---

## Overview

SkillShare makes learning collaborative. Members can showcase skills, discover people to learn from, arrange learning sessions, and earn or spend time credits through teaching and learning.

The idea is simple: **everyone has a skill worth sharing.**

## Features

| Feature | Description |
|---|---|
| Authentication | Register and log in with email and password |
| Google Sign-In | Authenticate using Google OAuth 2.0 |
| Profiles | View and manage user profiles |
| Skill Management | List skills to teach and skills to learn |
| Discover | Explore skills and find potential learning matches |
| Learning Sessions | Manage peer-to-peer learning sessions |
| Time Credits | Earn credits by teaching and use them to learn |
| Ratings | Leave feedback on learning experiences |
| Notifications | Keep up with relevant activity |
| Reporting | Report concerns to support a safer community |

## Tech Stack

**Frontend:** React · Vite · React Router · Axios · Framer Motion · CSS

**Backend:** Node.js · Express · MongoDB · Mongoose · JWT · bcryptjs · Passport.js

**Deployment:** Vercel · Render · MongoDB Atlas

## How It Works

1. **Share your skills** — Add the skills you can teach and the ones you want to learn.
2. **Find your match** — Discover community members with complementary skills.
3. **Exchange time** — Teach a session to earn credits, then use credits to learn from others.

## Project Structure

```text
skillshare/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       └── services/
├── server/                 # Express API
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   └── routes/
└── README.md
```

## Run Locally

### Requirements

- Node.js and npm
- MongoDB Atlas or a local MongoDB instance
- Google OAuth credentials if you want to test Google sign-in

### 1. Clone the repository

```bash
git clone https://github.com/vivek-mulagaleti/skillshare.git
cd skillshare
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create `server/.env` and add the variables your backend configuration expects:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

Check `server/config/db.js` to confirm the exact MongoDB environment variable name used by your project.

Start the backend:

```bash
npm run dev
```

### 3. Configure the frontend

Open a second terminal:

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Environment & Deployment

For production deployment:

- **Vercel:** Set `VITE_API_URL` to your Render backend URL ending in `/api`.
- **Render:** Configure `JWT_SECRET`, your MongoDB connection string, Google OAuth credentials, `GOOGLE_CALLBACK_URL`, and `CLIENT_URL`.
- **Google Cloud Console:** Add the exact production callback URL to **Authorized redirect URIs**.
- **MongoDB Atlas:** Restrict Network Access to the backend's required outbound IP addresses where possible.

Never commit `.env` files, database credentials, JWT secrets, or Google client secrets. Variables prefixed with `VITE_` are exposed to the browser and must not contain secrets.

## Security Notes

- Use HTTPS for production traffic and OAuth callbacks.
- Restrict CORS to trusted frontend origins.
- Use a strong, unique JWT secret.
- Keep database access limited to the backend and required network addresses.
- Never publish authentication tokens or secrets in screenshots, logs, or issues.

## Roadmap

- [ ] Add automated tests for core workflows
- [ ] Document API endpoints
- [ ] Improve accessibility and loading/error states
- [ ] Add pagination and advanced discovery filters

## Contributing

Suggestions and bug reports are welcome. Open an issue with clear reproduction steps, and remove any personal information or credentials before sharing logs.

## License

No license has been added yet. Add a `LICENSE` file if you plan to distribute this project as open source.

---

<p align="center">
  <b>Teach a skill. Learn a skill. Make every hour count.</b>
</p>
