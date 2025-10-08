// src/pages/SimplifAIPage.jsx
import React, { useState } from "react";
import Dashboard from "./Dashboard"; // <-- import from pages folder

/**
 * SimplifAIPage
 * -------------
 * Displays dynamic info about SimplifAI and,
 * when "Get Started" is clicked, shows the full Dashboard (report analyzer).
 */
export default function SimplifAIPage() {
  const [showDashboard, setShowDashboard] = useState(false);

  // When user clicks Get Started → show the analyzer dashboard
  if (showDashboard) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            SimplifAI — Report Analyzer
          </h1>
          <button
            onClick={() => setShowDashboard(true)}
            className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
          >
            Get Started
          </button>
        </div>

        {/* Info Content */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Info */}
            <div>
              <h2 className="text-xl font-semibold mb-3">What is SimplifAI?</h2>
              <p className="text-gray-700 mb-4">
                <strong>SimplifAI</strong> is our advanced AI-powered report analyzer.
                It reads your uploaded health reports, extracts important data,
                and generates two types of summaries:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-4">
                <li><strong>Doctor Summary:</strong> Professional insights and abnormal findings.</li>
                <li><strong>Layman Summary:</strong> Easy-to-understand version for patients.</li>
                <li>Highlights abnormal metrics with charts and visuals.</li>
                <li>Keeps track of your health progress over time.</li>
              </ul>
            </div>

            {/* Right infographic */}
            <div className="flex flex-col justify-center items-center text-center">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4 w-full">
                <div className="text-sm text-indigo-700 mb-2">How it works</div>
                <div className="text-4xl font-bold text-indigo-900">
                  Upload ➜ Analyze ➜ Summary
                </div>
                <p className="text-xs text-indigo-600 mt-1">
                  Powered by Mistral + LangChain RAG
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-xs text-gray-500">Abnormalities</div>
                  <div className="text-lg font-semibold text-red-600 mt-1">
                    Auto-detected
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-xs text-gray-500">Trends</div>
                  <div className="text-lg font-semibold text-green-600 mt-1">
                    Long-term analysis
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-xs text-gray-500">Summaries</div>
                  <div className="text-lg font-semibold text-gray-800 mt-1">
                    Doctor + Layman
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-xs text-gray-500">Downloads</div>
                  <div className="text-lg font-semibold text-gray-800 mt-1">
                    PDF Reports
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 border-t pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-sm text-gray-600">
                Ready to analyze your report?
              </div>
              <div className="text-xs text-gray-500">
                Click <strong>Get Started</strong> to open the analyzer dashboard.
              </div>
            </div>
            <div>
              <button
                onClick={() => setShowDashboard(true)}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
