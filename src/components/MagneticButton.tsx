'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function MagneticButton({ children, className = '', variant = 'primary', onClick, ...props }: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  
  // Magnetic pull state
  const [isHovered, setIsHovered] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  // Ripple state
  const [ripples, setRipples] = useState<{ x: number, y: number, id: number }[]>([]);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    // Pull the button towards the cursor (max 20px)
    x.set((clientX - centerX) * 0.2);
    y.set((clientY - centerY) * 0.2);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rippleX = e.clientX - rect.left;
    const rippleY = e.clientY - rect.top;
    const id = Date.now();
    
    setRipples(prev => [...prev, { x: rippleX, y: rippleY, id }]);
    
    // Clean up ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);

    if (onClick) onClick(e);
  };

  // Base styles for the button itself (override with className if needed)
  let baseStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    padding: '0.625rem 1.25rem',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.9375rem',
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'background 0.2s, box-shadow 0.2s',
  };

  if (variant === 'primary') {
    baseStyle = {
      ...baseStyle,
      background: 'linear-gradient(135deg, #f97316, #ea580c)',
      color: '#fff',
      boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
    };
  } else if (variant === 'danger') {
    baseStyle = {
      ...baseStyle,
      background: 'rgba(239, 68, 68, 0.1)',
      color: '#ef4444',
      border: '1px solid rgba(239, 68, 68, 0.2)',
    };
  } else {
    baseStyle = {
      ...baseStyle,
      background: 'rgba(255, 255, 255, 0.05)',
      color: '#fff',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    };
  }

  return (
    <motion.button
      ref={ref}
      className={className}
      style={{ ...baseStyle, x: smoothX, y: smoothY, ...(props.style as any) }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...(props as any)}
    >
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
      
      {/* Ripples */}
      <AnimatePresence>
        {ripples.map(r => (
          <motion.span
            key={r.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: r.y,
              left: r.x,
              width: '20px',
              height: '20px',
              background: 'rgba(255, 255, 255, 0.4)',
              borderRadius: '50%',
              pointerEvents: 'none',
              transformOrigin: 'center',
              zIndex: 0,
            }}
          />
        ))}
      </AnimatePresence>
    </motion.button>
  );
}
