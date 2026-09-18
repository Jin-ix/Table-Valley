'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Lock, ChevronRight, BarChart3, ShieldCheck, Zap } from 'lucide-react';
import { login } from '@/app/actions/authActions';
import styles from './login.module.css';

export default function AdminLogin() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const res = await login(formData);
        if (res?.error) {
          setError(res.error);
        } else if (res?.success) {
          router.push('/dashboard');
        }
      } catch (err: any) {
        console.error('Login action failed:', err);
        setError('Network error: ' + (err.message || 'Failed to reach server.'));
      }
    });
  };

  return (
    <div className={styles.page}>

      {/* ── LEFT PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={styles.leftPanel}
      >
        <div className={styles.leftGrid} />
        <div className={styles.leftTop}>
          <div className={styles.brandMark}>
            <div className={styles.brandIcon}>TV</div>
            <span className={styles.brandName}>Table Valley</span>
          </div>
          <h2 className={styles.leftHeadline}>
            Command your<br />
            <span className={styles.accentWord}>restaurant</span><br />
            from anywhere.
          </h2>
          <p className={styles.leftDesc}>
            The admin dashboard gives you complete visibility and control — revenue, staff, inventory, and analytics in one place.
          </p>

          <div className={styles.leftFeatures}>
            {[
              { icon: <BarChart3 size={18} color="#f97316" />, title: 'Live Revenue Dashboard', desc: 'See earnings update in real time' },
              { icon: <ShieldCheck size={18} color="#f97316" />, title: 'Role-Based Access', desc: 'Granular permissions for every staff level' },
              { icon: <Zap size={18} color="#f97316" />, title: 'Instant Alerts', desc: 'Get notified about critical events instantly' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={styles.featurePill}
              >
                <div className={styles.pillIcon}>{f.icon}</div>
                <div className={styles.pillText}>
                  <div className={styles.pillTitle}>{f.title}</div>
                  <div className={styles.pillDesc}>{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className={styles.leftBottom}>
          © 2026 Table Valley. All rights reserved.
        </div>
      </motion.div>

      {/* ── RIGHT PANEL ── */}
      <div className={styles.rightPanel}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className={styles.formCard}
        >
          <div className={styles.formHeader}>
            <div className={styles.formBadge}>
              <ShieldCheck size={12} /> Secure Login
            </div>
            <h1 className={styles.formTitle}>Welcome back</h1>
            <p className={styles.formSubtitle}>Sign in to your Table Valley admin account to manage your restaurant.</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="email">Email Address</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><Mail size={16} /></span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={styles.input}
                  placeholder="admin@tablevalley.in"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="password">Password</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><Lock size={16} /></span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className={styles.input}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <div className={styles.formOptions}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" /> Keep me signed in
              </label>
              <a href="#" className={styles.forgotLink}>Forgot password?</a>
            </div>

            <motion.button
              type="submit"
              disabled={isPending}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={styles.submitBtn}
            >
              {isPending ? 'Signing In...' : 'Sign In'} <ChevronRight size={18} />
            </motion.button>
          </form>

          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span>or continue as</span>
            <div className={styles.dividerLine} />
          </div>

          <Link href="/pos">
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                color: 'rgba(255,255,255,0.6)',
                padding: '0.9375rem 1rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.625rem',
                transition: 'background 0.2s',
              }}
            >
              POS Staff Login →
            </motion.button>
          </Link>

          <p className={styles.formFooter}>
            Need help? <a href="mailto:support@tablevalley.in">Contact support</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
