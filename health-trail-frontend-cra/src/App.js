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

// Auth/Dashboard modules from your teammate's file
import AuthForm from "./components/AuthForm";
import Dashboard from "./pages/Dashboard";
import { loadToken } from "./auth";
import { setAuth } from "./api";

function App() {
  const [token, setToken] = useState(null);

  // Load token once at startup and configure auth headers globally
  useEffect(() => {
    const t = loadToken();
    setToken(t);
    setAuth(t);
  }, []);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/account" element={<Account />} />
        <Route path="/aisolutions" element={<AISolutions />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
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
                onLogin={(t) => {
                  setToken(t);
                  setAuth(t);
                }}
              />
            ) : (
              <Dashboard
                onLogout={() => {
                  setToken(null);
                  setAuth(null);
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
