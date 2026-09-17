'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PremiumCard } from '@/components/PremiumCard';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { MagneticButton } from '@/components/MagneticButton';
import { useToast } from '@/contexts/ToastContext';
import styles from '../shared.module.css';
import s from './staff.module.css';

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  shift: string;
  status: string;
  salary: number;
  bonus: number;
  joined: string;
  hoursThisWeek: number;
  ordersToday: number;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export type AttStatus = 'PRESENT' | 'ABSENT' | 'HALF' | 'LEAVE' | 'HOLIDAY';

// Today = Saturday (index 5) in our mock week Sep 1–7
const TODAY_COL = 5;

const ATT_OPTIONS: { status: AttStatus; label: string; icon: string; color: string }[] = [
  { status:'PRESENT', label:'Present',  icon:'✓', color:'#34d399' },
  { status:'ABSENT',  label:'Absent',   icon:'✕', color:'#f87171' },
  { status:'HALF',    label:'Half Day', icon:'◑', color:'#fb923c' },
  { status:'LEAVE',   label:'On Leave', icon:'✈', color:'#a78bfa' },
  { status:'HOLIDAY', label:'Holiday',  icon:'★', color:'rgba(255,255,255,0.3)' },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ROLES = ['Manager','Cashier','Waiter','Chef','Delivery','Bartender','Cleaner','Helper','Accountant','Supplier','Porotta Master'];
const SHIFTS = ['Morning','Afternoon','Evening','Night'];
const ROLE_COLORS: Record<string,string> = {
  Manager:'badgeOrange', Cashier:'badgeBlue', Waiter:'badgeGreen', Chef:'badgePurple', Delivery:'badgeGray', Bartender:'badgeOrange', Cleaner:'badgeGray', Helper:'badgeGray', Accountant:'badgeBlue', Supplier:'badgeOrange', 'Porotta Master':'badgePurple',
};

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
}

function AttBadge({ status }: { status: AttStatus }) {
  const map: Record<AttStatus, { label: string; cls: string }> = {
    PRESENT: { label:'Present',  cls: s.attPresent },
    ABSENT:  { label:'Absent',   cls: s.attAbsent },
    HALF:    { label:'Half Day', cls: s.attHalf },
    LEAVE:   { label:'Leave',    cls: s.attLeave },
    HOLIDAY: { label:'Holiday',  cls: s.attHoliday },
  };
  const { label, cls } = map[status];
  return <span className={`${s.attStatus} ${cls}`}>{label}</span>;
}

/* ── Inline Salary Edit ── */
interface SalaryOverride {
  salary: number;
  bonus: number;
  deduction: number;
}

interface InlineEditProps {
  value: number;
  prefix?: string;
  onSave: (val: number) => void;
  color?: string;
}

function InlineEdit({ value, prefix = '₹', onSave, color }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={s.inlineInput}
        type="number"
        min={0}
        value={draft}
        onChange={e => setDraft(Number(e.target.value))}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
      />
    );
  }

  return (
    <button className={s.inlineDisplayBtn} style={color ? { color } : {}} onClick={() => { setDraft(value); setEditing(true); }}>
      {prefix}{value.toLocaleString('en-IN')}
      <span className={s.inlineEditPen}>✎</span>
    </button>
  );
}

/* ── Interactive Attendance Cell ── */
interface AttCellProps {
  status: AttStatus;
  checkIn: string | null;
  isToday: boolean;
  onChange: (status: AttStatus, checkIn: string | null) => void;
}

function AttCell({ status, checkIn, isToday, onChange }: AttCellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const pick = (opt: typeof ATT_OPTIONS[number]) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    const newCheckIn = (opt.status === 'PRESENT' || opt.status === 'HALF') ? timeStr : null;
    onChange(opt.status, newCheckIn);
    setOpen(false);
  };

  const statusMap: Record<AttStatus, string> = {
    PRESENT: s.attPresent, ABSENT: s.attAbsent, HALF: s.attHalf, LEAVE: s.attLeave, HOLIDAY: s.attHoliday,
  };
  const labelMap: Record<AttStatus, string> = {
    PRESENT:'Present', ABSENT:'Absent', HALF:'Half', LEAVE:'Leave', HOLIDAY:'Holiday',
  };

  return (
    <div ref={ref} style={{ position:'relative', display:'inline-flex', flexDirection:'column', alignItems:'center', gap:'0.3rem' }}>
      <button
        className={`${s.attStatus} ${statusMap[status]} ${s.attCellBtn}`}
        onClick={() => setOpen(o => !o)}
        title="Click to change"
      >
        {labelMap[status]}
        <span className={s.attEditHint}>✎</span>
      </button>
      {checkIn && <span className={s.hoursText}>{checkIn}</span>}
      {isToday && !checkIn && status !== 'ABSENT' && status !== 'HOLIDAY' && (
        <span className={s.todayDot} title="Today" />
      )}

      {open && (
        <div className={s.attPopover}>
          <div className={s.attPopoverTitle}>Set Status</div>
          {ATT_OPTIONS.map(opt => (
            <button key={opt.status} className={`${s.attPopoverItem} ${status === opt.status ? s.attPopoverItemActive : ''}`}
              onClick={() => pick(opt)}
            >
              <span className={s.attPopoverIcon} style={{ color: opt.color }}>{opt.icon}</span>
              <span>{opt.label}</span>
              {status === opt.status && <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.4)', fontSize:'0.7rem' }}>current</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ModalProps {
  staff?: StaffMember | null;
  onClose: () => void;
  onSave: (data: Partial<StaffMember>) => void;
}

function StaffModal({ staff, onClose, onSave }: ModalProps) {
  const isEdit = !!staff;
  const [form, setForm] = useState({
    name:   staff?.name   ?? '',
    role:   staff?.role   ?? 'Waiter',
    email:  staff?.email  ?? '',
    phone:  staff?.phone  ?? '',
    shift:  staff?.shift  ?? 'Morning',
    salary: staff?.salary ?? 18000,
    bonus:  staff?.bonus  ?? 0,
    status: staff?.status ?? 'On Duty',
  });
  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <div className={s.modalTitle}>{isEdit ? `Edit — ${staff!.name}` : 'Add New Staff Member'}</div>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={s.modalBody}>
          <div className={s.formGroup}>
            <label className={s.formLabel}>Full Name</label>
            <input className={s.formInput} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Priya Sharma" />
          </div>
          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Role</label>
              <select className={s.formSelect} value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Shift</label>
              <select className={s.formSelect} value={form.shift} onChange={e => set('shift', e.target.value)}>
                {SHIFTS.map(sh => <option key={sh} value={sh}>{sh}</option>)}
              </select>
            </div>
          </div>
          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Email</label>
              <input className={s.formInput} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Phone</label>
              <input className={s.formInput} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" />
            </div>
          </div>
          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Monthly Salary (₹)</label>
              <input className={s.formInput} type="number" value={form.salary} onChange={e => set('salary', Number(e.target.value))} />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Bonus (₹)</label>
              <input className={s.formInput} type="number" value={form.bonus} onChange={e => set('bonus', Number(e.target.value))} />
            </div>
          </div>
          <div className={s.formGroup}>
            <label className={s.formLabel}>Status</label>
            <select className={s.formSelect} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="On Duty">On Duty</option>
              <option value="Off Duty">Off Duty</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
        </div>

        <div className={s.modalFooter}>
          <button className={s.modalBtnSecondary} onClick={onClose}>Cancel</button>
          <button className={s.modalBtnPrimary} onClick={() => { onSave(form); onClose(); }}>
            {isEdit ? 'Save Changes' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function StaffClient({ initialStaff }: { initialStaff: StaffMember[] }) {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [tab, setTab] = useState<'overview' | 'attendance' | 'salary'>('overview');
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState<StaffMember | null | undefined>(undefined);
  const [salaryMonth, setSalaryMonth] = useState(7);
  const [paidSet, setPaidSet] = useState<Set<string>>(new Set([]));

  // Attendance state — keyed by staffName, array of 7 statuses
  const [attState, setAttState] = useState<Record<string, AttStatus[]>>({});
  const [checkInState, setCheckInState] = useState<Record<string, (string | null)[]>>({});

  const { toast } = useToast();

  // Per-staff salary overrides: salary, bonus, extra deduction
  const [salaryOverrides, setSalaryOverrides] = useState<Record<string, SalaryOverride>>(
    () => Object.fromEntries(initialStaff.map(m => [m.id, { salary: m.salary, bonus: m.bonus, deduction: 0 }]))
  );

  const updateSalary = (id: string, field: keyof SalaryOverride, val: number) => {
    setSalaryOverrides(prev => ({ ...prev, [id]: { ...prev[id], [field]: Math.max(0, val) } }));
    toast(`Salary updated`, 'success');
  };

  const showToast = useCallback((msg: string) => {
    toast(msg, 'success');
  }, [toast]);

  const setAttCell = (name: string, dayIdx: number, status: AttStatus, checkIn: string | null) => {
    setAttState(prev => {
      const row = [...(prev[name] ?? Array(7).fill('HOLIDAY'))];
      row[dayIdx] = status;
      return { ...prev, [name]: row };
    });
    setCheckInState(prev => {
      const row = [...(prev[name] ?? Array(7).fill(null))];
      row[dayIdx] = checkIn;
      return { ...prev, [name]: row };
    });
    showToast(`Marked ${name} as ${status === 'HALF' ? 'Half Day' : status.charAt(0) + status.slice(1).toLowerCase()} for ${DAYS_OF_WEEK[dayIdx]}`);
  };

  const markAllToday = (status: AttStatus) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    const newCheckIn = (status === 'PRESENT' || status === 'HALF') ? timeStr : null;
    setAttState(prev => {
      const next = { ...prev };
      staff.forEach(m => {
        const row = [...(next[m.name] ?? Array(7).fill('HOLIDAY'))];
        row[TODAY_COL] = status;
        next[m.name] = row;
      });
      return next;
    });
    setCheckInState(prev => {
      const next = { ...prev };
      staff.forEach(m => {
        const row = [...(next[m.name] ?? Array(7).fill(null))];
        row[TODAY_COL] = newCheckIn;
        next[m.name] = row;
      });
      return next;
    });
    showToast(`Marked all ${staff.length} staff as ${status === 'HALF' ? 'Half Day' : status.charAt(0) + status.slice(1).toLowerCase()} for today`);
  };

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  const totalSalary = staff.reduce((a, s) => a + s.salary + s.bonus, 0);
  const onDuty = staff.filter(s => s.status === 'On Duty').length;
  const totalHours = Math.round(staff.reduce((a, s) => a + s.hoursThisWeek, 0) / staff.length);

  const handleSave = (data: Partial<StaffMember>) => {
    if (editTarget && editTarget.id) {
      setStaff(prev => prev.map(m => m.id === editTarget.id ? { ...m, ...data } : m));
    } else {
      const newMember: StaffMember = {
        id: crypto.randomUUID(),
        name: data.name ?? '',
        role: data.role ?? 'Waiter',
        email: data.email ?? '',
        phone: data.phone ?? '',
        shift: data.shift ?? 'Morning',
        status: data.status ?? 'On Duty',
        salary: data.salary ?? 18000,
        bonus: data.bonus ?? 0,
        joined: `${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`,
        hoursThisWeek: 0,
        ordersToday: 0,
      };
      setStaff(prev => [...prev, newMember]);
    }
  };

  const togglePaid = (id: string) => {
    setPaidSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const monthlyTotal = staff.reduce((a, m) => a + m.salary + m.bonus, 0);
  const paidTotal    = staff.filter(m => paidSet.has(m.id)).reduce((a, m) => a + m.salary + m.bonus, 0);

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Staff</h1>
          <p className={styles.pageSubtitle}>{staff.length} team members · {onDuty} on duty now</p>
        </div>
        <div className={styles.headerActions}>
          <MagneticButton variant="secondary">Export CSV</MagneticButton>
          <MagneticButton variant="primary" onClick={() => setEditTarget(null)}>+ Add Member</MagneticButton>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom:'1.75rem' }}>
        {[
          { label:'Total Staff',      value: staff.length,             prefix:'',   suffix:'',   decimals:0, colorClass:'statIconBlue' },
          { label:'On Duty Now',      value: onDuty,                   prefix:'',   suffix:'',   decimals:0, colorClass:'statIconGreen' },
          { label:'Total Salary/mo',  value: totalSalary/1000,         prefix:'₹',  suffix:'k',  decimals:0, colorClass:'statIconOrange' },
          { label:'Avg Hours / Week', value: totalHours,               prefix:'',   suffix:'h',  decimals:0, colorClass:'statIconPurple' },
        ].map((stat, i) => (
          <div key={i} className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles[stat.colorClass as keyof typeof styles]}`}>
              {i===0 && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              )}
              {i===1 && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              )}
              {i===2 && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              )}
              {i===3 && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              )}
            </div>
            <div className={styles.statValue}>
              <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.decimals} />
            </div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className={s.tabRow}>
        {(['overview','attendance','salary'] as const).map(t => (
          <button key={t} className={`${s.tab} ${tab === t ? s.tabActive : ''}`} onClick={() => setTab(t)}>
            {t === 'overview'    && '👥 Overview'}
            {t === 'attendance'  && '📅 Attendance'}
            {t === 'salary'      && '💰 Salary'}
          </button>
        ))}
      </div>

      {/* ══════════════════════
          TAB: OVERVIEW
      ══════════════════════ */}
      {tab === 'overview' && (
        <>
          {/* Search */}
          <div className={s.searchRow}>
            <div className={s.searchWrap}>
              <svg className={s.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className={s.searchInput}
                placeholder="Search by name or role…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Staff Cards */}
          <div className={s.staffGrid}>
            {filtered.map((m, idx) => (
              <PremiumCard 
                key={m.id} 
                delay={idx * 0.04} 
                glowColor={m.status === 'On Duty' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.1)'}
              >
                <div className={s.staffCard}>
                  <div className={s.staffCardTop}>
                    <div className={s.staffCardAvatarWrap}>
                      <div className={s.staffCardAvatar}>{initials(m.name)}</div>
                      <div>
                      <div className={s.staffCardName}>{m.name}</div>
                      <div className={s.staffCardRole}>
                        <span className={`${styles.badge} ${styles[ROLE_COLORS[m.role] as keyof typeof styles]}`}>{m.role}</span>
                      </div>
                    </div>
                  </div>
                  <button className={s.staffCardEditBtn} onClick={() => setEditTarget(m)}>Edit</button>
                </div>

                {/* Mini stats */}
                <div className={s.staffCardStats}>
                  <div className={s.staffCardStat}>
                    <div className={s.staffCardStatLabel}>Hours/Week</div>
                    <div className={s.staffCardStatVal}>{m.hoursThisWeek}h</div>
                  </div>
                  <div className={s.staffCardStat}>
                    <div className={s.staffCardStatLabel}>Today Orders</div>
                    <div className={s.staffCardStatVal}>{m.ordersToday}</div>
                  </div>
                  <div className={s.staffCardStat}>
                    <div className={s.staffCardStatLabel}>Joined</div>
                    <div className={s.staffCardStatVal} style={{fontSize:'0.8rem'}}>{m.joined}</div>
                  </div>
                  <div className={s.staffCardStat}>
                    <div className={s.staffCardStatLabel}>Phone</div>
                    <div className={s.staffCardStatVal} style={{fontSize:'0.75rem'}}>{m.phone}</div>
                  </div>
                </div>

                {/* Hours chart */}
                <div className={s.hoursChart}>
                  {DAYS_OF_WEEK.map((d, i) => {
                    const base = m.hoursThisWeek;
                    const h = i === 6 ? 0 : Math.max(0, Math.round(base/7 + (Math.sin((idx+1) * i + 1) * 2)));
                    const pct = (h / 12) * 100;
                    return (
                      <div key={d} className={s.hoursBarWrap}>
                        <div className={s.hoursBar} style={{ height: `${pct}%`, background: h === 0 ? 'rgba(255,255,255,0.08)' : undefined }} />
                        <span className={s.hoursBarLabel}>{d[0]}</span>
                      </div>
                    );
                  })}
                </div>

                <div className={s.staffCardFooter}>
                  <div className={s.shiftBadge}>
                    <div style={{width:'6px',height:'6px',borderRadius:'50%',background:m.status==='On Duty'?'#34d399':'#64748b'}} />
                    {m.shift}
                  </div>
                  <div className={s.salaryBadge}>₹{(m.salary/1000).toFixed(0)}k/mo</div>
                </div>
              </div>
            </PremiumCard>
          ))}
        </div>
        </>
      )}

      {/* ══════════════════════
          TAB: ATTENDANCE
      ══════════════════════ */}
      {tab === 'attendance' && (
        <>
          {/* ── Quick Mark Toolbar ── */}
          <div className={s.attToolbar}>
            <div className={s.attToolbarLeft}>
              <span className={s.attToolbarLabel}>Mark Today for All:</span>
              {ATT_OPTIONS.filter(o => o.status !== 'HOLIDAY').map(opt => (
                <button
                  key={opt.status}
                  className={s.attQuickBtn}
                  style={{ '--att-color': opt.color } as React.CSSProperties}
                  onClick={() => markAllToday(opt.status)}
                >
                  <span>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
            <div className={s.attToolbarRight}>
              <span className={s.attLegendItem}><span className={s.attDotPresent} /> Present</span>
              <span className={s.attLegendItem}><span className={s.attDotAbsent} /> Absent</span>
              <span className={s.attLegendItem}><span className={s.attDotHalf} /> Half</span>
              <span className={s.attLegendItem}><span className={s.attDotLeave} /> Leave</span>
            </div>
          </div>

          {/* ── Attendance Table ── */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Weekly Attendance — Sep 1–7, 2026</div>
              <div className={s.weekNav}>
                <button className={s.weekNavBtn}>‹</button>
                <span className={s.weekLabel}>Sep 1 – Sep 7, 2026</span>
                <button className={s.weekNavBtn}>›</button>
              </div>
            </div>

            {/* ── Summary row ── */}
            <div className={s.attSummaryRow}>
              {DAYS_OF_WEEK.map((d, i) => {
                const presentCount = staff.filter(m => (attState[m.name] ?? [])[i] === 'PRESENT').length;
                const absentCount  = staff.filter(m => (attState[m.name] ?? [])[i] === 'ABSENT').length;
                const isToday = i === TODAY_COL;
                return (
                  <div key={d} className={`${s.attSummaryDay} ${isToday ? s.attSummaryDayToday : ''}`}>
                    <span className={s.attSummaryDayName}>{d}</span>
                    <span className={s.attSummaryPresent}>{presentCount}P</span>
                    <span className={s.attSummaryAbsent}>{absentCount}A</span>
                  </div>
                );
              })}
            </div>

            <div style={{ overflowX:'auto' }}>
              <table className={s.attendanceTable}>
                <thead>
                  <tr>
                    <th style={{minWidth:170}}>Staff Member</th>
                    {DAYS_OF_WEEK.map((d, i) => (
                      <th key={d} style={i === TODAY_COL ? {background:'rgba(234,88,12,0.07)'} : {}}>
                        <div className={s.dayCell}>
                          <span className={s.dayName}>{d}</span>
                          <span className={`${s.dayNum} ${i === TODAY_COL ? s.dayNumToday : ''}`}>{i + 1}</span>
                          {i === TODAY_COL && <span className={s.todayLabel}>Today</span>}
                        </div>
                      </th>
                    ))}
                    <th>Hrs</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(m => {
                    const attRow   = attState[m.name]   ?? Array(7).fill('HOLIDAY') as AttStatus[];
                    const checkRow = checkInState[m.name] ?? Array(7).fill(null);
                    const presentDays = attRow.filter(a => a === 'PRESENT').length;
                    const halfDays    = attRow.filter(a => a === 'HALF').length;
                    const absentDays  = attRow.filter(a => a === 'ABSENT').length;
                    const totalHrs    = presentDays * 8 + halfDays * 4;
                    const todayStatus = attRow[TODAY_COL];
                    return (
                      <tr key={m.id}>
                        <td>
                          <div className={styles.userRow}>
                            <div className={styles.avatar}>{initials(m.name)}</div>
                            <div>
                              <div className={styles.userRowName}>{m.name}</div>
                              <div className={styles.userRowEmail}>{m.role} · {m.shift}</div>
                            </div>
                          </div>
                        </td>
                        {attRow.map((a, i) => (
                          <td key={i} style={{
                            textAlign:'center',
                            background: i === TODAY_COL ? 'rgba(234,88,12,0.04)' : undefined,
                          }}>
                            <AttCell
                              status={a}
                              checkIn={checkRow[i]}
                              isToday={i === TODAY_COL}
                              onChange={(st, ci) => setAttCell(m.name, i, st, ci)}
                            />
                          </td>
                        ))}
                        <td style={{fontWeight:700, color:'#fff', whiteSpace:'nowrap'}}>{totalHrs}h</td>
                        <td>
                          <div style={{display:'flex',flexDirection:'column',gap:'0.2rem'}}>
                            <span style={{fontSize:'0.7rem',color:'#34d399',fontWeight:600}}>{presentDays}P</span>
                            {absentDays > 0 && <span style={{fontSize:'0.7rem',color:'#f87171',fontWeight:600}}>{absentDays}A</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════
          TAB: SALARY
      ══════════════════════ */}
      {tab === 'salary' && (
        <>
          {/* Month Navigator */}
          <div className={s.salaryMonth}>
            <button className={s.salaryMonthBtn} onClick={() => setSalaryMonth(m => Math.max(0, m - 1))}>‹</button>
            <span className={s.salaryMonthLabel}>{MONTHS[salaryMonth]} 2026</span>
            <button className={s.salaryMonthBtn} onClick={() => setSalaryMonth(m => Math.min(11, m + 1))}>›</button>
          </div>

          {/* Summary Banner */}
          <div className={s.salaryTotalBanner}>
            <div>
              <div className={s.salaryTotalLabel}>Total Payroll — {MONTHS[salaryMonth]}</div>
              <div className={s.salaryTotalVal}>₹{(monthlyTotal).toLocaleString('en-IN')}</div>
              <div style={{marginTop:'0.4rem', fontSize:'0.8rem', color:'rgba(255,255,255,0.35)'}}>
                Paid: ₹{paidTotal.toLocaleString('en-IN')} · Pending: ₹{(monthlyTotal - paidTotal).toLocaleString('en-IN')}
              </div>
            </div>
            <button className={s.payAllBtn} onClick={() => setPaidSet(new Set(staff.map(m => m.id)))}>
              ✓ Mark All Paid
            </button>
          </div>

          {/* Salary Table */}
          <div className={styles.card}>
            <div className={s.salaryEditHint}>
              <span className={s.salaryEditHintIcon}>✎</span>
              Click any salary, bonus, or deduction value to edit it inline
            </div>
            <table className={s.salaryTable}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Base Salary</th>
                  <th>Bonus</th>
                  <th>Absent Deduction</th>
                  <th>Extra Deduction</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(m => {
                  const ov = salaryOverrides[m.id] ?? { salary: m.salary, bonus: m.bonus, deduction: 0 };
                  const attRow = attState[m.name] ?? Array(7).fill('HOLIDAY') as AttStatus[];
                  const absentDays = attRow.filter((a: AttStatus) => a === 'ABSENT').length;
                  const absentDeduction = Math.round((absentDays / 26) * ov.salary);
                  const net = ov.salary + ov.bonus - absentDeduction - ov.deduction;
                  const paid = paidSet.has(m.id);
                  return (
                    <tr key={m.id}>
                      <td>
                        <div className={styles.userRow}>
                          <div className={styles.avatar}>{initials(m.name)}</div>
                          <div>
                            <div className={styles.userRowName}>{m.name}</div>
                            <div className={styles.userRowEmail}>{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`${styles.badge} ${styles[ROLE_COLORS[m.role] as keyof typeof styles]}`}>{m.role}</span></td>

                      {/* ── Editable: Base Salary ── */}
                      <td>
                        <InlineEdit
                          value={ov.salary}
                          onSave={v => updateSalary(m.id, 'salary', v)}
                        />
                      </td>

                      {/* ── Editable: Bonus ── */}
                      <td>
                        <InlineEdit
                          value={ov.bonus}
                          color="#34d399"
                          onSave={v => updateSalary(m.id, 'bonus', v)}
                        />
                      </td>

                      {/* ── Auto: Absent-based deduction ── */}
                      <td>
                        {absentDeduction > 0
                          ? <span className={s.deductionRed}>−₹{absentDeduction.toLocaleString('en-IN')}<br /><span style={{fontSize:'0.65rem',color:'rgba(255,255,255,0.3)',fontWeight:500}}>{absentDays} absent day{absentDays>1?'s':''}</span></span>
                          : <span style={{color:'rgba(255,255,255,0.25)'}}>—</span>
                        }
                      </td>

                      {/* ── Editable: Manual extra deduction ── */}
                      <td>
                        <InlineEdit
                          value={ov.deduction}
                          color={ov.deduction > 0 ? '#f87171' : 'rgba(255,255,255,0.35)'}
                          onSave={v => updateSalary(m.id, 'deduction', v)}
                        />
                      </td>

                      <td className={s.netPay} style={{color: net < 0 ? '#f87171' : '#fff'}}>₹{Math.max(0,net).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`${s.payStatus} ${paid ? s.payStatusPaid : s.payStatusPending}`}>
                          {paid ? '✓ Paid' : '⏳ Pending'}
                        </span>
                      </td>
                      <td>
                        <div style={{display:'flex',gap:'0.375rem',flexDirection:'column'}}>
                          {!paid && (
                            <button className={s.markPaidBtn} onClick={() => togglePaid(m.id)}>Mark Paid</button>
                          )}
                          {paid && (
                            <button className={s.markPaidBtn} onClick={() => togglePaid(m.id)} style={{color:'rgba(239,68,68,0.7)'}}>Undo</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Modal ── */}
      {editTarget !== undefined && (
        <StaffModal
          staff={editTarget}
          onClose={() => setEditTarget(undefined)}
          onSave={handleSave}
        />
      )}

    </div>
  );
}
