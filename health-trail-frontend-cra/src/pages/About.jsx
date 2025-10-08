import React from "react";
import aboutHero from "../products/about-hero.png";

export default function AboutPage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-[#4fd3c4] to-[#6c5ce7] text-white">
      {/* HERO */}
      <section className="relative py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10">
            {/* Copy */}
            <div>
              <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#1e1b4b] shadow-sm">
                Top‑Notch Care, Just for You
              </span>
              <h1 className="mt-4 text-4xl md:text-5xl font-extrabold leading-tight">
                Your Best Health Experience Awaits
              </h1>
              <p className="mt-4 max-w-xl text-white/90 md:text-lg">
                Reminders, notifications, recommendations, and daily progress tracking — so you can
                focus on what matters most: <span className="font-semibold">Care for yourself.</span>
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button className="rounded-2xl bg-white px-5 py-3 font-semibold text-[#1e1b4b] shadow transition hover:opacity-90">
                  Explore Our Services
                </button>
                
              </div>
            </div>

            {/* Circular image */}
             <div className="relative">
              <div className="mx-auto h-72 w-72 overflow-hidden rounded-full border-8 border-white shadow-2xl md:h-80 md:w-80 bg-white">
                <img
                  src={aboutHero} // ✅ using imported image
                  alt="HealTrail Illustration"
                  className="h-full w-full object-contain p-2"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT US */}
      <section className="rounded-t-[2rem] bg-white py-16 text-[#0f172a]">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-[#1e1b4b]">
                ABOUT US
              </span>
              <h2 className="mt-3 text-3xl font-extrabold md:text-4xl">
                15 Years of Expertise in Holistic Health
              </h2>
              <p className="mt-3 text-slate-600">
                We make healthcare accessible, understandable, and proactive for everyone. Our integrated
                ecosystem brings together expert doctors, diagnostics, therapies, and AI guidance — under one umbrella.
              </p>
              <ul className="mt-4 space-y-3">
                {[
                  'Premium care you can trust',
                  'Award‑winning providers and specialists',
                  'Dedicated experts behind every smile',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#1e1b4b]"></span>
                    <span className="text-slate-700">{t}</span>
                  </li>
                ))}
              </ul>
              <button className="mt-6 rounded-xl bg-[#1e1b4b] px-5 py-3 font-semibold text-white shadow hover:opacity-90">
                Learn More
              </button>
            </div>

            <div className="relative">
              <div className="mx-auto h-80 w-80 overflow-hidden rounded-full border-8 border-white shadow-2xl ring-1 ring-black/5 md:h-96 md:w-96">
                <img src="/assets/about-tooth.jpg" alt="Holistic" className="h-full w-full object-cover" />
              </div>
              {/* floating round badge */}
              <div className="absolute -bottom-3 -right-3 flex h-16 w-16 items-center justify-center rounded-full border-8 border-white bg-white text-[#1e1b4b] shadow-xl">
                <span className="text-sm font-bold">AI</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-white py-16 text-[#0f172a]">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-[#1e1b4b]">
                OUR FEATURES
              </span>
              <h3 className="mt-2 text-2xl font-extrabold md:text-3xl">A Wide Range of Services for Better Health</h3>
            </div>
            <button className="rounded-xl bg-white px-4 py-2 font-semibold text-[#1e1b4b] ring-1 ring-[#1e1b4b]/20 hover:bg-indigo-50">
              Explore All Services
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icon: '🧭',
                title: 'Holistic Healing',
                text: 'Traditional to modern therapies covering body, mind, and spirit.',
              },
              {
                icon: '📈',
                title: 'Track Your Wellness',
                text: 'Daily records and long‑term trends to build lasting habits.',
              },
              {
                icon: '🤖',
                title: 'Personalized AI',
                text: 'Reminders, recommendations, and do’s & don’ts — just for you.',
              },
            ].map(({ icon, title, text }) => (
              <article key={title} className="group rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5 transition hover:shadow-xl">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-xl text-[#1e1b4b]">
                  {icon}
                </div>
                <h4 className="text-lg font-semibold">{title}</h4>
                <p className="mt-2 text-sm text-slate-600">{text}</p>
                <button className="mt-4 text-sm font-semibold text-[#1e1b4b] hover:underline">Learn more →</button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS / STATS */}
      <section className="bg-white py-16 text-[#0f172a]">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
            <div>
              <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-[#1e1b4b]">
                WHY CHOOSE US
              </span>
              <h3 className="mt-2 text-2xl font-extrabold md:text-3xl">
                Benefits of Our Services: Your Path to a Healthier Life
              </h3>
              <p className="mt-3 text-slate-600">
                Easy online booking, experienced providers, advanced diagnostics, and AI‑powered insights —
                everything you need in one place.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {[
                  { k: '10+', v: 'Skilled Specialists' },
                  { k: '99%', v: 'Patient Satisfaction' },
                  { k: '20K+', v: 'Appointments Booked' },
                ].map(({ k, v }) => (
                  <div key={k} className="min-w-[120px] rounded-xl bg-white p-4 text-center shadow ring-1 ring-slate-100">
                    <div className="text-2xl font-extrabold">{k}</div>
                    <div className="text-xs text-slate-500">{v}</div>
                  </div>
                ))}
              </div>

              <button className="mt-6 rounded-xl bg-[#1e1b4b] px-5 py-3 font-semibold text-white shadow hover:opacity-90">
                Book an Appointment
              </button>
            </div>

            <div className="relative">
              <div className="mx-auto h-80 w-80 overflow-hidden rounded-full border-8 border-white shadow-2xl ring-1 ring-black/5 md:h-96 md:w-96">
                <img src="/assets/about-video.jpg" alt="Video" className="h-full w-full object-cover" />
              </div>
              <button
                aria-label="Play video"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid h-16 w-16 place-items-center rounded-full bg-white text-[#1e1b4b] shadow-xl"
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="py-14 text-center">
        <div className="container mx-auto max-w-4xl px-4">
          <h4 className="text-2xl font-extrabold">Let’s make healing an everyday process</h4>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button className="rounded-2xl bg-white px-5 py-3 font-semibold text-[#1e1b4b] shadow hover:opacity-90">
              Get HealTrail on Google Play
            </button>
            <button className="rounded-2xl border border-white/80 bg-transparent px-5 py-3 font-semibold text-white transition hover:bg-white hover:text-[#1e1b4b]">
              Download on App Store
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
