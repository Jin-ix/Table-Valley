'use client';

import { useRef } from 'react';
import { motion, type Variants, useScroll, useTransform, useSpring } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Lock, Zap, BarChart3, ShieldCheck, Printer, Clock, Users, Smartphone } from 'lucide-react';
import styles from './intro.module.css';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.8, ease: EASE, delay: i * 0.15 }
  })
};

const textReveal = {
  hidden: { opacity: 0, y: 50, rotateX: -40 },
  show: (i: number) => ({
    opacity: 1, y: 0, rotateX: 0,
    transition: { duration: 0.9, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }
  })
};

export default function IntroPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const heroY = useTransform(smoothProgress, [0, 0.3], [0, 200]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.25], [1, 0]);
  const dashScale = useTransform(smoothProgress, [0, 0.3], [1, 0.85]);
  const dashY = useTransform(smoothProgress, [0, 0.3], [0, -100]);
  

  return (
    <div className={styles.page} ref={containerRef}>
      {/* ── SCROLL PROGRESS BAR ── */}
      <motion.div 
        style={{ scaleX: smoothProgress, transformOrigin: '0%', position: 'fixed', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #f97316)', zIndex: 1000 }} 
      />

      {/* ── NAV ── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.nav}
      >
        <div className={styles.navBrand}>
          <div className={styles.navLogo}>TV</div>
          <span className={styles.navName}>Table Valley</span>
        </div>
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#stats" className={styles.navLink}>Analytics</a>
          <a href="#cta" className={styles.navLink}>Get Started</a>
        </div>
        <Link href="/admin/login" className={styles.navCta}>
          <Lock size={14} /> Admin Portal
        </Link>
      </motion.nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>

        <div className={styles.heroContentWrapper}>
          <motion.div style={{ y: heroY, opacity: heroOpacity }} className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} /> 
            Version 2.0 is Here
          </motion.div>
          
          <motion.h1 style={{ y: heroY, opacity: heroOpacity }} className={styles.heroTitle}>
            <span className={styles.heroTitleLine1}>The Operating System</span>
            <span className={styles.heroTitleLine2}>for Modern Restaurants.</span>
          </motion.h1>
        </div>

        {/* Dashboard Mockup */}
        <motion.div
          style={{ scale: dashScale, y: dashY }}
          className={styles.heroDashboard}
        >
          <div className={styles.glassGlow} />
          <div className={styles.dashboardFrame}>
            <div className={styles.dashboardBar}>
              <div className={styles.dashDot} />
              <div className={styles.dashDot} />
              <div className={styles.dashDot} />
            </div>
            <div className={styles.dashboardGrid}>
              {[
                { label: 'Revenue Today', value: '₹48,230', sub: '↑ 12% from yesterday' },
                { label: 'Orders', value: '184', sub: '↑ 8 last hour' },
                { label: 'Avg. Ticket', value: '₹262', sub: '↑ 4% this week' },
                { label: 'Tables Active', value: '14', sub: '3 awaiting bill' },
              ].map((s, i) => (
                <motion.div 
                  key={i} 
                  className={styles.dashStat}
                  whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.08)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className={styles.dashStatLabel}>{s.label}</div>
                  <div className={styles.dashStatValue}>{s.value}</div>
                  <div className={styles.dashStatSub}>{s.sub}</div>
                </motion.div>
              ))}
            </div>
            <div className={styles.dashCards}>
              <div className={styles.dashOrderList}>
                <div className={styles.dashOrderTitle}>Live Orders</div>
                {[
                  { name: 'Butter Chicken + Naan', price: '₹520', status: 'Preparing' },
                  { name: 'Paneer Tikka Masala', price: '₹380', status: 'Ready' },
                  { name: 'Biryani (Family)', price: '₹890', status: 'Served' },
                  { name: 'Gulab Jamun ×4', price: '₹240', status: 'Preparing' },
                ].map((o, i) => (
                  <div key={i} className={styles.dashOrderItem}>
                    <span className={styles.dashOrderName}>{o.name}</span>
                    <span className={styles.dashOrderPrice}>{o.price}</span>
                    <span className={styles.dashOrderBadge}>{o.status}</span>
                  </div>
                ))}
              </div>
              <div className={styles.dashActivity}>
                <div className={styles.dashOrderTitle}>System Load</div>
                <div className={styles.dashActivityBar}>
                  <div className={styles.actBar}>
                    <span className={styles.actBarLabel}>CPU</span>
                    <div className={styles.actBarTrack}><motion.div initial={{ width: 0 }} whileInView={{ width: '45%' }} className={styles.actBarFill} /></div>
                  </div>
                  <div className={styles.actBar}>
                    <span className={styles.actBarLabel}>MEM</span>
                    <div className={styles.actBarTrack}><motion.div initial={{ width: 0 }} whileInView={{ width: '25%' }} className={styles.actBarFill} /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── STATS BAND ── */}
      <motion.div
        id="stats"
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
        viewport={{ once: true }} transition={{ duration: 0.8 }}
        className={styles.statsBand}
      >
        {[
          { number: '500+', label: 'Restaurants Onboarded' },
          { number: '2M+', label: 'Orders Processed' },
          { number: '99.9%', label: 'System Uptime' },
          { number: '4.9★', label: 'Average Rating' },
        ].map((s, i) => (
          <motion.div 
            key={i} 
            className={styles.statItem}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1, type: "spring", stiffness: 100 }}
          >
            <div className={styles.statNumber}>{s.number}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── FEATURES ── */}
      <section id="features" className={styles.featuresSection}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className={styles.sectionLabel}>Features</div>
          <h2 className={styles.sectionTitle}>Everything you need to run your venue.</h2>
        </motion.div>

        <div className={styles.featuresGrid}>
          {/* Card 1 */}
          <motion.div className={`${styles.featureCard} ${styles['col-span-2']}`}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className={styles.featureIcon}><Zap size={20} /></div>
            <h3 className={styles.featureCardTitle}>Lightning Fast Orders</h3>
            <p className={styles.featureCardDesc}>
              Fire orders to the kitchen instantly. Our local-first architecture ensures 
              zero latency, even when the internet drops. Built for high-volume service.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div className={styles.featureCard}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className={styles.featureIcon}><Lock size={20} /></div>
            <h3 className={styles.featureCardTitle}>Bank-Grade Security</h3>
            <p className={styles.featureCardDesc}>End-to-end encryption for all transaction data and user roles.</p>
          </motion.div>

          {/* Card 3 */}
          <motion.div className={styles.featureCard}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className={styles.featureIcon}><Smartphone size={20} /></div>
            <h3 className={styles.featureCardTitle}>Cloud Sync</h3>
            <p className={styles.featureCardDesc}>Access reports from anywhere in real-time on any device.</p>
          </motion.div>

          {/* Card 4 */}
          <motion.div className={`${styles.featureCard} ${styles['col-span-2']}`}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className={styles.featureIcon}><BarChart3 size={20} /></div>
            <h3 className={styles.featureCardTitle}>Advanced Analytics</h3>
            <p className={styles.featureCardDesc}>
              Understand your business like never before. Track peak hours, top-selling items, 
              staff performance, and inventory forecasts all in one dashboard.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <motion.section 
        className={styles.ctaSection}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.ctaTitle}>Ready to serve smarter?</h2>
        <p className={styles.ctaSubtitle}>Open the POS system or sign into the admin dashboard to get started.</p>
        <div className={styles.ctaButtons}>
          <Link href="/pos">
            <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className={styles.btnEnter}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
              Launch POS <ArrowRight size={18} />
            </motion.span>
          </Link>
          <Link href="/admin/login">
            <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className={styles.btnAdmin}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem' }}>
              <Lock size={16} /> Admin Login
            </motion.span>
          </Link>
        </div>
      </motion.section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <span className={styles.footerText}>© 2026 Table Valley. All rights reserved.</span>
        <span className={styles.footerBrand}>TABLE VALLEY</span>
      </footer>
    </div>
  );
}
