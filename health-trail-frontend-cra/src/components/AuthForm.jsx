// src/components/AuthForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/**
 * Props:
 * - mode: "login" | "register"
 * - onSuccessPath: default "/" (landing)
 * - onLogin: optional callback(access_token, user_display)
 * - allowEmailLogin: boolean
 */
export default function AuthForm({
  mode,
  isLogin: isLoginProp,
  onSuccessPath = "/",
  onLogin,
  allowEmailLogin = false,
  containerClassName = "p-4 bg-white rounded shadow-md",
}) {
  const navigate = useNavigate();

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

  useEffect(() => {
    setError("");
    setPassword("");
    if (derivedIsLogin && !allowEmailLogin) setEmail("");
    if (!derivedIsLogin) {
      setEmail("");
      setUsername("");
      setPassword("");
    }
  }, [derivedIsLogin, allowEmailLogin]);

  const formatServerError = (maybeErr) => {
    if (!maybeErr) return "Unknown error";
    if (typeof maybeErr === "string") return maybeErr;
    if (Array.isArray(maybeErr)) {
      return maybeErr
        .map((it) => {
          if (typeof it === "string") return it;
          if (it.msg) {
            const loc = Array.isArray(it.loc) ? it.loc.join(".") : "";
            return loc ? `${loc}: ${it.msg}` : it.msg;
          }
          return JSON.stringify(it);
        })
        .join(" / ");
    }
    if (maybeErr.detail) return formatServerError(maybeErr.detail);
    if (maybeErr.message) return maybeErr.message;
    if (maybeErr.error) return maybeErr.error;
    try {
      return JSON.stringify(maybeErr);
    } catch {
      return String(maybeErr);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const endpoint = derivedIsLogin ? "/auth/login" : "/auth/register";
    let payload;

    if (derivedIsLogin) {
      if (allowEmailLogin) {
        if (!email || !email.trim()) {
          setError("Please enter your email.");
          setSubmitting(false);
          return;
        }
        payload = { email: email.trim(), password };
      } else {
        if (!username || !username.trim()) {
          setError("Please enter your username.");
          setSubmitting(false);
          return;
        }
        payload = { username: username.trim(), password };
      }
    } else {
      if (!username || !username.trim()) {
        setError("Please enter a username (Full Name).");
        setSubmitting(false);
        return;
      }
      if (!email || !email.trim()) {
        setError("Please enter an email.");
        setSubmitting(false);
        return;
      }
      payload = { username: username.trim(), email: email.trim(), password };
    }

    try {
      const { data } = await axios.post(`http://localhost:8000${endpoint}`, payload);

      if (derivedIsLogin) {
        const { access_token, user_id } = data || {};
        if (!access_token) throw new Error("No access token received.");

        // build a display name: prefer username (if used), else email, else "User"
        const userDisplay =
          (payload.username && payload.username.trim()) ||
          (payload.email && payload.email.trim()) ||
          "User";

        // Persist token, user id and display name
        try {
          localStorage.setItem("token", access_token);
          if (user_id !== undefined && user_id !== null) {
            localStorage.setItem("user_id", String(user_id));
          }
          localStorage.setItem("user_display", userDisplay);
        } catch (err) {
          // ignore storage errors
          // eslint-disable-next-line no-console
          console.warn("storage error:", err);
        }

        // notify parent (App) to update in-memory state if provided
        if (typeof onLogin === "function") {
          try {
            onLogin(access_token, userDisplay);
          } catch (cbErr) {
            // do not crash if callback fails
            // eslint-disable-next-line no-console
            console.warn("onLogin callback error:", cbErr);
          }
        }

        // Navigate inside SPA to landing page (default "/")
        navigate(onSuccessPath || "/");
      } else {
        alert("Registration successful! Please login.");
        navigate("/login");
      }
    } catch (err) {
      const serverData = err?.response?.data;
      const msg =
        (serverData && formatServerError(serverData)) || err?.message || "Network or server error — check backend";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={containerClassName}>
      <h2 className="text-xl font-bold mb-4">{derivedIsLogin ? "Login" : "Register"}</h2>

      <form onSubmit={handleSubmit}>
        {error && <p className="text-red-500 text-sm mb-3 font-medium">{String(error)}</p>}

        {derivedIsLogin ? (
          allowEmailLogin ? (
            <input
              type="email"
              placeholder="Email"
              className="mb-2 p-2 border w-full rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          ) : (
            <input
              type="text"
              placeholder="Username"
              className="mb-2 p-2 border w-full rounded"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )
        ) : (
          <>
            <input
              type="text"
              placeholder="Username (Full Name)"
              className="mb-2 p-2 border w-full rounded"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="mb-2 p-2 border w-full rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </>
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
          className={`bg-green-600 text-white px-4 py-2 rounded w-full ${submitting ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {submitting ? (derivedIsLogin ? "Logging in..." : "Registering...") : derivedIsLogin ? "Login" : "Register"}
        </button>
      </form>
    </div>
  );
}
