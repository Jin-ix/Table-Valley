'use client';
import { useRef, useEffect, useState } from 'react';
import { FileText, TrendingUp, Package, Users, Download, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import styles from '../shared.module.css';

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { rootMargin: '-4%', threshold: 0.07 }
    );
    el.querySelectorAll('.reveal').forEach(t => obs.observe(t));
    return () => obs.disconnect();
  }, []);
  return ref;
}

function fmt(n: number) {
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function ReportsPage({ dayClosings = [] }: { dayClosings?: any[] }) {
  const revealRef = useScrollReveal();

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('en-CA');
  const lastDay  = new Date(today.getFullYear(), today.getMonth() + 1, 0).toLocaleDateString('en-CA');

  const [dateRanges, setDateRanges] = useState<Record<string, {start: string; end: string}>>({
    financial: { start: firstDay, end: lastDay },
    sales:     { start: firstDay, end: lastDay },
    inventory: { start: firstDay, end: lastDay },
    staff:     { start: firstDay, end: lastDay },
  });

  const handleDownload = (reportType: string, format: 'pdf' | 'excel') => {
    const range = dateRanges[reportType];
    if (!range.start || !range.end) return alert('Please select both start and end dates.');
    if (reportType === 'financial') {
      // Real P&L CSV download
      window.open(`/api/reports/pnl?start=${range.start}&end=${range.end}`, '_blank');
      return;
    }
    alert(`Generating ${reportType.toUpperCase()} report as ${format.toUpperCase()} from ${range.start} to ${range.end}...`);
  };

  const updateDate = (type: string, field: 'start' | 'end', val: string) => {
    setDateRanges(prev => ({ ...prev, [type]: { ...prev[type], [field]: val } }));
  };

  const REPORT_CARDS = [
    { id: 'financial', title: 'Financial Reports',  icon: <TrendingUp size={36} color="#10b981" />, desc: 'P&L statements, tax summaries, and revenue analysis.' },
    { id: 'sales',     title: 'Sales Reports',       icon: <FileText   size={36} color="#3b82f6" />, desc: 'Order breakdowns, category performance, and discounts.' },
    { id: 'inventory', title: 'Inventory Reports',   icon: <Package    size={36} color="#f97316" />, desc: 'Stock levels, consumption history, and supplier data.' },
    { id: 'staff',     title: 'Staff Reports',       icon: <Users      size={36} color="#8b5cf6" />, desc: 'Attendance, shift performance, and order handling metrics.' },
  ];

  return (
    <div className={styles.page} ref={revealRef}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Reports</h1>
          <p className={styles.pageSubtitle}>Generate and schedule elegant business reports</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary}>Report Templates</button>
          <button className={styles.btnPrimary}>+ Custom Report</button>
        </div>
      </div>

      <div className={`${styles.grid2} reveal`} style={{marginBottom:'1.5rem', rowGap: '1.5rem'}}>
        {REPORT_CARDS.map(card => (
          <div key={card.id} className={styles.card}
            style={{transition:'all 0.25s', padding: '2rem 1.75rem', display: 'flex', flexDirection: 'column', height: '100%'}}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {card.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{fontWeight:800, fontSize:'1.125rem', color:'#fff', marginBottom:'0.25rem', letterSpacing: '-0.02em'}}>{card.title}</div>
                <div style={{fontSize:'0.8125rem', color:'rgba(255,255,255,0.4)', lineHeight:1.5}}>{card.desc}</div>
              </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <div style={{display:'flex', gap:'0.75rem', marginBottom:'1.25rem'}}>
                <input type="date" value={dateRanges[card.id].start} onChange={e => updateDate(card.id, 'start', e.target.value)} style={{flex: 1, background:'rgba(255,255,255,0.04)', color:'#fff', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'0.6rem 0.8rem', fontSize:'0.85rem', colorScheme:'dark'}}/>
                <span style={{color:'rgba(255,255,255,0.3)', alignSelf:'center', fontSize:'0.8rem', fontWeight: 600}}>to</span>
                <input type="date" value={dateRanges[card.id].end} onChange={e => updateDate(card.id, 'end', e.target.value)} style={{flex: 1, background:'rgba(255,255,255,0.04)', color:'#fff', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'0.6rem 0.8rem', fontSize:'0.85rem', colorScheme:'dark'}}/>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => handleDownload(card.id, 'pdf')} className={styles.btnSecondary} style={{flex:1, justifyContent:'center', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)'}}>
                  <Download size={16} /> {card.id === 'financial' ? 'Download CSV' : 'Export PDF'}
                </button>
                <button onClick={() => handleDownload(card.id, 'excel')} className={styles.btnSecondary} style={{flex:1, justifyContent:'center', color: '#10b981', borderColor: 'rgba(16,185,129,0.2)'}}>
                  <FileSpreadsheet size={16} /> Export Excel
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── DAY CLOSING HISTORY ── */}
      {dayClosings.length > 0 && (
        <div className={`${styles.card} reveal`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Day Closing History</span>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Last {dayClosings.length} closings</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Orders</th>
                <th>Cash Sales</th>
                <th>UPI</th>
                <th>Card</th>
                <th>Total Sales</th>
                <th>Opening Cash</th>
                <th>Expected</th>
                <th>Actual</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {dayClosings.map((h: any) => {
                const isShort = h.difference < -50;
                const isOver  = h.difference > 50;
                return (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>
                      {new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>{h.ordersCount}</td>
                    <td>{fmt(h.cashSales)}</td>
                    <td>{fmt(h.upiSales)}</td>
                    <td>{fmt(h.cardSales)}</td>
                    <td style={{ fontWeight: 700, color: '#fff' }}>{fmt(h.totalSales)}</td>
                    <td>{fmt(h.openingCash)}</td>
                    <td>{fmt(h.expectedCash)}</td>
                    <td>{fmt(h.actualCash)}</td>
                    <td>
                      <span className={`${styles.badge} ${isShort ? styles.badgeRed : isOver ? styles.badgeAmber : styles.badgeGreen}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        {isShort && <AlertTriangle size={10} />}
                        {h.difference >= 0 ? '+' : ''}{fmt(h.difference)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
