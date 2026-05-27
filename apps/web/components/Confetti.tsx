"use client";

import React, { useEffect, useRef } from "react";

interface ConfettiProps {
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const COLORS = [
  "#22c55e", // emerald green
  "#3b82f6", // blue
  "#eab308", // yellow
  "#ef4444", // red
  "#a855f7", // purple
  "#f97316", // orange
  "#ec4899", // pink
];

export default function Confetti({ active }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      // Clean up when not active
      particlesRef.current = [];
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles (bursting from the bottom left and bottom right corners, Shazam/Duolingo style)
    const createBurst = (x: number, y: number, angleRange: [number, number]) => {
      const count = 60;
      for (let i = 0; i < count; i++) {
        const angle = angleRange[0] + Math.random() * (angleRange[1] - angleRange[0]);
        const speed = 10 + Math.random() * 15;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          size: 6 + Math.random() * 8,
          rotation: Math.random() * 360,
          rotationSpeed: -5 + Math.random() * 10,
          opacity: 1,
        });
      }
    };

    // Burst from bottom-left (shooting up-right) and bottom-right (shooting up-left)
    createBurst(0, canvas.height, [-Math.PI / 6, -Math.PI / 3]);
    createBurst(canvas.width, canvas.height, [-Math.PI * 2 / 3, -Math.PI * 5 / 6]);

    // Animation Loop
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Apply gravity & friction
        p.vy += 0.35; // gravity
        p.vx *= 0.98; // air resistance
        p.vy *= 0.98;

        // Move particle
        p.x += p.vx;
        p.y += p.vy;

        // Rotate
        p.rotation += p.rotationSpeed;

        // Fade out as it falls below screen or slows down
        if (p.y > canvas.height - 100) {
          p.opacity -= 0.02;
        }

        if (p.opacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle (rectangle/strip)
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size, p.size, p.size * 1.6);
        ctx.restore();
      }

      if (particles.length > 0) {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}
