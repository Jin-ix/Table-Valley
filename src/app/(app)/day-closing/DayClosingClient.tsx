'use client';

import { useState, useTransition } from 'react';
import { DoorClosed, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { closeDayAction } from '@/app/actions/dayClosingActions';
import styles from '../shared.module.css';

type TodaySummary = {
  cashSales: number;
  upiSales: number;
  cardSales: number;
  otherSales: number;
  totalSales: number;
  ordersCount: number;
  todayStr: string;
  existingClosing: any;
};

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function DayClosingClient({
  todaySummary,
  history,
}: {
  todaySummary: TodaySummary;
  history: any[];
}) {
  const { cashSales, upiSales, cardSales, otherSales, totalSales, ordersCount, existingClosing } = todaySummary;

  const [openingCash, setOpeningCash] = useState(
    existingClosing ? String(existingClosing.openingCash) : ''
  );
  const [actualCash, setActualCash] = useState(
    existingClosing ? String(existingClosing.actualCash) : ''
  );
  const [result, setResult]   = useState<any>(existingClosing || null);
  const [error, setError]     = useState('');
  const [isPending, start]    = useTransition();

  const expectedCash = (parseFloat(openingCash) || 0) + cashSales;
  const difference   = (parseFloat(actualCash) || 0) - expectedCash;
  const isClosed     = !!result;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await closeDayAction(fd);
      if (res?.error) { setError(res.error); return; }
      setResult(res.data);
    });
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', padding: '0.75rem 1rem', color: '#fff', fontSize: '1rem',
    fontFamily: 'inherit', outline: 'none', width: '100%',
  };

  return (
    <div>
      {/* ── TODAY SALES SUMMARY ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.125rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Cash Sales',   value: fmt(cashSales),   color: '#10b981' },
          { label: 'UPI / QR',     value: fmt(upiSales),    color: '#3b82f6' },
          { label: 'Card',         value: fmt(cardSales),   color: '#8b5cf6' },
          { label: 'Other',        value: fmt(otherSales),  color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className={styles.statCard} style={{ animation: 'none' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.625rem', fontWeight: 800, color: s.color, letterSpacing: '-0.04em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.375rem', marginBottom: '1.5rem' }}>
        {/* ── CLOSING FORM ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
              <DoorClosed size={16} style={{ display: 'inline', marginRight: 6, color: '#f97316' }} />
              Close the Day
            </span>
            {isClosed && (
              <span className={`${styles.badge} ${styles.badgeGreen}`}>
                <CheckCircle size={11} /> Closed
              </span>
            )}
          </div>
          <div className={styles.cardBody}>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.6rem 0.875rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.38)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Opening Cash (₹)
                </label>
                <input
                  name="openingCash"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter opening cash in drawer"
                  value={openingCash}
                  onChange={e => setOpeningCash(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.38)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Actual Cash in Drawer (₹)
                </label>
                <input
                  name="actualCash"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Count and enter actual cash"
                  value={actualCash}
                  onChange={e => setActualCash(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              {/* Live difference preview */}
              {openingCash && actualCash && (
                <div style={{ background: difference >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${difference >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 10, padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                    <span>Expected Cash</span><span style={{ color: '#fff', fontWeight: 700 }}>{fmt(expectedCash)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Difference</span>
                    <span style={{ color: difference >= 0 ? '#34d399' : '#f87171', fontWeight: 800, fontSize: '1rem' }}>
                      {difference >= 0 ? '+' : ''}{fmt(difference)}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className={styles.btnPrimary}
                style={{ justifyContent: 'center', padding: '0.875rem' }}
              >
                <DoorClosed size={16} />
                {isPending ? 'Saving…' : isClosed ? 'Update Day Closing' : 'Close Day'}
              </button>
            </form>

            {isClosed && result && (
              <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(16,185,129,0.07)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.18)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#34d399', fontWeight: 700, fontSize: '0.9rem' }}>
                  <CheckCircle size={16} /> Day closed successfully
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Sales</span><span style={{ color: '#fff', fontWeight: 700 }}>{fmt(result.totalSales ?? totalSales)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Orders Count</span><span style={{ color: '#fff', fontWeight: 700 }}>{result.ordersCount ?? ordersCount}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cash Difference</span><span style={{ color: (result.difference ?? difference) >= 0 ? '#34d399' : '#f87171', fontWeight: 700 }}>{fmt(result.difference ?? difference)}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── TODAY DETAILS ── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
              <TrendingUp size={16} style={{ display: 'inline', marginRight: 6, color: '#f97316' }} />
              Today's Summary
            </span>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{ordersCount} orders</span>
          </div>
          <div className={styles.cardBody}>
            {[
              { label: 'Cash Sales',        value: cashSales,  color: '#10b981' },
              { label: 'UPI / QR Sales',    value: upiSales,   color: '#3b82f6' },
              { label: 'Card Sales',        value: cardSales,  color: '#8b5cf6' },
              { label: 'Other',             value: otherSales, color: '#f59e0b' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.875rem', marginBottom: '0.875rem', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.color }} />
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>{row.label}</span>
                </div>
                <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: row.value > 0 ? '#fff' : 'rgba(255,255,255,0.25)' }}>{fmt(row.value)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.25rem' }}>
              <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Total Sales</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em' }}>{fmt(totalSales)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── HISTORY TABLE ── */}
      {history.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Closing History</span>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Last {history.length} days</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Orders</th>
                <th>Cash</th>
                <th>UPI</th>
                <th>Card</th>
                <th>Total Sales</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => {
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
