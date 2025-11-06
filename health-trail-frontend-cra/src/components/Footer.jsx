// src/components/Footer.jsx
import React from "react";
import { FaFacebookF, FaYoutube, FaLinkedinIn, FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="relative bg-white text-[#0f172a] py-12 border-t border-slate-200">
      <div className="container mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Left section */}
        <div>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="HealTrail Logo" className="h-10" />
            <span className="text-xl font-bold">HealTrail</span>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            An Innovation of{" "}
            <a
              href="https://setukrite.com"
              className="text-indigo-600 font-semibold hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Setukrite Technologies
            </a>
          </p>
          <p className="mt-2 text-sm text-slate-600">Email: info@healtrail.com</p>

          {/* Social links */}
          <div className="mt-4 flex gap-4 text-xl text-slate-700">
            <a
              href="https://www.facebook.com/learntrail"
              className="hover:text-indigo-600"
              target="_blank"
              rel="noreferrer"
            >
              <FaFacebookF />
            </a>
            <a
              href="https://www.youtube.com/@learntrail"
              className="hover:text-indigo-600"
              target="_blank"
              rel="noreferrer"
            >
              <FaYoutube />
            </a>
            <a
              href="http://linkedin.com/company/thelearntrail/"
              className="hover:text-indigo-600"
              target="_blank"
              rel="noreferrer"
            >
              <FaLinkedinIn />
            </a>
            <a
              href="https://www.instagram.com/learntrail/"
              className="hover:text-indigo-600"
              target="_blank"
              rel="noreferrer"
            >
              <FaInstagram />
            </a>
          </div>
        </div>

        {/* Middle section */}
        <div className="flex flex-col gap-2 text-sm md:items-center">
          <a href="#" className="hover:underline">
            Become a Partner
          </a>
          <a href="#" className="hover:underline">
            Privacy Policy
          </a>
          <a href="#" className="hover:underline">
            Terms of Use
          </a>
        </div>

        {/* Right section */}
        <div>
          <h4 className="font-semibold mb-2">Download HealTrail</h4>
          <div className="flex flex-col gap-3">
            {/* Google Play */}
            <a
              href="https://play.google.com/store/apps/details?id=com.setukrite.heal_trail"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="/google-play.avif"
                alt="Get it on Google Play"
                className="h-12"
              />
            </a>

            {/* App Store */}
            <a
              href="https://apps.apple.com/in/app/example-healtrail/id123456789"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="/app-store.avif"
                alt="Download on the App Store"
                className="h-12"
              />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom text */}
      <div className="mt-10 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} HealTrail. Powered by{" "}
        <a
          href="https://setukrite.com"
          className="text-indigo-600 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Setukrite
        </a>
      </div>
    </footer>
  );
}
