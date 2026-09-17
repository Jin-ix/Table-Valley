'use client';

import { useState, useRef, useEffect } from 'react';
import styles from '../shared.module.css';
import dash from '../dashboard/dashboard.module.css';

import { DashboardDataPayload } from '../dashboard/DashboardClient';

// Lightweight scroll-reveal observer
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

type View = 'monthly' | 'weekly' | 'daily';
const VIEW_TABS: { id: View; label: string }[] = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'weekly',  label: 'Weekly'  },
  { id: 'daily',   label: 'Today'   },
];

function fmt(n: number) {
  if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n/1000).toFixed(1)}k`;
  return `₹${n}`;
}

/* ── BAR CHART ── */
function BarChart({ labels, values, color = '#ea580c', formatFn = String }: {
  labels: string[]; values: number[]; color?: string; formatFn?: (n:number)=>string;
}) {
  const max = Math.max(...values);
  const [hov, setHov] = useState<number|null>(null);
  const dense = labels.length > 7;
  return (
    <div className={dash.barChart} style={{ gap: dense ? '4px' : '8px' }}>
      {values.map((v, i) => (
        <div key={i} className={dash.barWrap}
          onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
          {hov === i && (
            <div className={dash.tooltip}>
              <div className={dash.tooltipLabel}>{labels[i]}</div>
              <div className={dash.tooltipVal}>{formatFn(v)}</div>
            </div>
          )}
          <div className={dash.bar} style={{
            height: `${Math.max(4, (v/max)*100)}%`,
            background: hov === i
              ? `linear-gradient(to top, ${color}, ${color}bb)`
              : `linear-gradient(to top, ${color}88, ${color}cc)`,
            transform: hov === i ? 'scaleX(1.05)' : 'scaleX(1)',
          }}/>
          {(!dense || i % 2 === 0) && <span className={dash.barLabel}>{labels[i]}</span>}
          {dense && i % 2 !== 0    && <span className={dash.barLabel} style={{opacity:0}}>·</span>}
        </div>
      ))}
    </div>
  );
}

/* ── LINE CHART ── */
function LineChart({ labels, values, color = '#ea580c', formatFn = String }: {
  labels: string[]; values: number[]; color?: string; formatFn?: (n:number)=>string;
}) {
  const [hov, setHov] = useState<number|null>(null);
  const W = 600, H = 160, PAD = 16;
  const max = Math.max(...values), min = Math.min(...values), range = max - min || 1;
  const pts = values.map((v, i) => ({
    x: PAD + (i/(values.length-1))*(W-PAD*2),
    y: H - PAD - ((v-min)/range)*(H-PAD*2),
  }));
  const path = pts.map((p,i) => `${i===0?'M':'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${path} L ${pts[pts.length-1].x} ${H} L ${pts[0].x} ${H} Z`;
  const dense = labels.length > 7;
  const showLbl = (i:number) => !dense || i % Math.ceil(labels.length/7) === 0;

  return (
    <div className={dash.lineChartWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={dash.lineSvg}>
        <defs>
          <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0.25,0.5,0.75].map(t => (
          <line key={t} x1={PAD} y1={PAD+t*(H-PAD*2)} x2={W-PAD} y2={PAD+t*(H-PAD*2)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
        ))}
        <path d={area} fill={`url(#sg-${color.replace('#','')})`}/>
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p,i) => hov===i && (
          <circle key={i} cx={p.x} cy={p.y} r="5" fill={color} stroke="#1e293b" strokeWidth="2"/>
        ))}
      </svg>
      <div className={dash.lineHitRow}>
        {pts.map((_,i) => (
          <div key={i} className={dash.lineHit}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
            {hov===i && (
              <div className={dash.tooltip} style={{bottom:'auto', top:0}}>
                <div className={dash.tooltipLabel}>{labels[i]}</div>
                <div className={dash.tooltipVal}>{formatFn(values[i])}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={dash.lineLabels}>
        {labels.map((l,i) => (
          <span key={i} className={dash.barLabel} style={{opacity: showLbl(i)?1:0}}>
            {showLbl(i) ? l : '·'}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── NO MORE DUMMY HORIZ BARS ── */

function HorizBars({ rows }: { rows: {label:string;pct:number;color:string;revenue:string}[] }) {
  const [hov, setHov] = useState<number|null>(null);
  return (
    <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
      {rows.map((r,i) => (
        <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
          style={{opacity: hov===null||hov===i ? 1 : 0.5, transition:'opacity 0.15s', cursor:'default'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'0.4rem',
            fontSize:'0.875rem', fontWeight:600, color:'rgba(255,255,255,0.8)'}}>
            <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
              <span style={{width:'8px',height:'8px',borderRadius:'50%',background:r.color,display:'inline-block'}}/>
              {r.label}
            </div>
            <div style={{display:'flex', gap:'0.75rem'}}>
              <span style={{color:'rgba(255,255,255,0.35)', fontWeight:500}}>{r.revenue}</span>
              <span style={{color:r.color, minWidth:'36px', textAlign:'right'}}>{r.pct}%</span>
            </div>
          </div>
          <div style={{height:'7px', background:'rgba(255,255,255,0.06)', borderRadius:'99px', overflow:'hidden'}}>
            <div style={{height:'100%', width:`${r.pct}%`, background:r.color, borderRadius:'99px',
              transition:'width 0.4s ease', boxShadow:`0 0 8px ${r.color}60`}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── YTD CUMULATIVE LINE ── */
function YTDChart({ ytdData, labels }: { ytdData: number[]; labels: string[] }) {
  const [hov, setHov] = useState<number|null>(null);
  const W = 600, H = 140, PAD = 16;
  const max = Math.max(...ytdData, 1), min = 0;
  const pts = ytdData.map((v,i) => ({
    x: PAD + (i/(ytdData.length-1))*(W-PAD*2),
    y: H - PAD - ((v-min)/(max-min))*(H-PAD*2),
  }));
  const path = pts.map((p,i) => `${i===0?'M':'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${path} L ${pts[pts.length-1].x} ${H} L ${pts[0].x} ${H} Z`;
  return (
    <div className={dash.lineChartWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={dash.lineSvg} style={{height:'140px'}}>
        <defs>
          <linearGradient id="ytdGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0.33,0.66].map(t=>(
          <line key={t} x1={PAD} y1={PAD+t*(H-PAD*2)} x2={W-PAD} y2={PAD+t*(H-PAD*2)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
        ))}
        <path d={area} fill="url(#ytdGrad)"/>
        <path d={path} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p,i) => hov===i && (
          <circle key={i} cx={p.x} cy={p.y} r="5" fill="#10b981" stroke="#1e293b" strokeWidth="2"/>
        ))}
      </svg>
      <div className={dash.lineHitRow} style={{bottom:'24px'}}>
        {pts.map((_,i) => (
          <div key={i} className={dash.lineHit}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
            {hov===i && (
              <div className={dash.tooltip} style={{bottom:'auto', top:0}}>
                <div className={dash.tooltipLabel}>{labels[i]} YTD</div>
                <div className={dash.tooltipVal}>{fmt(ytdData[i])}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={dash.lineLabels}>
        {labels.map((m,i) => (
          <span key={i} className={dash.barLabel}>{m}</span>
        ))}
      </div>
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function SalesClient({ payload }: { payload: DashboardDataPayload }) {
  const [view, setView] = useState<View>('monthly');
  const d = payload.dataByPeriod[view === 'monthly' ? 'yearly' : view];
  
  const totalRev   = d.revenue.reduce((a,b)=>a+b,0);
  const totalOrds  = d.orders.reduce((a,b)=>a+b,0);
  const avgAOV     = d.aov.length ? Math.round(d.aov.reduce((a,b)=>a+b,0)/d.aov.length) : 0;
  const viewLabel  = view==='monthly'?'This Year':view==='weekly'?'This Week':'Today';

  const t = payload.totalsByPeriod[view === 'monthly' ? 'yearly' : view];
  const cancellations = t.cancellations;

  const getDeltaStr = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? '+100%' : '0%';
    const pct = ((curr - prev) / prev) * 100;
    return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
  };
  const isUp = (curr: number, prev: number) => curr >= prev;

  const ytdData = payload.dataByPeriod.yearly.revenue.map((_, i) =>
    payload.dataByPeriod.yearly.revenue.slice(0, i + 1).reduce((a, b) => a + b, 0)
  );

  // Map category info for horizontal bars
  const totalCategoryRev = payload.categoryPie.reduce((acc, c) => acc + (c as any).revenue || 0, 0); // Need absolute rev
  const categorySplit = payload.categoryPie.map(c => ({
    label: c.label,
    pct: c.pct,
    color: c.color,
    revenue: `₹${(t.revenue * (c.pct / 100)).toLocaleString('en-IN')}`
  }));

  const revealRef = useScrollReveal();

  return (
    <div ref={revealRef}>
      {/* ── PERIOD TOGGLE ── */}
      <div className={dash.periodRow}>
        <div className={dash.periodTabs}>
          {VIEW_TABS.map(t => (
            <button key={t.id}
              className={`${dash.periodTab} ${view===t.id?dash.periodTabActive:''}`}
              onClick={() => setView(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <span className={dash.periodLabel}>{viewLabel}</span>
      </div>

      {/* ── STAT CARDS ── */}
      <div className={styles.statsGrid} style={{marginBottom:'1.5rem'}}>
        {[
          { label:'Total Revenue',   value: fmt(t.revenue),             color: styles.statIconOrange, delta:getDeltaStr(t.revenue, t.prevRevenue), up:isUp(t.revenue, t.prevRevenue)  },
          { label:'Total Orders',    value: t.orders.toLocaleString(),  color: styles.statIconBlue,   delta:getDeltaStr(t.orders, t.prevOrders), up:isUp(t.orders, t.prevOrders)  },
          { label:'Avg Order Value', value: `₹${t.orders ? Math.round(t.revenue/t.orders) : 0}`, color: styles.statIconGreen,  delta:getDeltaStr(t.orders ? Math.round(t.revenue/t.orders) : 0, t.prevOrders ? Math.round(t.prevRevenue/t.prevOrders) : 0),  up:isUp(t.orders ? Math.round(t.revenue/t.orders) : 0, t.prevOrders ? Math.round(t.prevRevenue/t.prevOrders) : 0)  },
          { label:'Cancellations',   value: t.cancellations.toString(), color: styles.statIconPurple, delta:getDeltaStr(t.cancellations, t.prevCancellations),  up:!isUp(t.cancellations, t.prevCancellations) },
        ].map((s,i) => (
          <div key={i} className={styles.statCard}>
            <div className={`${styles.statIcon} ${s.color}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                <polyline points="16 7 22 7 22 13"/>
              </svg>
            </div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
            <span className={`${styles.statDelta} ${s.up?styles.deltaUp:styles.deltaDown}`}>{s.delta} vs prev</span>
          </div>
        ))}
      </div>

      {/* ── ROW 1: Revenue bar + Orders line ── */}
      <div className={`${dash.grid2} reveal`} style={{marginBottom:'1.375rem'}}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Revenue</span>
            <span className={dash.chartMeta}>{viewLabel} · {fmt(totalRev)}</span>
          </div>
          <div className={styles.cardBody} style={{paddingBottom:'0.5rem'}}>
            <BarChart labels={d.labels} values={d.revenue} color="#ea580c" formatFn={fmt}/>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Orders Volume</span>
            <span className={dash.chartMeta}>{viewLabel} · {totalOrds} orders</span>
          </div>
          <div className={styles.cardBody} style={{paddingBottom:'0.5rem'}}>
            <LineChart labels={d.labels} values={d.orders} color="#3b82f6"
              formatFn={n => n.toLocaleString()}/>
          </div>
        </div>
      </div>

      {/* ── ROW 2: AOV trend + YTD cumulative ── */}
      <div className={`${dash.grid2} reveal`} style={{marginBottom:'1.375rem'}}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Avg Order Value Trend</span>
            <span className={dash.chartMeta}>{viewLabel} · ₹{avgAOV} avg</span>
          </div>
          <div className={styles.cardBody} style={{paddingBottom:'0.5rem'}}>
            <LineChart labels={d.labels} values={d.aov} color="#8b5cf6" formatFn={fmt}/>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Cumulative Revenue (YTD)</span>
            <span className={dash.chartMeta}>{new Date().getFullYear()} · {fmt(ytdData[ytdData.length-1] || 0)}</span>
          </div>
          <div className={styles.cardBody} style={{paddingBottom:'0.5rem'}}>
            <YTDChart ytdData={ytdData} labels={payload.dataByPeriod.yearly.labels}/>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Payment methods + Category split ── */}
      <div className={`${dash.grid2} reveal`}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Payment Methods</span>
            <span className={dash.chartMeta}>All Time</span>
          </div>
          <div className={styles.cardBody}>
            <HorizBars rows={payload.paymentMethods || []}/>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Category Revenue Split</span>
            <span className={dash.chartMeta}>{viewLabel}</span>
          </div>
          <div className={styles.cardBody}>
            <HorizBars rows={categorySplit}/>
          </div>
        </div>
      </div>
    </div>
  );
}
