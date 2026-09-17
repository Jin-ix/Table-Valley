'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TrendingUp, ShoppingCart, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { fetchComparison } from '@/app/actions/compareActions';
import styles from '../shared.module.css';
import dash from './dashboard.module.css';

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

export type DashboardDataPayload = {
  dataByPeriod: Record<string, { labels: string[]; revenue: number[]; orders: number[]; covers: number[]; aov: number[]; prevRevenue: number[]; prevOrders: number[] }>;
  monthDataByIdx: Record<number, { labels: string[]; revenue: number[]; orders: number[]; covers: number[]; aov: number[]; prevRevenue: number[]; prevOrders: number[] }>;
  topItemsByPeriod: Record<string, { name: string; sold: number; revenue: string; pct: number }[]>;
  categoryPie: { label: string; pct: number; color: string }[];
  orderTypeSplit: { label: string; pct: number; color: string }[];
  paymentMethods?: { label: string; pct: number; color: string; revenue: string }[];
  heatData: number[][]; // 7 days x 7 time buckets
  totalsByPeriod: Record<string, { revenue: number; orders: number; items: number; cancellations: number; prevRevenue: number; prevOrders: number; prevItems: number; prevCancellations: number }>;
};

function PeakHoursHeatmap({ heatData }: { heatData: number[][] }) {
  const [hovered, setHovered] = useState<{d:number;h:number}|null>(null);
  const max = Math.max(...heatData.flat(), 1);
  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:`40px repeat(${HEAT_HOURS.length}, 1fr)`, gap:'4px', alignItems:'center'}}>
        <div/>
        {HEAT_HOURS.map(h => (
          <div key={h} style={{fontSize:'0.65rem', color:'rgba(255,255,255,0.3)', textAlign:'center', fontWeight:600}}>{h}</div>
        ))}
        {HEAT_DAYS.map((day, d) => (
          <React.Fragment key={d}>
            <div style={{fontSize:'0.7rem', color:'rgba(255,255,255,0.35)', fontWeight:600, paddingRight:'4px'}}>{day}</div>
            {heatData[d].map((val, h) => {
              const intensity = val / max;
              const isHov = hovered?.d === d && hovered?.h === h;
              return (
                <div
                  key={h}
                  title={`${day} ${HEAT_HOURS[h]}: ${val} orders`}
                  onMouseEnter={() => setHovered({d,h})}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    height: '28px',
                    borderRadius: '6px',
                    background: intensity > 0.7
                      ? `rgba(234,88,12,${0.4 + intensity * 0.6})`
                      : intensity > 0.4
                      ? `rgba(251,146,60,${0.2 + intensity * 0.5})`
                      : `rgba(255,255,255,${0.03 + intensity * 0.1})`,
                    border: isHov ? '1px solid rgba(234,88,12,0.6)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    transform: isHov ? 'scale(1.1)' : 'scale(1)',
                    position: 'relative',
                  }}
                >
                  {isHov && (
                    <div style={{
                      position:'absolute', bottom:'calc(100% + 6px)', left:'50%',
                      transform:'translateX(-50%)',
                      background:'rgba(17,24,39,0.96)', border:'1px solid rgba(255,255,255,0.1)',
                      borderRadius:'7px', padding:'0.3rem 0.6rem', whiteSpace:'nowrap',
                      fontSize:'0.75rem', fontWeight:700, color:'#fff', zIndex:10,
                      pointerEvents:'none',
                    }}>
                      {day} {HEAT_HOURS[h]} · {val} orders
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div style={{display:'flex', gap:'0.5rem', alignItems:'center', marginTop:'0.875rem', justifyContent:'flex-end'}}>
        <span style={{fontSize:'0.7rem', color:'rgba(255,255,255,0.3)'}}>Low</span>
        {[0.1,0.25,0.45,0.65,0.85,1].map((t,i) => (
          <div key={i} style={{width:'18px', height:'12px', borderRadius:'3px',
            background: t > 0.7 ? `rgba(234,88,12,${0.4+t*0.6})` : t > 0.4 ? `rgba(251,146,60,${0.2+t*0.5})` : `rgba(255,255,255,${0.03+t*0.1})`}}/>
        ))}
        <span style={{fontSize:'0.7rem', color:'rgba(255,255,255,0.3)'}}>High</span>
      </div>
    </div>
  );
}

/* ── BAR CHART ── */
function BarChart({ labels, values, color = '#ea580c', highlight }: {
  labels: string[];
  values: number[];
  color?: string;
  highlight?: string;
}) {
  const max = Math.max(...values);
  const [hovered, setHovered] = useState<number | null>(null);

  // For dense data (monthly/daily), only show some labels
  const showLabel = (i: number) => {
    if (labels.length <= 7) return true;
    if (labels.length <= 14) return i % 2 === 0;
    if (labels.length <= 30) return i % 5 === 0 || i === labels.length - 1;
    return i % 2 === 0;
  };

  return (
    <div className={dash.chartWrap}>
      {highlight && <div className={dash.chartHighlight}>{highlight}</div>}
      <div className={dash.barChart} style={{ gap: labels.length > 14 ? '2px' : labels.length > 7 ? '4px' : '8px' }}>
        {values.map((v, i) => (
          <div
            key={i}
            className={dash.barWrap}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {hovered === i && (
              <div className={dash.tooltip}>
                <div className={dash.tooltipLabel}>{labels[i]}</div>
                <div className={dash.tooltipVal}>{typeof v === 'number' && v > 999 ? fmt(v) : v}</div>
              </div>
            )}
            <div
              className={dash.bar}
              style={{
                height: `${Math.max(4, (v / max) * 100)}%`,
                background: hovered === i
                  ? `linear-gradient(to top, ${color}, ${color}cc)`
                  : `linear-gradient(to top, ${color}99, ${color}dd)`,
                transform: hovered === i ? 'scaleX(1.05)' : 'scaleX(1)',
              }}
            />
            {showLabel(i) && <span className={dash.barLabel}>{labels[i]}</span>}
            {!showLabel(i) && <span className={dash.barLabel} style={{opacity:0}}>·</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── LINE CHART (SVG) ── */
function LineChart({ labels, values, prevValues, color = '#ea580c', prevColor = 'rgba(255,255,255,0.2)', fill = 'rgba(234,88,12,0.15)', isCurrency = false }: {
  labels: string[];
  values: number[];
  prevValues?: number[];
  color?: string;
  prevColor?: string;
  fill?: string;
  isCurrency?: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const W = 600, H = 160, PAD = 16;
  const max = Math.max(...values, ...(prevValues || []));
  const min = Math.min(...values, ...(prevValues || []));
  const range = max - min || 1;

  const pts = values.map((v, i) => ({
    x: PAD + (i / (values.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((v - min) / range) * (H - PAD * 2),
  }));
  
  const prevPts = prevValues ? prevValues.map((v, i) => ({
    x: PAD + (i / (prevValues.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((v - min) / range) * (H - PAD * 2),
  })) : [];

  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${path} L ${pts[pts.length-1].x} ${H} L ${pts[0].x} ${H} Z`;
  const prevPath = prevPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  // Show label every Nth point
  const showLabel = (i: number) => {
    if (labels.length <= 7) return true;
    if (labels.length <= 14) return i % 2 === 0;
    return i % Math.ceil(labels.length / 7) === 0;
  };

  return (
    <div className={dash.lineChartWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={dash.lineSvg}>
        <defs>
          <linearGradient id={`lg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25,0.5,0.75].map(t => (
          <line key={t} x1={PAD} y1={PAD + t*(H-PAD*2)} x2={W-PAD} y2={PAD + t*(H-PAD*2)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
        ))}
        <path d={area} fill={`url(#lg-${color.replace('#','')})`}/>
        {prevValues && <path d={prevPath} fill="none" stroke={prevColor} strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round"/>}
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p, i) => hovered === i && (
          <React.Fragment key={i}>
            {prevPts[i] && <circle cx={prevPts[i].x} cy={prevPts[i].y} r="4" fill={prevColor} stroke="#1e293b" strokeWidth="1.5"/>}
            <circle cx={p.x} cy={p.y} r="5" fill={color} stroke="#1e293b" strokeWidth="2"/>
          </React.Fragment>
        ))}
      </svg>
      {/* Hit areas + tooltips */}
      <div className={dash.lineHitRow}>
        {pts.map((p, i) => (
          <div key={i} className={dash.lineHit}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {hovered === i && (
              <div className={dash.tooltip} style={{bottom:'auto', top:0}}>
                <div className={dash.tooltipLabel}>{labels[i]}</div>
                <div className={dash.tooltipVal} style={{color}}>
                  {isCurrency ? fmt(values[i]) : values[i].toLocaleString()}
                </div>
                {prevValues && (
                  <div className={dash.tooltipVal} style={{color:'rgba(255,255,255,0.5)', fontSize:'0.75rem', marginTop:'2px'}}>
                    vs {isCurrency ? fmt(prevValues[i]) : prevValues[i].toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* X labels */}
      <div className={dash.lineLabels}>
        {labels.map((l, i) => (
          <span key={i} className={dash.barLabel} style={{opacity: showLabel(i) ? 1 : 0}}>
            {showLabel(i) ? l : '·'}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── DONUT CHART (SVG) ── */
function DonutChart({ segments, label }: {
  segments: { label: string; pct: number; color: string }[];
  label: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const R = 48, CX = 60, CY = 60, STROKE = 14;
  const circ = 2 * Math.PI * R;
  let cumPct = 0;

  return (
    <div className={dash.donutWrap}>
      <svg viewBox="0 0 120 120" className={dash.donutSvg}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={STROKE}/>
        {segments.map((s, i) => {
          const dashLen = (s.pct / 100) * circ;
          const offset = circ - cumPct * circ / 100;
          const el = (
            <circle
              key={i}
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={hovered === i ? s.color : `${s.color}cc`}
              strokeWidth={hovered === i ? STROKE + 3 : STROKE}
              strokeDasharray={`${dashLen} ${circ}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{
                transform:'rotate(-90deg)',
                transformOrigin:'50% 50%',
                transition:'all 0.2s',
                cursor:'pointer',
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          );
          cumPct += s.pct;
          return el;
        })}
        <text x={CX} y={CY - 4} textAnchor="middle" className={dash.donutCenter}>
          {hovered !== null ? `${segments[hovered].pct}%` : '100%'}
        </text>
        <text x={CX} y={CY + 12} textAnchor="middle" className={dash.donutSub}>
          {hovered !== null ? segments[hovered].label : label}
        </text>
      </svg>
      <div className={dash.donutLegend}>
        {segments.map((s, i) => (
          <div key={i} className={dash.legendRow}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{opacity: hovered === null || hovered === i ? 1 : 0.4, cursor:'pointer'}}
          >
            <span className={dash.legendDot} style={{background: s.color}}/>
            <span className={dash.legendLabel}>{s.label}</span>
            <span className={dash.legendPct}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── MAIN COMPONENT ── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const HEAT_HOURS  = ['9AM','11AM','1PM','3PM','5PM','7PM','9PM'];
const HEAT_DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
type Period = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'pick' | 'compare';

const PERIOD_TABS: { id: Period; label: string }[] = [
  { id:'daily',   label:'Daily'   },
  { id:'weekly',  label:'Weekly'  },
  { id:'monthly', label:'Monthly' },
  { id:'yearly',  label:'Yearly'  },
  { id:'pick',    label:'Pick Month' },
  { id:'compare', label:'Compare' },
];

function fmt(n: number) {
  if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n/1000).toFixed(1)}k`;
  return `₹${n}`;
}

export default function DashboardClient({ payload }: { payload: DashboardDataPayload }) {
  const [period, setPeriod] = useState<Period>('weekly');
  const [pickedMonth, setPickedMonth] = useState(new Date().getMonth()); // 0-indexed
  const [pickedYear]  = useState(new Date().getFullYear());

  // Compare State
  const [cmpType, setCmpType] = useState<'day' | 'month'>('month');
  const [dateA, setDateA] = useState('');
  const [dateB, setDateB] = useState('');
  const [cmpData, setCmpData] = useState<any>(null);
  const [isCmpLoading, setIsCmpLoading] = useState(false);

  const handleCompare = async () => {
    if (!dateA || !dateB) return;
    setIsCmpLoading(true);
    try {
      const getRange = (type: 'day'|'month', val: string) => {
        if (type === 'day') {
          return { start: new Date(`${val}T00:00:00`).toISOString(), end: new Date(`${val}T23:59:59`).toISOString() };
        } else {
          const [y, m] = val.split('-');
          const start = new Date(parseInt(y), parseInt(m)-1, 1, 0, 0, 0);
          const end = new Date(parseInt(y), parseInt(m), 0, 23, 59, 59);
          return { start: start.toISOString(), end: end.toISOString() };
        }
      };
      const rA = getRange(cmpType, dateA);
      const rB = getRange(cmpType, dateB);
      const res = await fetchComparison(cmpType, rA.start, rA.end, rB.start, rB.end);
      setCmpData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCmpLoading(false);
    }
  };

  const data = useMemo(() => {
    if (period === 'compare' && cmpData) {
      return { ...cmpData.dataA, prevRevenue: cmpData.dataB.revenue, prevOrders: cmpData.dataB.orders };
    }
    if (period === 'pick') return payload.monthDataByIdx[pickedMonth] || payload.dataByPeriod.monthly;
    return payload.dataByPeriod[period] || payload.dataByPeriod.weekly;
  }, [period, pickedMonth, payload, cmpData]);

  const topItems = period === 'pick' || period === 'compare'
    ? payload.topItemsByPeriod.monthly || []
    : payload.topItemsByPeriod[period] || [];

  const { totalRevenue, totalOrders, totalItems, avgAOV, prevRevenue, prevOrders, prevItems } = useMemo(() => {
    if (period === 'compare' && cmpData) {
      return {
        totalRevenue: cmpData.statsA.revenue,
        totalOrders:  cmpData.statsA.orders,
        totalItems:   cmpData.statsA.items,
        avgAOV:       cmpData.statsA.orders ? Math.round(cmpData.statsA.revenue / cmpData.statsA.orders) : 0,
        prevRevenue:  cmpData.statsB.revenue,
        prevOrders:   cmpData.statsB.orders,
        prevItems:    cmpData.statsB.items,
      };
    }
    if (period === 'pick') {
      const aov = data.aov.length ? Math.round(data.aov.reduce((a: number, b: number) => a + b, 0) / data.aov.length) : 0;
      return {
        totalRevenue: data.revenue.reduce((a: number, b: number) => a + b, 0),
        totalOrders:  data.orders.reduce((a: number, b: number) => a + b, 0),
        totalItems:   0,
        avgAOV:       aov,
        prevRevenue:  0,
        prevOrders:   0,
        prevItems:    0,
      };
    }
    const t = payload.totalsByPeriod[period === 'compare' ? 'monthly' : period];
    return {
      totalRevenue: t.revenue,
      totalOrders:  t.orders,
      totalItems:   t.items,
      avgAOV:       t.orders ? Math.round(t.revenue / t.orders) : 0,
      prevRevenue:  t.prevRevenue,
      prevOrders:   t.prevOrders,
      prevItems:    t.prevItems,
    };
  }, [data, period, payload, cmpData]);
  
  const getDeltaStr = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? '+100%' : '0%';
    const pct = ((curr - prev) / prev) * 100;
    return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
  };
  const isUp = (curr: number, prev: number) => curr >= prev;

  const periodLabel = period === 'pick'
    ? `${MONTHS[pickedMonth]} ${pickedYear}`
    : period === 'compare' ? (cmpData ? 'Custom Compare' : 'Select Dates')
    : period === 'daily'   ? 'Today'
    : period === 'weekly'  ? 'This Week'
    : period === 'monthly' ? 'This Month'
    : 'This Year';

  const revealRef = useScrollReveal();

  return (
    <div ref={revealRef}>
      {/* ── PERIOD SELECTOR ── */}
      <div className={dash.periodRow}>
        <div className={dash.periodTabs}>
          {PERIOD_TABS.map(t => (
            <button
              key={t.id}
              className={`${dash.periodTab} ${period === t.id ? dash.periodTabActive : ''}`}
              onClick={() => setPeriod(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {period === 'pick' && (
          <div className={dash.monthPicker}>
            <button className={dash.monthNavBtn}
              onClick={() => setPickedMonth(m => (m - 1 + 12) % 12)}>
              <ChevronLeft size={16}/>
            </button>
            <span className={dash.monthName}>{MONTHS[pickedMonth]} {pickedYear}</span>
            <button className={dash.monthNavBtn}
              onClick={() => setPickedMonth(m => (m + 1) % 12)}>
              <ChevronRight size={16}/>
            </button>
          </div>
        )}

        {period === 'compare' && (
          <div style={{display:'flex', alignItems:'center', gap:'0.75rem', background:'rgba(255,255,255,0.03)', padding:'0.25rem 0.5rem', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.1)'}}>
            <select style={{background:'transparent', color:'#fff', border:'none', outline:'none', fontSize:'0.8rem', cursor:'pointer'}} value={cmpType} onChange={e => setCmpType(e.target.value as any)}>
              <option value="month">Month</option>
              <option value="day">Day</option>
            </select>
            <input type={cmpType} value={dateA} onChange={e => setDateA(e.target.value)} style={{background:'rgba(255,255,255,0.1)', color:'#fff', border:'none', borderRadius:'4px', padding:'0.2rem 0.4rem', fontSize:'0.8rem', colorScheme:'dark'}}/>
            <span style={{color:'rgba(255,255,255,0.4)', fontSize:'0.75rem'}}>vs</span>
            <input type={cmpType} value={dateB} onChange={e => setDateB(e.target.value)} style={{background:'rgba(255,255,255,0.1)', color:'#fff', border:'none', borderRadius:'4px', padding:'0.2rem 0.4rem', fontSize:'0.8rem', colorScheme:'dark'}}/>
            <button onClick={handleCompare} disabled={isCmpLoading || !dateA || !dateB} className={styles.btnPrimary} style={{padding:'0.2rem 0.6rem', fontSize:'0.75rem', minHeight:'auto'}}>
              {isCmpLoading ? '...' : 'Compare'}
            </button>
          </div>
        )}

        <span className={dash.periodLabel}>{periodLabel}</span>
      </div>

      {/* ── SUMMARY STAT CARDS ── */}
      <div className={styles.statsGrid} style={{marginBottom:'1.5rem'}}>
        {[
          { icon:<TrendingUp size={20}/>,      color:styles.statIconOrange, label:'Total Revenue',  value:fmt(totalRevenue), delta:getDeltaStr(totalRevenue, prevRevenue), up:isUp(totalRevenue, prevRevenue)  },
          { icon:<ShoppingCart size={20}/>,    color:styles.statIconBlue,   label:'Total Orders',   value:totalOrders.toLocaleString(), delta:getDeltaStr(totalOrders, prevOrders), up:isUp(totalOrders, prevOrders)  },
          { icon:<TrendingUp size={20}/>,      color:styles.statIconGreen,  label:'Items Sold',   value:totalItems.toLocaleString(), delta:getDeltaStr(totalItems, prevItems), up:isUp(totalItems, prevItems)  },
          { icon:<ShoppingCart size={20}/>,    color:styles.statIconPurple, label:'Avg Order Value',  value:`₹${avgAOV}`, delta:getDeltaStr(avgAOV, prevOrders ? Math.round(prevRevenue/prevOrders) : 0), up:isUp(avgAOV, prevOrders ? Math.round(prevRevenue/prevOrders) : 0) },
        ].map((s, i) => (
          <div key={i} className={styles.statCard}>
            <div className={`${styles.statIcon} ${s.color}`}>{s.icon}</div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
            <span className={`${styles.statDelta} ${s.up ? styles.deltaUp : styles.deltaDown}`}>
              {s.delta} vs prev
            </span>
          </div>
        ))}
      </div>

      {/* ── ROW 1: Revenue bar + Orders line ── */}
      <div className={`${dash.grid2} reveal`} style={{marginBottom:'1.375rem'}}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Revenue</span>
            <span className={dash.chartMeta}>{periodLabel} · {fmt(totalRevenue)}</span>
          </div>
          <div className={styles.cardBody} style={{paddingBottom:'0.5rem'}}>
            <BarChart labels={data.labels} values={data.revenue} color="#ea580c"/>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Orders</span>
            <span className={dash.chartMeta}>{periodLabel} · {totalOrders} orders</span>
          </div>
          <div className={styles.cardBody} style={{paddingBottom:'0.5rem'}}>
            <LineChart labels={data.labels} values={data.orders} color="#3b82f6" fill="rgba(59,130,246,0.15)" isCurrency={false}/>
          </div>
        </div>
      </div>

      {/* ── ROW 2: Revenue Comparison + Donut charts ── */}
      <div className={`${dash.grid3} reveal`} style={{marginBottom:'1.375rem'}}>
        <div className={`${styles.card} ${dash.span2}`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Revenue Comparison</span>
            <span className={dash.chartMeta}>{periodLabel} vs Previous</span>
          </div>
          <div className={styles.cardBody} style={{paddingBottom:'0.5rem'}}>
            <LineChart labels={data.labels} values={data.revenue} prevValues={data.prevRevenue} color="#10b981" fill="rgba(16,185,129,0.15)" isCurrency={true}/>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Category Mix</span>
          </div>
          <div className={styles.cardBody}>
            <DonutChart segments={payload.categoryPie} label="Category"/>
          </div>
        </div>
      </div>

      {/* ── ROW 2.5: AOV trend + Peak Hours heatmap ── */}
      <div className={`${dash.grid2} reveal`} style={{marginBottom:'1.375rem'}}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Avg Order Value</span>
            <span className={dash.chartMeta}>{periodLabel} · ₹{avgAOV} avg</span>
          </div>
          <div className={styles.cardBody} style={{paddingBottom:'0.5rem'}}>
            <LineChart labels={data.labels} values={data.aov} color="#8b5cf6" fill="rgba(139,92,246,0.15)" isCurrency={true}/>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Peak Hours</span>
            <span className={dash.chartMeta}>Weekly · order density</span>
          </div>
          <div className={styles.cardBody}>
            <PeakHoursHeatmap heatData={payload.heatData} />
          </div>
        </div>
      </div>

      {/* ── ROW 3: Top items + Order type donut ── */}
      <div className={`${dash.grid2} reveal`} style={{marginBottom:'1.375rem'}}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Top Selling Items</span>
            <span className={dash.chartMeta}>{periodLabel}</span>
          </div>
          <div style={{padding:'0.5rem 0'}}>
            {topItems.map((item, i) => (
              <div key={i} style={{padding:'0.75rem 1.5rem', display:'flex', alignItems:'center', gap:'1rem'}}>
                <span style={{width:'20px', fontSize:'0.75rem', fontWeight:'800', color:'rgba(255,255,255,0.2)'}}>{i+1}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:'0.875rem', fontWeight:'600', color:'#fff', marginBottom:'0.25rem'}}>{item.name}</div>
                  <div style={{height:'4px', background:'rgba(255,255,255,0.06)', borderRadius:'99px', overflow:'hidden'}}>
                    <div style={{height:'100%', width:`${item.pct}%`, background:'linear-gradient(90deg,#ea580c,#f97316)', borderRadius:'99px', transition:'width 0.5s ease'}}/>
                  </div>
                </div>
                <span style={{fontSize:'0.75rem', fontWeight:'700', color:'#f97316'}}>{item.sold} sold</span>
                <span style={{fontSize:'0.75rem', color:'rgba(255,255,255,0.3)', minWidth:'70px', textAlign:'right'}}>{item.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Order Type Split</span>
          </div>
          <div className={styles.cardBody}>
            <DonutChart segments={payload.orderTypeSplit} label="Orders"/>
          </div>
        </div>
      </div>
    </div>
  );
}
