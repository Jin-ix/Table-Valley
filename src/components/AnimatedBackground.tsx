'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function AnimatedBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        overflow: 'hidden',
        background: 'var(--obsidian, #070c14)',
        pointerEvents: 'none',
      }}
    >
      {/* Primary ember blob — top-left drift */}
      <motion.div
        animate={{
          x:       [0, 120, -60, 0],
          y:       [0, -80, 60, 0],
          scale:   [1, 1.25, 0.85, 1],
          opacity: [0.18, 0.32, 0.14, 0.18],
        }}
        transition={{ duration: 24, ease: 'linear', repeat: Infinity }}
        style={{
          position: 'absolute',
          top: '-15%',
          left: '-5%',
          width: '65vw',
          height: '65vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234,88,12,0.22) 0%, rgba(249,115,22,0.08) 40%, transparent 70%)',
          filter: 'blur(90px)',
        }}
      />

      {/* Secondary ember blob — bottom-right drift */}
      <motion.div
        animate={{
          x:       [0, -140, 60, 0],
          y:       [0, 80, -100, 0],
          scale:   [1, 1.1, 0.9, 1],
          opacity: [0.1, 0.22, 0.08, 0.1],
        }}
        transition={{ duration: 30, ease: 'linear', repeat: Infinity, delay: 3 }}
        style={{
          position: 'absolute',
          bottom: '-25%',
          right: '-5%',
          width: '75vw',
          height: '75vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, rgba(234,88,12,0.06) 35%, transparent 65%)',
          filter: 'blur(110px)',
        }}
      />

      {/* Blue accent blob — center-right */}
      <motion.div
        animate={{
          x:       [0, 60, -60, 0],
          y:       [0, 60, -40, 0],
          opacity: [0.06, 0.14, 0.06, 0.06],
        }}
        transition={{ duration: 18, ease: 'linear', repeat: Infinity, delay: 1 }}
        style={{
          position: 'absolute',
          top: '25%',
          right: '10%',
          width: '45vw',
          height: '45vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 65%)',
          filter: 'blur(70px)',
        }}
      />

      {/* Subtle purple-teal blob — center */}
      <motion.div
        animate={{
          x:       [0, -40, 80, 0],
          y:       [0, 100, -60, 0],
          opacity: [0.06, 0.12, 0.05, 0.06],
        }}
        transition={{ duration: 22, ease: 'linear', repeat: Infinity, delay: 5 }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '35%',
          width: '35vw',
          height: '35vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Fine dot-grid texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)',
        }}
      />

      {/* Very subtle vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(4,8,16,0.6) 100%)',
        }}
      />
    </div>
  );
}
