import React, { useEffect, useRef } from 'react';

const FlickerBackground = () => {
  const bgRef = useRef(null);
  const logoRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const bg = bgRef.current;
    const lg = logoRef.current;
    if (!bg || !lg) return;
    const bgCtx = bg.getContext('2d');
    const lgCtx = lg.getContext('2d');

    const SQ = 4, GAP = 4, CELL = SQ + GAP;
    let W = 0, H = 0, cols = 0, rows = 0;
    let bgGrid = null, logoGrid = null, logoMask = null;
    let last = 0;

    const readTheme = () => {
      const cs = getComputedStyle(document.documentElement);
      const theme = document.documentElement.getAttribute('data-theme') || 'light';
      const accent = (cs.getPropertyValue('--accent') || '#3B82F6').trim();
      return { theme, accent };
    };

    const hexToRgb = (hex) => {
      let h = hex.replace('#', '');
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      const n = parseInt(h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      [bg, lg].forEach(c => {
        c.width = W * dpr; c.height = H * dpr;
        c.style.width = W + 'px'; c.style.height = H + 'px';
        const ctx = c.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      });
      cols = Math.floor(W / CELL);
      rows = Math.floor(H / CELL);
      bgGrid = new Float32Array(cols * rows);
      logoGrid = new Float32Array(cols * rows);
      const { theme } = readTheme();
      const maxA = theme === 'dark' ? 0.20 : 0.13;
      for (let i = 0; i < bgGrid.length; i++) bgGrid[i] = Math.random() * maxA;
      for (let i = 0; i < logoGrid.length; i++) logoGrid[i] = 0.5 + Math.random() * 0.5;
      buildMask();
    };

    const buildMask = () => {
      const off = document.createElement('canvas');
      off.width = W; off.height = H;
      const ctx = off.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      const fs = Math.min(W * 0.14, 180);
      ctx.font = `600 ${fs}px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.fillText('VisionCure', W / 2, H / 2);
      logoMask = ctx.getImageData(0, 0, W, H);
    };

    const inLogo = (col, row) => {
      const cx = Math.floor(col * CELL + SQ / 2);
      const cy = Math.floor(row * CELL + SQ / 2);
      if (cx < 0 || cx >= W || cy < 0 || cy >= H) return false;
      return logoMask.data[(cy * W + cx) * 4 + 3] > 40;
    };

    const draw = (ts) => {
      const dt = Math.min((ts - last) / 1000, 0.1);
      last = ts;
      const { theme, accent } = readTheme();
      const [r, g, b] = hexToRgb(accent);
      const maxA = theme === 'dark' ? 0.20 : 0.13;

      bgCtx.clearRect(0, 0, W, H);
      lgCtx.clearRect(0, 0, W, H);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const idx = i * rows + j;
          if (Math.random() < 0.55 * dt) bgGrid[idx] = Math.random() * maxA;
          const opBg = bgGrid[idx];
          if (opBg > 0.01) {
            bgCtx.fillStyle = `rgba(${r},${g},${b},${opBg})`;
            bgCtx.fillRect(i * CELL, j * CELL, SQ, SQ);
          }
          if (inLogo(i, j)) {
            if (Math.random() < 0.75 * dt) logoGrid[idx] = 0.35 + Math.random() * 0.55;
            const opL = logoGrid[idx];
            lgCtx.fillStyle = `rgba(${r},${g},${b},${opL})`;
            lgCtx.fillRect(i * CELL, j * CELL, SQ, SQ);
          }
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    rafRef.current = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const canvasStyle = {
    position: 'fixed', inset: 0,
    width: '100vw', height: '100vh',
    pointerEvents: 'none', zIndex: 0,
  };

  return (
    <>
      <canvas ref={bgRef} aria-hidden="true" style={canvasStyle}/>
      <canvas ref={logoRef} aria-hidden="true" style={canvasStyle}/>
    </>
  );
};

export default FlickerBackground;
