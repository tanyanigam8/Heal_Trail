import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import "../styles/ProductShowcase.css"; 
import AnimatedBoxes from "../components/AnimatedBoxes";
import React from "react";
import ProductShowcase from "../components/ProductShowcase";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-hero min-h-screen flex flex-col text-white overflow-visible">
      {/* Hero */}
      <div className="flex flex-col items-center justify-start min-h-[25vh] px-6 pt-16 z-0">
        <h1 className="text-5xl md:text-6xl font-extrabold drop-shadow-sm text-center text-slate-900">
          Welcome to HealthTrail AI
        </h1>
      </div>

      {/* Animated boxes */}
      <div className="-mt-2 z-0">
        <AnimatedBoxes onOpenAuth={() => navigate("/login")} />
      </div>

      {/* Product showcase */}
      <ProductShowcase />
    </div>
  );
}
