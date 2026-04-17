/*
 * Copyright (C) 2026 Leonardo Cardozo Vargas
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* ====================================================================
   BackgroundCanvas — Animated orb background (requestAnimationFrame)
   ==================================================================== */

import { useEffect, useRef } from 'react';

interface Orb {
  x: number;
  y: number;
  r: number;
  dx: number;
  dy: number;
  color: string;
}

export default function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const safeCanvas = canvas;
    const safeCtx = ctx;

    let raf: number;
    let w = 0;
    let h = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      safeCanvas.width = w;
      safeCanvas.height = h;
    }
    resize();
    window.addEventListener('resize', resize);

    // Gerar orbs
    const colors = [
      'rgba(234,88,12,0.08)', // orange
      'rgba(37,99,235,0.07)', // blue
      'rgba(168,85,247,0.06)', // purple
      'rgba(22,163,74,0.05)', // green
      'rgba(220,38,38,0.04)', // red
    ];

    const orbs: Orb[] = Array.from({ length: 6 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 180 + Math.random() * 240,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    function draw() {
      safeCtx.clearRect(0, 0, w, h);

      // Background base
      safeCtx.fillStyle = '#f8fafc';
      safeCtx.fillRect(0, 0, w, h);

      for (const orb of orbs) {
        orb.x += orb.dx;
        orb.y += orb.dy;
        if (orb.x < -orb.r) orb.x = w + orb.r;
        if (orb.x > w + orb.r) orb.x = -orb.r;
        if (orb.y < -orb.r) orb.y = h + orb.r;
        if (orb.y > h + orb.r) orb.y = -orb.r;

        const grad = safeCtx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        grad.addColorStop(0, orb.color);
        grad.addColorStop(1, 'transparent');
        safeCtx.fillStyle = grad;
        safeCtx.fillRect(orb.x - orb.r, orb.y - orb.r, orb.r * 2, orb.r * 2);
      }

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} id="bg-canvas" />;
}
