import React, { useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";

class Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  theme: "light" | "dark";
  interactive: boolean;

  constructor(x: number, y: number, theme: "light" | "dark", interactive: boolean = true) {
    this.x = x;
    this.y = y;
    this.originX = x;
    this.originY = y;
    this.vx = 0;
    this.vy = 0;
    this.size = 1.5;
    this.alpha = 0.15;
    this.theme = theme;
    this.interactive = interactive;
    this.color = theme === "dark" ? "#333333" : "#CCCCCC";
  }

  getColors() {
    return {
      resting: this.theme === "dark" ? "#333333" : "#CCCCCC",
      active: "#FF0037"
    };
  }

  update(mouseX: number, mouseY: number, radius: number) {
    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const forceX = dx / distance;
    const forceY = dy / distance;

    // Proximity visibility (always calculated for smooth gradient)
    const maxVisibleDistance = 1200;
    const visibilityRatio = Math.max(0, 1 - distance / maxVisibleDistance);
    this.alpha = 0.15 + visibilityRatio * 0.45; // Increased base visibility (0.15 instead of 0.05)

    // Repulsion physics & Interaction Focus
    if (this.interactive && distance < radius) {
      const force = (radius - distance) / radius;
      this.vx -= forceX * force * 1.5;
      this.vy -= forceY * force * 1.5;

      const interactionRatio = 1 - distance / radius;
      this.alpha = 0.15 + interactionRatio * 0.8;
      const colors = this.getColors();
      this.color = this.interpolateColor(
        colors.resting,
        colors.active,
        interactionRatio
      );
    } else {
      this.color = this.getColors().resting;
      if (!this.interactive) {
        // Subtle constant visibility for static grid
        this.alpha = 0.7;
      }
    }

    // Spring physics (return to origin)
    const dxOrigin = this.originX - this.x;
    const dyOrigin = this.originY - this.y;
    this.vx += dxOrigin * 0.05;
    this.vy += dyOrigin * 0.05;

    // Friction & Velocity Integration
    this.vx *= 0.85;
    this.vy *= 0.85;
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx: CanvasRenderingContext2D, scrollY: number) {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    // Apply parallax offset during draw
    ctx.arc(this.x, this.y - scrollY * 0.2, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  // Helper to smoothly transition colors
  private interpolateColor(c1: string, c2: string, ratio: number) {
    const r1 = parseInt(c1.substring(1, 3), 16);
    const g1 = parseInt(c1.substring(3, 5), 16);
    const b1 = parseInt(c1.substring(5, 7), 16);

    const r2 = parseInt(c2.substring(1, 3), 16);
    const g2 = parseInt(c2.substring(3, 5), 16);
    const b2 = parseInt(c2.substring(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
  }
}

interface Background3DProps {
  interactive?: boolean;
  showSpotlight?: boolean;
  gridSpacing?: number;
}

export const Background3D: React.FC<Background3DProps> = ({ 
  interactive = true, 
  showSpotlight = true,
  gridSpacing = 35
}) => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const scrollRef = useRef(0);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles: Particle[] = [];
      const spacing = gridSpacing;
      const rows = Math.ceil(canvas.height / spacing);
      const cols = Math.ceil(canvas.width / spacing);

      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          particles.push(new Particle(c * spacing, r * spacing, theme, interactive));
        }
      }
      particlesRef.current = particles;
    };

    const animate = () => {
      ctx.fillStyle = theme === "dark" ? "#000000" : "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (showSpotlight) {
        // Draw Spotlight / Glow behind particles
        const gradient = ctx.createRadialGradient(
          mouseRef.current.x,
          mouseRef.current.y,
          0,
          mouseRef.current.x,
          mouseRef.current.y,
          800,
        );
        const spotlightColor = theme === "dark" 
          ? "rgba(255, 0, 55, 0.15)" 
          : "rgba(255, 0, 55, 0.1)";
        gradient.addColorStop(0, spotlightColor);
        gradient.addColorStop(1, theme === "dark" ? "rgba(0, 0, 0, 0)" : "rgba(255, 255, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Update and Draw Particles
      const radius = 500; // Increased radius for further reach
      const currentScroll = scrollRef.current;
      particlesRef.current.forEach((p) => {
        // Adjust mouse position relative to parallax for interaction consistency
        p.update(
          mouseRef.current.x,
          mouseRef.current.y + currentScroll * 0.2,
          radius,
        );
        p.draw(ctx, currentScroll);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleScroll = () => {
      scrollRef.current = window.scrollY;
    };

    const handleResize = () => {
      init();
    };

    init();
    animate();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [theme, interactive, showSpotlight, gridSpacing]); // Re-init on theme or prop change

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[-1] pointer-events-none"
    />
  );
};
