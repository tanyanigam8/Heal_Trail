// src/components/AuthForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

/**
 * Props:
 * - mode: "login" | "register"   // preferred
 * - isLogin: boolean             // legacy support
 * - onSuccessPath: string        // where to go after login (default: "/account")
 * - containerClassName: string   // optional wrapper class override
 */
export default function AuthForm({
  mode,
  isLogin: isLoginProp,
  onSuccessPath = "/account",
  containerClassName = "p-4 bg-white rounded shadow-md",
}) {
  // Derive final mode:
  // 1) If `mode` prop is provided, use it.
  // 2) Else fall back to legacy boolean `isLogin`.
  // 3) Default to "login" if neither provided.
  const derivedIsLogin =
    typeof mode === "string"
      ? mode === "login"
      : typeof isLoginProp === "boolean"
      ? isLoginProp
      : true;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If parent switches route (/login <-> /register), clear errors/fields
  useEffect(() => {
    setError("");
    setPassword("");
    // Keep username when switching? Usually safe to keep; clear email only for register mode
    if (derivedIsLogin) {
      setEmail("");
    }
  }, [derivedIsLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const endpoint = derivedIsLogin ? "/auth/login" : "/auth/register";
    const payload = derivedIsLogin
      ? { username, password }
      : { email, password, username };

    try {
      const { data } = await axios.post(
        `http://localhost:8000${endpoint}`,
        payload
      );

      if (derivedIsLogin) {
        const { access_token, user_id } = data || {};
        if (!access_token) {
          throw new Error("No access token received.");
        }

        localStorage.setItem("token", access_token);
        if (user_id !== undefined && user_id !== null) {
          localStorage.setItem("user_id", String(user_id));
        }

        // Navigate to the desired page after successful login
        window.location.href = onSuccessPath; // default: "/account"
      } else {
        // Registration successful → send user to login page
        alert("Registration successful! Please login.");
        window.location.href = "/login";
      }
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={containerClassName}>
      <h2 className="text-xl font-bold mb-4">
        {derivedIsLogin ? "Login" : "Register"}
      </h2>

      <form onSubmit={handleSubmit}>
        {error && (
          <p className="text-red-500 text-sm mb-3 font-medium">{error}</p>
        )}

        <input
          type="text"
          placeholder="Username"
          className="mb-2 p-2 border w-full rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        {!derivedIsLogin && (
          <input
            type="email"
            placeholder="Email"
            className="mb-2 p-2 border w-full rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}

        <input
          type="password"
          placeholder="Password"
          className="mb-3 p-2 border w-full rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className={`bg-green-600 text-white px-4 py-2 rounded w-full ${
            submitting ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {submitting
            ? derivedIsLogin
              ? "Logging in..."
              : "Registering..."
            : derivedIsLogin
            ? "Login"
            : "Register"}
        </button>
      </form>
    </div>
  );
}
