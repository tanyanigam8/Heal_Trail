import React from "react";

// BACKGROUND images
import bgAppointment from "../products/bg-appointment.png";
import bgQtrail from "../products/bg-qtrail.png";
import bgLab from "../products/bg-lab.png";
import bgDoctor from "../products/bg-doctor.png";
import bgGym from "../products/bg-gym.png";
import bgYog from "../products/bg-yog.png";
import bgPharma from "../products/bg-pharma.png";

// LEFT-SIDE FOREGROUND images (people/illustrations)
import fgAppointment from "../products/fg-appointment.jpg";
import fgQtrail from "../products/fg-qtrail.jpg";
import fgLab from "../products/fg-labpanel.jpg";
import fgDoctor from "../products/fg-doctorpanel.jpg";
import fgGym from "../products/fg-gympanel.jpg";
import fgYog from "../products/fg-yogpanel.jpg";
import fgPharma from "../products/fg-pharmapanel.jpg";

const CTA = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900 text-white font-semibold hover:opacity-90 transition"
  >
    {children} →
  </a>
);

const ProductCard = ({ id, title, blurb, href, bgImage, img }) => (
  <section
    id={id}
    className="relative rounded-[28px] shadow-lg ring-1 ring-slate-200/70 overflow-hidden my-8 grid md:grid-cols-2"
    style={{
      backgroundImage: `url(${bgImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }}
  >
    {/* LEFT: foreground picture (doctor/gym/yoga etc.) */}
    <div className="flex items-center justify-center min-h-[280px] md:min-h-[400px]">
      <img
        src={img}
        alt={title}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
    </div>

    {/* RIGHT: text content */}
    <div className="p-6 md:p-10 flex flex-col justify-center bg-white/20 rounded-l-[24px] md:rounded-l-none md:rounded-r-[24px]">
      <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
        {title}
      </h2>
      <p className="mt-4 text-slate-700 text-base md:text-lg">
        {blurb}
      </p>
      <div className="mt-6">
        <CTA href={href}>Learn More</CTA>
      </div>
    </div>
  </section>
);

export default function ProductShowcase() {
  const cards = [
    {
      id: "appointmentpanel",
      title: "AppointmentPanel",
      href: "https://www.healtrail.com/appointment",
      bgImage: bgAppointment,
      img: fgAppointment,
      blurb:
        "Open slots, manage calendars, send reminders, and reduce no-shows — a single dashboard for clinics and hospitals.",
    },
    {
      id: "qtrail",
      title: "QTrail",
      href: "https://www.healtrail.com/qTrail",
      bgImage: bgQtrail,
      img: fgQtrail,
      blurb:
        "Smart queue orchestration across OPD, labs, and billing with live ticketing, display boards, and ETA predictions.",
    },
    {
      id: "labpanel",
      title: "LabPanel",
      href: "https://www.healtrail.com/labpanel",
      bgImage: bgLab,
      img: fgLab,
      blurb:
        "Sample tracking, analyzer integrations, and auto-validated results with secure report sharing.",
    },
    {
      id: "doctorpanel",
      title: "DoctorPanel",
      href: "https://www.healtrail.com/doctorPanel",
      bgImage: bgDoctor,
      img: fgDoctor,
      blurb:
        "Fast EMR with templated notes, e-prescriptions, vitals, and history in one glance — fewer clicks, more care.",
    },
    {
      id: "gympanel",
      title: "GymPanel",
      href: "https://www.healtrail.com/gympanel",
      bgImage: bgGym,
      img: fgGym,
      blurb:
        "Memberships, plans, workout tracking, and trainer scheduling for wellness centers and in-house gyms.",
    },
    {
      id: "yogpanel",
      title: "YogPanel",
      href: "https://www.healtrail.com/yogapanel",
      bgImage: bgYog,
      img: fgYog,
      blurb:
        "Batch scheduling, attendance, and personalized asana plans with digital check-ins and progress logs.",
    },
    {
      id: "pharmapanel",
      title: "PharmaPanel",
      href: "https://www.healtrail.com/pharmapanel",
      bgImage: bgPharma,
      img: fgPharma,
      blurb:
        "Retail & in-house pharmacy POS with e-Rx intake, stock control, expiry alerts, and GST-ready invoicing.",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 md:px-8">
      {cards.map((c) => (
        <ProductCard key={c.id} {...c} />
      ))}
    </div>
  );
}
