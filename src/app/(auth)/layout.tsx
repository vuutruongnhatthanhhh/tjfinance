"use client";

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 10,
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-mystic-dark dark:bg-mystic-dark">
      {/* Ambient glow blobs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #2D9A4B, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #1a7a35, transparent 70%)" }}
      />
      <div
        className="absolute top-[50%] left-[50%] w-[300px] h-[300px] rounded-full opacity-10 blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{ background: "radial-gradient(circle, #4ade80, transparent 70%)" }}
      />

      {/* Floating particles */}
      <div className="particles-container">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle-dot"
            style={{
              left: `${p.x}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              boxShadow: `0 0 ${p.size * 3}px rgba(45, 154, 75, 0.8)`,
            }}
          />
        ))}
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(45,154,75,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(45,154,75,0.5) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        {children}
      </div>
    </div>
  );
}
