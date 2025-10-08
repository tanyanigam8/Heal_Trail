// src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle } from "lucide-react";

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
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data:", formData);
    // 🔥 You can connect this to backend later
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-300 via-blue-300 to-purple-400">
      {/* Top bar */}
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

      {/* Center area */}
      <div className="flex flex-col items-center justify-center flex-grow">
        <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-xl w-[400px] border border-white/30">
          <h2 className="text-2xl font-bold text-center text-white mb-2">
            Create Your Account
          </h2>
          <p className="text-center text-white/80 mb-6">
            Fill in your details to get started
          </p>

          {/* Registration Form */}
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

            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Register
            </button>
          </form>

          {/* Help button */}
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
