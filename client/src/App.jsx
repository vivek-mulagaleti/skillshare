
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import MySkills from "./pages/MySkills/MySkills";
import Discover from "./pages/Discover/Discover";
import Profile from "./pages/Profile/Profile";
import MySessions from "./pages/MySessions/MySessions";
import Notifications from "./pages/Notifications/Notifications";
import EditProfile from "./pages/Profile/EditProfile";
import NotFound from "./pages/NotFound";
import GoogleCallback from "./pages/GoogleCallback";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-skills" element={<MySkills />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/my-sessions" element={<MySessions />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="*" element={<NotFound />} />
        <Route
  path="/auth/google/callback"
  element={<GoogleCallback />}
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
