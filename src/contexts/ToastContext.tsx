'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'none'
      }}>
        <AnimatePresence mode="popLayout">
          {toasts.map((t, idx) => {
            // Calculate stacking scale/y offset based on position from the end (newest is last)
            const reverseIdx = toasts.length - 1 - idx;
            const yOffset = reverseIdx * -15; // Move older toasts up
            const scale = Math.max(1 - reverseIdx * 0.05, 0.8);
            
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: yOffset, scale: scale }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                style={{
                  position: reverseIdx > 0 ? 'absolute' : 'relative',
                  bottom: reverseIdx > 0 ? 0 : 'auto',
                  marginTop: reverseIdx === 0 ? '1rem' : 0,
                  backgroundColor: '#1e293b',
                  border: `1px solid ${
                    t.type === 'success' ? 'rgba(16,185,129,0.3)' :
                    t.type === 'error' ? 'rgba(239,68,68,0.3)' :
                    t.type === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)'
                  }`,
                  color: '#f8fafc',
                  padding: '1rem 1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  zIndex: toasts.length - reverseIdx
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>
                  {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                {t.message}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
