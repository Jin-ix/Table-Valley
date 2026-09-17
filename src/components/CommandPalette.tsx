'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type CommandOption = {
  id: string;
  name: string;
  icon: string;
  href: string;
  shortcut?: string;
};

const COMMANDS: CommandOption[] = [
  { id: 'pos', name: 'Point of Sale (POS)', icon: '🛒', href: '/pos', shortcut: 'P' },
  { id: 'dash', name: 'Dashboard', icon: '📊', href: '/dashboard', shortcut: 'D' },
  { id: 'inv', name: 'Inventory Management', icon: '📦', href: '/inventory', shortcut: 'I' },
  { id: 'staff', name: 'Staff & Payroll', icon: '👥', href: '/staff', shortcut: 'S' },
  { id: 'menu', name: 'Menu & Products', icon: '🍔', href: '/products', shortcut: 'M' },
  { id: 'orders', name: 'Orders & KOT', icon: '🧾', href: '/orders', shortcut: 'O' },
  { id: 'sales', name: 'Sales & Reports', icon: '📈', href: '/sales', shortcut: 'R' },
  { id: 'settings', name: 'Settings', icon: '⚙️', href: '/settings', shortcut: ',' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Filter commands
  const filtered = COMMANDS.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Reset selection on search change
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Handle keyboard navigation inside the palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    }
  };

  const handleSelect = (cmd: CommandOption) => {
    setOpen(false);
    setSearch('');
    router.push(cmd.href);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              zIndex: 9999,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: '20vh',
              left: '50%',
              x: '-50%',
              width: '90%',
              maxWidth: '600px',
              backgroundColor: '#131c2e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
              overflow: 'hidden',
              zIndex: 10000,
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {/* Search Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '1.25rem', marginRight: '0.75rem', opacity: 0.5 }}>🔍</span>
              <input
                ref={inputRef}
                autoFocus
                placeholder="Search commands, pages, or actions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: 500,
                }}
              />
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                ESC to close
              </div>
            </div>

            {/* Results List */}
            <div style={{ padding: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
              {filtered.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                  No results found for "{search}"
                </div>
              )}
              {filtered.map((cmd, idx) => (
                <div
                  key={cmd.id}
                  onClick={() => handleSelect(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: selectedIndex === idx ? 'rgba(234,88,12,0.15)' : 'transparent',
                    color: selectedIndex === idx ? '#fff' : 'rgba(255,255,255,0.7)',
                    transition: 'background 0.1s',
                  }}
                >
                  <span style={{ fontSize: '1.25rem', marginRight: '1rem' }}>{cmd.icon}</span>
                  <span style={{ flex: 1, fontWeight: selectedIndex === idx ? 600 : 500 }}>{cmd.name}</span>
                  {cmd.shortcut && (
                    <span style={{ 
                      fontSize: '0.7rem', 
                      background: 'rgba(255,255,255,0.06)', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '6px',
                      color: 'rgba(255,255,255,0.4)'
                    }}>
                      ⌘ {cmd.shortcut}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
