/*
 * Copyright (C) 2026 Leonardo Cardozo Vargas
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* ====================================================================
   ScrollControls — Floating scroll buttons (top/bottom)
   ==================================================================== */

import { useEffect, useState } from 'react';

export default function ScrollControls() {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  useEffect(() => {
    function update() {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setShowTop(scrollY > 300);
      setShowBottom(scrollY < maxScroll - 300);
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });

  return (
    <nav className="floating-scroll-controls" aria-label="Controles de rolagem">
      <button
        type="button"
        className={`floating-scroll-btn ${showTop ? 'is-visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Ir para o topo"
      >
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Ir para o topo</title>
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
      <button
        type="button"
        className={`floating-scroll-btn ${showBottom ? 'is-visible' : ''}`}
        onClick={scrollToBottom}
        aria-label="Ir para o final"
      >
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Ir para o final</title>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </nav>
  );
}
