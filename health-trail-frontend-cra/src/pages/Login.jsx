// src/pages/Login.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { HelpCircle } from "lucide-react"; // Lucide icon for circle+?

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-300 via-blue-300 to-purple-400">
      {/* Center area */}
      <div className="flex flex-col items-center justify-center flex-grow">
        <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-xl w-[400px] border border-white/30">
          <h2 className="text-2xl font-bold text-center text-white mb-2">
            Login to Your Account
          </h2>
          <p className="text-center text-white/80 mb-6">
            Access your health reports and summaries
          </p>

          {/* Auth form */}
          <AuthForm mode="login" />

          {/* Help button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={() => navigate("/help")}
              className="w-14 h-14 flex flex-col items-center justify-center 
                         bg-white/20 backdrop-blur-md rounded-lg border border-white/30 
                         hover:bg-white/40 transition"
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
