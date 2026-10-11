
SkillShare — Learn Together. Grow Together. 🚀
<p align="center"> <strong>A community-powered skill exchange platform where everyone has something to teach and something to learn.</strong> </p> <p align="center"> <a href="https://skillshare-nine-inky.vercel.app">Live Demo</a> • <a href="#-features">Features</a> • <a href="#-tech-stack">Tech Stack</a> • <a href="#-getting-started">Getting Started</a> • <a href="#-environment-variables">Environment Variables</a> </p>
🌟 About SkillShare
SkillShare is a full-stack web application built around one simple idea: share what you know, learn what you don't, and exchange time instead of money.

Members can showcase skills, discover people to learn from, arrange learning sessions, and earn or spend time credits as they teach and learn. The goal is to make skill development more accessible through peer-to-peer learning and community collaboration.

✨ Features
🔐 Authentication — Register and log in with email and password.
🌐 Google OAuth — Sign in using a Google account.
👤 User Profiles — View and manage profile information.
🧠 Skill Management — Add and manage skills you can teach or want to learn.
🔎 Discover Skills — Explore skills and find potential learning matches.
🤝 Learning Sessions — Create and manage peer-to-peer learning sessions.
⏳ Time Credits — Earn credits by teaching and use them to learn from others.
⭐ Ratings — Share feedback after learning experiences.
🔔 Notifications — Keep track of relevant activity.
🛡️ Reports — Support community safety by reporting issues.
📱 Responsive UI — A modern interface designed for convenient use across screen sizes.
Feature availability may depend on the current deployment and configuration.

🖥️ Live Demo
Frontend: SkillShare on Vercel

The application uses a deployed frontend, an API backend, and a cloud-hosted database. Some features—especially Google sign-in—require the production OAuth configuration to be correct.

🧰 Tech Stack
Frontend
React
Vite
React Router
Axios
Framer Motion
CSS
Backend
Node.js
Express
MongoDB with Mongoose
JSON Web Tokens (JWT)
bcryptjs
Passport.js and Google OAuth 2.0
Helmet
CORS
Deployment & Services
Vercel — Frontend hosting
Render — Backend hosting
MongoDB Atlas — Cloud database
Google Cloud Console — OAuth credentials
🏗️ Architecture
Browser
   │
   ▼
React + Vite frontend (Vercel)
   │  HTTP requests + JWT
   ▼
Express REST API (Render)
   │
   ▼
MongoDB Atlas

Google OAuth ──► Express callback ──► Frontend callback route
📁 Project Structure
skillshare/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── index.html
│   ├── package.json
│   └── vercel.json
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── package.json
│   └── server.js
└── README.md
Folder names may differ slightly as the project evolves.

🚀 Getting Started
Prerequisites
Node.js (an active LTS version is recommended)
npm
A MongoDB Atlas database or local MongoDB instance
A Google OAuth client if you want to test Google sign-in locally
1. Clone the repository
git clone https://github.com/vivek-mulagaleti/skillshare.git
cd skillshare
2. Install frontend dependencies
cd client
npm install
Create client/.env:

VITE_API_URL=http://localhost:5000/api
3. Install backend dependencies
Open a second terminal from the project root:

cd server
npm install
Create server/.env using the variables in the Environment Variables section.

4. Start the backend
From the server directory:

npm run dev
The backend should start on the port configured by the server (commonly 5000). Check your server configuration if your local port differs.

5. Start the frontend
From the client directory in the first terminal:

npm run dev
Open the local URL printed by Vite, typically:

http://localhost:5173
🔑 Environment Variables
Never commit real secrets to GitHub. Keep .env files out of version control and configure production secrets in Render/Vercel settings.

Frontend — client/.env
Variable	Example	Purpose
VITE_API_URL	http://localhost:5000/api	Base URL of the API, including /api
Vite exposes variables prefixed with VITE_ to browser code. Never put secrets in frontend environment variables.

Backend — server/.env
Variable	Example	Purpose
PORT	5000	Local server port, if supported by the server configuration
NODE_ENV	development	Runtime environment
MONGO_URI	mongodb+srv://<user>:<password>@<cluster>/<database>	MongoDB connection string; use the exact variable name expected by your DB config
JWT_SECRET	<long-random-secret>	Secret used to sign authentication tokens; use a strong, unique value
CLIENT_URL	http://localhost:5173	Allowed frontend origin; production should use the exact deployed Vercel origin
GOOGLE_CLIENT_ID	<google-oauth-client-id>	Google OAuth client ID
GOOGLE_CLIENT_SECRET	<google-oauth-client-secret>	Google OAuth client secret
GOOGLE_CALLBACK_URL	http://localhost:5000/api/auth/google/callback	OAuth callback URL; production must use the exact Render callback URL
Check server/config/db.js and your Passport configuration to confirm the exact database variable name and OAuth variable names before starting.

For production:

Set VITE_API_URL in Vercel to your Render API URL ending in /api.
Set CLIENT_URL in Render to your exact Vercel frontend origin, without a trailing slash.
Register the production Google callback URL in Google Cloud Console under Authorized redirect URIs.
Configure MongoDB Atlas Network Access to allow only the required backend outbound IP addresses where possible.
🧪 Build for Production
From the frontend directory:

npm run build
Vite generates the production build in client/dist.

To preview the production build locally, use the preview script if your client/package.json defines one:

npm run preview
🔒 Security Notes
Keep credentials and .env files out of source control.
Use a strong JWT_SECRET of sufficient length and never reuse a public example.
Restrict production CORS to trusted frontend origins.
Use HTTPS for deployed frontend, backend, and OAuth callback URLs.
Keep MongoDB Atlas network access restricted to necessary addresses.
Validate and authorize protected API operations on the server.
Never share authentication tokens or paste them into public issue reports.
🗺️ Roadmap
Add automated tests for authentication, skills, and session workflows.
Improve API documentation with endpoint examples.
Add pagination and filtering for large skill lists.
Improve accessibility and loading/error states.
Add monitoring and structured production logging.
Continue refining mobile and responsive experiences.
🤝 Contributing
Contributions, ideas, and bug reports are welcome.

Fork the repository.
Create a branch: git checkout -b feature/your-feature.
Make your changes and test them locally.
Commit: git commit -m "Add your feature".
Push the branch and open a Pull Request.
For bugs, include clear reproduction steps and remove personal data, credentials, and tokens from logs or screenshots.

📄 License
No license has been specified yet. If you intend to make this project open source, add a LICENSE file and update this section with the chosen license.

<p align="center"> <strong>Teach a skill. Learn a skill. Make every hour count. 💜</strong> </p>
⋮⋮⋮⋮⋮⋮⋮⋮⋮⋮⋮⋮