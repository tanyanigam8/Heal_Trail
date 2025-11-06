import React from "react";
import animatedBox from "../products/animated-box.jpg";
export default function AnimatedBoxes({ onOpenAuth }) {
  return (
    <section className="w-full pt-2 pb-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-6">
        {/* LEFT CARD */}
        <div className="rounded-2xl bg-white/90 text-gray-900 shadow-lg ring-1 ring-black/5 p-6 md:p-8 max-w-md w-full mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Work Smarter.</h2>
          <p className="text-gray-600 text-sm md:text-base">
            Increase your understanding to medical terms.
          </p>

          {/* Video */}
          <div className="mt-4 aspect-[4/5] rounded-xl overflow-hidden border border-gray-200 relative">
            <video
              src="/videos/left-box.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>

        {/* RIGHT CARD */}
        <div className="dark-card rounded-2xl bg-black text-white shadow-xl p-6 md:p-8 max-w-md w-full mx-auto relative overflow-hidden">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Let&apos;s fix confusions.
          </h2>
          <p className="text-white/70 text-sm md:text-base">
            With all your reports tracking in one app, everything clicks.
          </p>

          {/* Get Started */}
          <button
            onClick={onOpenAuth}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white text-gray-900 px-4 py-2 text-sm font-semibold hover:bg-gray-200 transition"
          >
            Get started <span aria-hidden>→</span>
          </button>

          {/* Neon block / placeholder video */}
          <div
            className="mt-4 aspect-[4/4] rounded-xl ring-1 ring-white/10"
          >
           <img
  src={animatedBox}
  alt="Animated showcase"
  className="w-full h-full object-cover object-center"
  loading="lazy"
/>
          </div>

          {/* Soft glow overlay */}
          <div
            className="pointer-events-none absolute inset-0
                       bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.18),transparent_60%)]"
          />
        </div>
      </div>
    </section>
  );
}
