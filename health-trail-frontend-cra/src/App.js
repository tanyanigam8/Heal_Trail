// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Account from "./pages/Account";
import AISolutions from "./pages/AISolutions";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Help from "./pages/Help";
import Footer from "./components/Footer";
import SimplifAIPage from "./pages/SimplifAIPage";

// Auth/Dashboard modules
import AuthForm from "./components/AuthForm";
import Dashboard from "./pages/Dashboard";
import { loadToken } from "./auth";
import { setAuth } from "./api";

function App() {
  const [token, setToken] = useState(null);
  const [userDisplay, setUserDisplay] = useState(null);

  // Load token & user display once at startup and configure auth headers globally
  useEffect(() => {
    const t = loadToken();
    setToken(t);
    setAuth(t);

    try {
      const ud = localStorage.getItem("user_display");
      if (ud) setUserDisplay(ud);
    } catch {
      // ignore localStorage errors
    }
  }, []);

  // central onLogin callback passed down to Login/AuthForm
  const handleOnLogin = (newToken, newUserDisplay) => {
    // set token + global auth header
    setToken(newToken);
    setAuth(newToken);

    // persist & set display name
    try {
      if (newToken) localStorage.setItem("token", newToken);
      if (newUserDisplay) localStorage.setItem("user_display", newUserDisplay);
    } catch {
      // ignore storage set errors
    }
    if (newUserDisplay) setUserDisplay(newUserDisplay);
  };

  // central logout handler
  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_display");
    } catch {
      // ignore
    }
    setToken(null);
    setUserDisplay(null);
    setAuth(null);
    // navigate to landing page
    window.location.href = "/";
  };

  return (
    <Router>
      {/* Pass userDisplay and onLogout into Navbar so it can render user state */}
      <Navbar userDisplay={userDisplay} onLogout={handleLogout} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/account" element={<Account />} />
        <Route path="/aisolutions" element={<AISolutions />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />

        {/* Pass onLogin to Login page so successful login updates App state */}
        <Route
          path="/login"
          element={<Login onLogin={(tokenArg, userDisplayArg) => handleOnLogin(tokenArg, userDisplayArg)} />}
        />

        <Route path="/register" element={<Register />} />
        <Route path="/help" element={<Help />} />
        <Route path="/simplifai" element={<SimplifAIPage />} />
        <Route path="/ai/simplifai" element={<SimplifAIPage />} />

        {/* Dashboard route uses AuthForm if not logged in, otherwise Dashboard */}
        <Route
          path="/dashboard"
          element={
            !token ? (
              <AuthForm
                // AuthForm will call onLogin(access_token, userDisplay) on success (if provided)
                onLogin={(t, userDisplayFromAuth) => {
                  handleOnLogin(t, userDisplayFromAuth);
                }}
              />
            ) : (
              <Dashboard
                onLogout={() => {
                  handleLogout();
                }}
              />
            )
          }
        />
      </Routes>

      <Footer />
    </Router>
  );
}

export default App;
