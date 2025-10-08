// src/pages/Help.jsx
import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Help() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl max-w-2xl w-full p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Need Help?</h1>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 transition"
          >
            <ArrowLeft size={18} /> Back
          </button>
        </div>

        {/* Help Content */}
        <div className="space-y-5 text-gray-700">
          <p>
            Welcome to the <span className="font-semibold">Help Center</span>.
            Here you can find quick guidance for using our platform.
          </p>

          <ul className="list-disc list-inside space-y-2">
            <li>
              <span className="font-semibold">Login Issues:</span> If you forgot
              your password, click <em>“Forgot Password”</em> on the login page.
            </li>
            <li>
              <span className="font-semibold">Creating an Account:</span> Use
              your email and a strong password when registering.
            </li>
            <li>
              <span className="font-semibold">Data Privacy:</span> All your
              reports and summaries are securely stored.
            </li>
            <li>
              <span className="font-semibold">Need More Help?</span> Reach out
              to us at{" "}
              <a
                href="mailto:support@healthtrail.com"
                className="text-indigo-600 hover:underline"
              >
                support@healthtrail.com
              </a>
              .
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} HealTrail. All rights reserved.
        </div>
      </div>
    </div>
  );
}
