'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: string; // e.g. "rgba(234, 88, 12, 0.4)"
  delay?: number;
  activePulse?: 'low' | 'out' | null;
}

export function PremiumCard({ 
  children, 
  className = '', 
  glowColor = 'rgba(255, 255, 255, 0.15)',
  delay = 0,
  activePulse = null,
  ...props 
}: PremiumCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mouse position values for spotlight (relative to element)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Mouse position values for 3D tilt (normalized from -0.5 to +0.5)
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  
  // Smooth spring physics for both spotlight and tilt
  const smoothX = useSpring(mouseX, { stiffness: 300, damping: 40 });
  const smoothY = useSpring(mouseY, { stiffness: 300, damping: 40 });
  const smoothTiltX = useSpring(tiltX, { stiffness: 400, damping: 30 });
  const smoothTiltY = useSpring(tiltY, { stiffness: 400, damping: 30 });

  // Map normalized tilt (-0.5 to 0.5) to actual rotation angles (max ±12 degrees)
  const rotateX = useTransform(smoothTiltY, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(smoothTiltX, [-0.5, 0.5], [-12, 12]);
  
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Pixel coordinates for the spotlight
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
    
    // Normalized coordinates for the 3D tilt
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;
    tiltX.set(xPct - 0.5);
    tiltY.set(yPct - 0.5);
  }

  function handleMouseLeave() {
    setIsHovered(false);
    tiltX.set(0);
    tiltY.set(0);
  }

  // Spotlight background mask
  const backgroundSpotlight = useMotionTemplate`
    radial-gradient(
      600px circle at ${smoothX}px ${smoothY}px,
      ${glowColor},
      transparent 80%
    )
  `;

  let pulseClass = '';
  if (activePulse === 'low') pulseClass = 'premium-pulse-low';
  if (activePulse === 'out') pulseClass = 'premium-pulse-out';

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      className={`premium-card-wrapper ${pulseClass} ${className}`}
      {...(props as any)}
      style={{
        position: 'relative',
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(12px)',
        perspective: '1000px', // Required for 3D tilt
        transformStyle: 'preserve-3d',
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        boxShadow: isHovered 
          ? '0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset' 
          : '0 4px 12px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.02) inset',
        cursor: 'default',
        ...(props.style as any)
      }}
    >
      {/* Animated Spotlight that follows the mouse */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          overflow: 'hidden',
          background: backgroundSpotlight,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      
      {/* Top glass reflection line */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          opacity: isHovered ? 0.8 : 0.3,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Actual Content Wrapper with 3D Pop (z-index 1 to sit above spotlight) */}
      <motion.div 
        style={{ position: 'relative', zIndex: 1, height: '100%' }}
        animate={{ translateZ: isHovered ? 40 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
