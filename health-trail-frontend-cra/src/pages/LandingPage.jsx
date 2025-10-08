import { useState } from "react";
import AuthForm from "../components/AuthForm";

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-green-50 via-white to-green-100 relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Decorative SVG blob */}
      <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse z-0"></div>

      <div className="relative z-10 w-full max-w-md bg-white bg-opacity-90 backdrop-blur-lg shadow-2xl rounded-2xl px-8 py-10">
        {/* Logo & Title */}
        <div className="text-center mb-6">
          <span className="text-5xl">📋</span>
          <h1 className="text-3xl font-bold text-green-700 mt-2">Health Trail</h1>
          <p className="text-gray-600 text-sm">Your smart health summary generator</p>
        </div>

        {/* Toggle Buttons */}
        <div className="flex justify-between mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setIsLogin(true)}
            className={`w-1/2 py-2 rounded-lg transition-all duration-300 ${
              isLogin
                ? "bg-green-600 text-white shadow-md"
                : "text-gray-600 hover:bg-green-50"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`w-1/2 py-2 rounded-lg transition-all duration-300 ${
              !isLogin
                ? "bg-green-600 text-white shadow-md"
                : "text-gray-600 hover:bg-green-50"
            }`}
          >
            Register
          </button>
        </div>

        {/* Auth Form */}
        <AuthForm isLogin={isLogin} />
      </div>
    </div>
  );
}
