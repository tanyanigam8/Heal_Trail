// src/components/Navbar.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Home.css"; // for .pill-gradient (already used in Home)

const navItems = [
  { label: "Home", path: "/" },

  // Products -> external
  {
    label: "Products",
    subItems: [
      { label: "AppointmentPanel", url: "https://www.healtrail.com/appointment" },
      { label: "QueueTrail", url: "https://www.healtrail.com/qTrail" },
      { label: "LabPanel", url: "https://www.healtrail.com/labpanel" },
      { label: "DoctorPanel", url: "https://www.healtrail.com/doctorPanel" },
      { label: "GymPanel", url: "https://www.healtrail.com/gympanel" },
      { label: "YogaPanel", url: "https://www.healtrail.com/yogapanel" },
      { label: "PharmacyPanel", url: "https://www.healtrail.com/pharmapanel" },
    ],
  },

  // AI -> internal
  {
    label: "AI",
    subItems: [
      { label: "SimplifAI", path: "/ai/simplifai" },
      { label: "HealifAI", path: "/ai/healifai" },
    ],
  },

  { label: "Reports", path: "/reports" },
  { label: "About Us", path: "/about" },
  { label: "Subscribe", path: "/subscribe" },
];

const pill =
  "pill-gradient flex items-center gap-2 text-sm font-medium rounded-full px-4 py-2 shadow-sm";
const topBtn = (active) =>
  `flex items-center gap-1 px-3 py-2 rounded-md hover:bg-white/10 transition ${
    active ? "bg-white/20" : ""
  }`;
const panel =
  "w-72 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 p-2";
const linkItem = "block px-3 py-2 rounded-lg hover:bg-slate-100 transition";

function MenuButton({ item, idx, open, setOpen }) {
  const active = open === idx;
  const subs = item.subItems ?? [];

  const openExternal = (e, url) => {
    if (e && e.type === "mousedown" && e.button !== 0) return; // left click only
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(null);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(idx)}
      onMouseLeave={() => setOpen(null)}
    >
      <button
        type="button"
        className={topBtn(active)}
        aria-haspopup="menu"
        aria-expanded={active}
        onClick={() => setOpen(active ? null : idx)}
      >
        <span>{item.label}</span>
        <span className={`transition ${active ? "rotate-180" : ""}`}>▾</span>
      </button>

      {active && subs.length > 0 && (
        <div className="absolute left-0 top-full pt-2 z-50">
          <div role="menu" className={panel}>
            <ul className="max-h-[70vh] overflow-auto">
              {subs.map((s, i) => (
                <li key={i}>
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkItem}
                      onMouseDown={(e) => openExternal(e, s.url)}
                      onClick={() => setOpen(null)}
                    >
                      {s.label}
                    </a>
                  ) : (
                    <Link
                      to={s.path}
                      className={linkItem}
                      onClick={() => setOpen(null)}
                    >
                      {s.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const navRef = useRef(null);

  // Close menus on outside click / Esc
  useEffect(() => {
    const outside = (e) =>
      navRef.current && !navRef.current.contains(e.target) && setOpenMenu(null);
    const esc = (e) => e.key === "Escape" && setOpenMenu(null);
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  return (
    <nav
      ref={navRef}
      className="flex items-center px-10 py-6 sticky top-0 z-50 bg-white border-b border-slate-200"
    >
      {/* Logo + tagline (left) */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <img src="/logo.png" alt="HealTrail logo" className="h-10 w-auto" />
        <div className="flex flex-col leading-tight">
          <span className="text-2xl font-bold text-slate-900">HealTrail</span>
          <span className="text-sm text-slate-600">Care for Yourself!</span>
        </div>
      </div>

      {/* Center pill with all tabs */}
      <div className="flex-1 flex justify-center overflow-visible">
        <div className={`${pill} overflow-visible`}>
          {navItems.map((item, idx) =>
            item.subItems?.length ? (
              <MenuButton
                key={idx}
                item={item}
                idx={idx}
                open={openMenu}
                setOpen={setOpenMenu}
              />
            ) : (
              <Link
                key={idx}
                to={item.path}
                className="px-3 py-2 rounded-md hover:bg-white/10 transition"
              >
                {item.label}
              </Link>
            )
          )}
        </div>
      </div>

      {/* Auth (right) */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:opacity-90 transition"
        >
          Login
        </button>
        <button
          onClick={() => navigate("/register")}
          className="px-4 py-2 rounded-lg border border-slate-300 text-slate-900 font-semibold hover:bg-slate-100 transition"
        >
          Sign Up
        </button>
      </div>
    </nav>
  );
}
