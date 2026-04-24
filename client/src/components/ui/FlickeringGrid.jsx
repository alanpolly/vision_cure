import React, { useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";

export function FlickeringGrid() {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();
  const isDarkRef = useRef(isDark);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, cols = 0, rows = 0;
    let grid;
    let animationFrameId;
    let last = performance.now();

    const SQ = 3;
    const GAP = 5;
    const CELL = SQ + GAP;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      W = parent.clientWidth;
      H = parent.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.scale(dpr, dpr);
      cols = Math.ceil(W / CELL);
      rows = Math.ceil(H / CELL);
      grid = new Float32Array(cols * rows);
      for (let i = 0; i < grid.length; i++) {
        grid[i] = Math.random() * 0.15;
      }
    };

    const draw = (dt) => {
      ctx.clearRect(0, 0, W, H);
      const dark = isDarkRef.current;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const idx = i * rows + j;
          if (Math.random() < 0.20 * dt) grid[idx] = Math.random() * 0.18;
          const op = grid[idx];
          ctx.fillStyle = dark
            ? `rgba(255, 255, 255, ${op})`
            : `rgba(0, 0, 0, ${op})`;
          ctx.fillRect(i * CELL, j * CELL, SQ, SQ);
        }
      }
    };

    const loop = (ts) => {
      const dt = Math.min((ts - last) / 1000, 0.1);
      last = ts;
      draw(dt);
      animationFrameId = requestAnimationFrame(loop);
    };

    const observer = new ResizeObserver(() => {
      resize();
    });

    if (canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    resize();
    animationFrameId = requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0 bg-transparent overflow-hidden">
      <canvas ref={canvasRef} className="absolute top-0 left-0 pointer-events-none block" />
    </div>
  );
}
