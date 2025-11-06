// src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, Eye, EyeOff } from "lucide-react";
import axios from "axios";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: "",
    fullName: "",
    email: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (!pwd) return { score: 0, label: "Empty", color: "bg-gray-300" };
    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    let label = "Very Weak", color = "bg-red-400";
    if (score === 1) { label = "Weak"; color = "bg-rose-400"; }
    if (score === 2) { label = "Fair"; color = "bg-amber-400"; }
    if (score === 3) { label = "Good"; color = "bg-lime-400"; }
    if (score === 4) { label = "Strong"; color = "bg-emerald-400"; }
    return { score, label, color };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "password" || name === "confirmPassword") {
        const pwd = name === "password" ? value : prev.password;
        const confirm = name === "confirmPassword" ? value : prev.confirmPassword;
        if (pwd && pwd.length > 0 && pwd.length < 6) {
          setPasswordError("Password must be at least 6 characters.");
        } else if (pwd && confirm && pwd !== confirm) {
          setPasswordError("Passwords do not match.");
        } else {
          setPasswordError("");
        }
      }

      return next;
    });
  };

  const formatServerError = (maybeErr) => {
    if (!maybeErr) return "Unknown error";
    if (typeof maybeErr === "string") return maybeErr;
    if (Array.isArray(maybeErr)) {
      return maybeErr
        .map((it) => {
          if (typeof it === "string") return it;
          if (it.msg) {
            try {
              const loc = it.loc && Array.isArray(it.loc) ? it.loc.join(".") : null;
              return loc ? `${loc}: ${it.msg}` : it.msg;
            } catch {
              return it.msg;
            }
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
    setServerError("");

    if (!formData.password || formData.password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    // Build payload to match backend Pydantic model:
    // backend expects { username, email, password }
    const payload = {
      username: formData.fullName?.trim(), // map fullName -> username
      email: formData.email?.trim(),
      password: formData.password,
      // optional: you can include extra fields if backend accepts them
      // e.g. mobile: formData.mobile
    };

    // Validate locally that required keys exist before sending:
    if (!payload.username) {
      setServerError("Please enter your full name (used as username).");
      return;
    }
    if (!payload.email) {
      setServerError("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/auth/register", payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.status >= 200 && res.status < 300) {
        alert("Registration successful! Please login.");
        navigate("/login");
      } else {
        setServerError("Registration failed. Please try again.");
      }
    } catch (err) {
      const serverData = err?.response?.data;
      const msg =
        (serverData && formatServerError(serverData)) ||
        err?.message ||
        "Network or server error — please check backend.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(formData.password);

  const isSubmitDisabled =
    !formData.fullName ||
    !formData.email ||
    !formData.password ||
    formData.password.length < 6 ||
    formData.password !== formData.confirmPassword ||
    loading;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-300 via-blue-300 to-purple-400">
      <div className="flex justify-between items-center px-8 py-4">
        <div className="flex items-center gap-2">
          <p className="text-white/90">Already have an account?</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg border border-white/30 hover:bg-white/30 transition"
          >
            Login
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center flex-grow px-4">
        <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/30">
          <h2 className="text-2xl font-bold text-center text-white mb-2">
            Create Your Account
          </h2>
          <p className="text-center text-white/80 mb-6">
            Fill in your details to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="id"
              placeholder="ID"
              value={formData.id}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/70 focus:outline-none"
            />
            <input
              type="text"
              name="fullName"
              placeholder="Full Name *"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/70 focus:outline-none"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/70 focus:outline-none"
            />
            <input
              type="tel"
              name="mobile"
              placeholder="Mobile Number"
              value={formData.mobile}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/70 focus:outline-none"
            />
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/70 focus:outline-none"
            />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/70 focus:outline-none"
            />
            <input
              type="text"
              name="state"
              placeholder="State"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/70 focus:outline-none"
            />
            <input
              type="text"
              name="pincode"
              placeholder="Pincode"
              value={formData.pincode}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/70 focus:outline-none"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password (min 6 chars)"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/70 focus:outline-none pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5 text-white/90" /> : <Eye className="w-5 h-5 text-white/90" />}
              </button>
            </div>

            <div className="mt-2">
              <div className="flex gap-2 items-center">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded ${i < strength.score ? strength.color : "bg-white/30"}`}
                    aria-hidden
                  />
                ))}
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-white/80">
                <span>{strength.label}</span>
                <span className="italic">{formData.password ? `${formData.password.length} chars` : ""}</span>
              </div>
            </div>

            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/70 focus:outline-none pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded"
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirm ? <EyeOff className="w-5 h-5 text-white/90" /> : <Eye className="w-5 h-5 text-white/90" />}
              </button>
            </div>

            {passwordError ? (
              <p className="text-sm text-red-300">{passwordError}</p>
            ) : formData.password && formData.confirmPassword && formData.password === formData.confirmPassword ? (
              <p className="text-sm text-green-200">Passwords match</p>
            ) : null}

            {serverError && <p className="text-sm text-red-300">{serverError}</p>}

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`w-full py-2 rounded-lg font-semibold transition ${
                isSubmitDisabled
                  ? "bg-slate-700/60 text-white cursor-not-allowed"
                  : "bg-slate-900 text-white hover:opacity-90"
              }`}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

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
