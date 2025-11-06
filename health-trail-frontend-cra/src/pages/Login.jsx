// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { HelpCircle } from "lucide-react";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [useEmail, setUseEmail] = useState(false);

  // local onLogin just proxies to parent if provided
  const handleOnLogin = (token, userDisplay) => {
    try {
      if (token) localStorage.setItem("token", token);
      if (userDisplay) localStorage.setItem("user_display", userDisplay);
    } catch {}
    if (typeof onLogin === "function") {
      onLogin(token, userDisplay);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-300 via-blue-300 to-purple-400">
      <div className="flex flex-col items-center justify-center flex-grow">
        <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-xl w-[400px] border border-white/30">
          <h2 className="text-2xl font-bold text-center text-white mb-2">Login to Your Account</h2>
          <p className="text-center text-white/80 mb-4">Choose how you want to login</p>

          <div className="flex gap-2 justify-center mb-4">
            <button
              onClick={() => setUseEmail(false)}
              className={`px-3 py-1 rounded ${!useEmail ? "bg-white/30 text-white" : "bg-white/10 text-white/70"}`}
            >
              Full name
            </button>
            <button
              onClick={() => setUseEmail(true)}
              className={`px-3 py-1 rounded ${useEmail ? "bg-white/30 text-white" : "bg-white/10 text-white/70"}`}
            >
              Email
            </button>
          </div>

          <AuthForm mode="login" onLogin={handleOnLogin} allowEmailLogin={useEmail} onSuccessPath="/" />
          <div className="flex justify-center mt-6">
            <button
              onClick={() => navigate("/help")}
              className="w-14 h-14 flex flex-col items-center justify-center bg-white/20 backdrop-blur-md rounded-lg border border-white/30 hover:bg-white/40 transition"
            >
              <HelpCircle className="w-5 h-5 text-white" />
              <span className="text-[10px] text-white/80 mt-1">Help</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
