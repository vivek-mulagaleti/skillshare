
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import MySkills from "./pages/MySkills/MySkills";
import Discover from "./pages/Discover/Discover";
import Profile from "./pages/Profile/Profile";
import MySessions from "./pages/MySessions/MySessions";

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
