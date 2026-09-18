'use client';

import { useState, useRef, useEffect } from 'react';
import { PremiumCard } from '@/components/PremiumCard';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { MagneticButton } from '@/components/MagneticButton';
import { useToast } from '@/contexts/ToastContext';
import styles from '../shared.module.css';
import s from './inventory.module.css';
import { useRouter } from 'next/navigation';
import { saveInventoryItem, deleteInventoryItem, adjustInventoryQuantity } from '@/app/actions/inventoryActions';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  emoji: string;
  unit: string;        // "kg", "L", "pcs", etc.
  unitSize: string;    // "500g per bag", "1L bottle", "250ml", ""
  qty: number;
  minQty: number;
  costPerUnit: number;
  supplier: string;
}

export interface Transaction {
  id: string;
  itemName: string;
  type: 'IN' | 'OUT';
  qty: number;
  unit: string;
  notes: string;
  date: string;
}

const CATEGORIES = ['All','Food','Beverages','Supplies','Cleaning'];
const SORT_OPTIONS = ['Name A–Z','Name Z–A','Qty: High','Qty: Low','Value: High','Status'] as const;
type SortOpt = typeof SORT_OPTIONS[number];

const UNIT_PRESETS = ['kg','g','L','ml','pcs','packs','bottles','cans','boxes','bags','rolls','dozen','trays','sheets'];

/* ── Helpers ── */
function stockStatus(item: InventoryItem) {
  if (item.qty === 0) return 'OUT';
  if (item.qty <= item.minQty) return 'LOW';
  return 'OK';
}
function stockPct(item: InventoryItem) {
  const max = Math.max(item.qty, item.minQty * 3, 10);
  return Math.min(100, (item.qty / max) * 100);
}
function stockColor(item: InventoryItem) {
  const st = stockStatus(item);
  if (st === 'OUT') return '#ef4444';
  if (st === 'LOW') return '#f97316';
  return '#10b981';
}
function sortItems(items: InventoryItem[], sort: SortOpt) {
  const copy = [...items];
  if (sort === 'Name A–Z') return copy.sort((a,b) => a.name.localeCompare(b.name));
  if (sort === 'Name Z–A') return copy.sort((a,b) => b.name.localeCompare(a.name));
  if (sort === 'Qty: High') return copy.sort((a,b) => b.qty - a.qty);
  if (sort === 'Qty: Low')  return copy.sort((a,b) => a.qty - b.qty);
  if (sort === 'Value: High') return copy.sort((a,b) => b.qty*b.costPerUnit - a.qty*a.costPerUnit);
  if (sort === 'Status') return copy.sort((a,b) => { const o:Record<string,number>={OUT:0,LOW:1,OK:2}; return o[stockStatus(a)]-o[stockStatus(b)]; });
  return copy;
}

/* ── Donut Chart ── */
function DonutChart({ items }: { items: InventoryItem[] }) {
  const cats   = ['Food','Beverages','Supplies','Cleaning'];
  const colors = ['#f97316','#60a5fa','#34d399','#a78bfa'];
  const totals = cats.map(cat => items.filter(i => i.category === cat).reduce((a,i) => a+i.qty*i.costPerUnit, 0));
  const grand  = totals.reduce((a,t) => a+t, 0) || 1;
  const pcts   = totals.map(t => t/grand);
  const R = 45, cx = 65, cy = 65, stroke = 18, circ = 2*Math.PI*R;
  let offset = 0;
  return (
    <div className={s.donutWrap}>
      <svg className={s.donutSvg} viewBox="0 0 130 130">
        {pcts.map((p,i) => {
          const dash = p*circ, gap = circ-dash;
          const el = <circle key={i} cx={cx} cy={cy} r={R} fill="none" stroke={colors[i]} strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset*circ}
            style={{transition:'stroke-dasharray 0.5s ease'}} />;
          offset += p; return el;
        })}
        <text className={s.donutCenter} x={cx} y={cy-4} textAnchor="middle" dominantBaseline="middle">₹{(grand/1000).toFixed(1)}k</text>
        <text className={s.donutSub}    x={cx} y={cy+10} textAnchor="middle" dominantBaseline="middle">Total Value</text>
      </svg>
      <div className={s.donutLegend}>
        {cats.map((cat,i) => (
          <div key={cat} className={s.legendRow}>
            <div className={s.legendDot} style={{background:colors[i]}} />
            <span className={s.legendLabel}>{cat}</span>
            <span className={s.legendPct}>{Math.round(pcts[i]*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Unit Input — preset dropdown + free-text ── */
function UnitInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [custom, setCustom] = useState(!UNIT_PRESETS.includes(value));
  return (
    <div style={{display:'flex', gap:'0.5rem', flexDirection:'column'}}>
      <select className={s.formSelect} value={custom ? '__custom__' : value}
        onChange={e => { if (e.target.value === '__custom__') { setCustom(true); onChange(''); } else { setCustom(false); onChange(e.target.value); } }}>
        {UNIT_PRESETS.map(u => <option key={u} value={u}>{u}</option>)}
        <option value="__custom__">Custom…</option>
      </select>
      {custom && (
        <input className={s.formInput} placeholder="e.g. 500ml, dozen, trays" value={value}
          onChange={e => onChange(e.target.value)} autoFocus />
      )}
    </div>
  );
}

/* ── Item Add/Edit Modal ── */
const EMOJIS: Record<string,string> = { Food:'🌾', Beverages:'🥤', Supplies:'📦', Cleaning:'🧴' };

interface ItemModalProps { item?: InventoryItem|null; onClose:()=>void; onSave:(d:Partial<InventoryItem>)=>void; }

function ItemModal({ item, onClose, onSave }: ItemModalProps) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    name:        item?.name        ?? '',
    category:    item?.category    ?? 'Food',
    unit:        item?.unit        ?? 'kg',
    unitSize:    item?.unitSize    ?? '',
    qty:         item?.qty         ?? 0,
    minQty:      item?.minQty      ?? 5,
    costPerUnit: item?.costPerUnit ?? 0,
    supplier:    item?.supplier    ?? '',
  });
  const set = (k: string, v: string|number) => setForm(f => ({...f, [k]:v}));

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} style={{maxWidth:'560px'}} onClick={e => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <div className={s.modalTitle}>{isEdit ? `Edit — ${item!.name}` : 'Add Stock Item'}</div>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={s.modalBody}>
          {/* Name */}
          <div className={s.formGroup}>
            <label className={s.formLabel}>Item Name</label>
            <input className={s.formInput} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Basmati Rice" />
          </div>

          {/* Category */}
          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Category</label>
              <select className={s.formSelect} value={form.category} onChange={e => set('category', e.target.value)}>
                {['Food','Beverages','Supplies','Cleaning'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Supplier</label>
              <input className={s.formInput} value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="Supplier name" />
            </div>
          </div>

          {/* Unit + Unit Size */}
          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Measurement Unit</label>
              <UnitInput value={form.unit} onChange={v => set('unit', v)} />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Pack / Size Description</label>
              <input className={s.formInput} value={form.unitSize} onChange={e => set('unitSize', e.target.value)}
                placeholder="e.g. 500g pack, 1L bottle" />
              <div style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.25)',marginTop:'0.3rem'}}>
                Describe the physical pack size
              </div>
            </div>
          </div>

          {/* Qty / Min / Cost */}
          <div className={s.formRow3}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Current Qty ({form.unit||'unit'})</label>
              <input className={s.formInput} type="number" min={0} step="0.5" value={form.qty} onChange={e => set('qty', Number(e.target.value))} />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Min Stock Alert</label>
              <input className={s.formInput} type="number" min={0} value={form.minQty} onChange={e => set('minQty', Number(e.target.value))} />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Cost / {form.unit||'unit'} (₹)</label>
              <input className={s.formInput} type="number" min={0} step="0.5" value={form.costPerUnit} onChange={e => set('costPerUnit', Number(e.target.value))} />
            </div>
          </div>

          {/* Live preview */}
          {form.name && (
            <div className={s.itemPreview}>
              <span style={{fontSize:'1.5rem'}}>{EMOJIS[form.category]??'📦'}</span>
              <div>
                <div style={{fontWeight:700,color:'#fff',fontSize:'0.9rem'}}>{form.name}</div>
                <div style={{fontSize:'0.75rem',color:'rgba(255,255,255,0.4)'}}>
                  {form.qty} {form.unit}{form.unitSize ? ` · ${form.unitSize}` : ''} · ₹{form.costPerUnit}/{form.unit} · Total: ₹{(form.qty*form.costPerUnit).toLocaleString('en-IN')}
                </div>
              </div>
              <span className={`${s.stockBadge} ${form.qty===0?s.stockOut:form.qty<=form.minQty?s.stockLow:s.stockOk}`}>
                {form.qty===0?'✕ Out':form.qty<=form.minQty?'⚠ Low':'✓ OK'}
              </span>
            </div>
          )}
        </div>
        <div className={s.modalFooter}>
          <button className={s.modalBtnSecondary} onClick={onClose}>Cancel</button>
          <button className={s.modalBtnPrimary}
            onClick={() => { onSave({...form, emoji: EMOJIS[form.category]??'📦'}); onClose(); }}
            disabled={!form.name.trim()}>
            {isEdit ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Adjust Qty Modal ── */
interface AdjustModalProps { item: InventoryItem; onClose:()=>void; onSave:(id:string,newQty:number,type:'IN'|'OUT',notes:string)=>void; }

function AdjustModal({ item, onClose, onSave }: AdjustModalProps) {
  const [adj,   setAdj]   = useState(1);
  const [type,  setType]  = useState<'IN'|'OUT'>('IN');
  const [notes, setNotes] = useState('');
  const [inputVal, setInputVal] = useState('1');
  const newQty = type === 'IN' ? item.qty + adj : Math.max(0, item.qty - adj);

  const setAdjFromInput = (v: string) => {
    setInputVal(v);
    const n = parseFloat(v);
    if (!isNaN(n) && n > 0) setAdj(n);
  };

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
            <span style={{fontSize:'1.5rem'}}>{item.emoji}</span>
            <div className={s.modalTitle}>Adjust Stock — {item.name}</div>
          </div>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={s.modalBody}>
          {/* IN / OUT toggle */}
          <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.25rem'}}>
            {(['IN','OUT'] as const).map(t => (
              <button key={t} onClick={() => setType(t)} style={{
                flex:1, padding:'0.65rem', borderRadius:'12px', fontWeight:700, fontSize:'0.9rem',
                fontFamily:'Inter,sans-serif', cursor:'pointer',
                border: type===t ? 'none' : '1px solid rgba(255,255,255,0.1)',
                background: type===t ? (t==='IN'?'linear-gradient(135deg,#10b981,#059669)':'linear-gradient(135deg,#ef4444,#dc2626)') : 'rgba(255,255,255,0.05)',
                color: type===t ? '#fff' : 'rgba(255,255,255,0.5)',
                boxShadow: type===t ? (t==='IN'?'0 4px 14px rgba(16,185,129,0.3)':'0 4px 14px rgba(239,68,68,0.3)') : 'none',
                transition:'all 0.2s',
              }}>
                {t==='IN' ? '⬆ Stock In' : '⬇ Stock Out'}
              </button>
            ))}
          </div>

          {/* Qty adjuster */}
          <div className={s.formGroup}>
            <label className={s.formLabel}>Quantity ({item.unit}) {item.unitSize && <span style={{color:'rgba(255,255,255,0.3)',fontWeight:400}}>· {item.unitSize}</span>}</label>
            <div className={s.qtyAdjuster}>
              <button className={s.qtyAdjBtn} onClick={() => { const v = Math.max(0.5, adj-1); setAdj(v); setInputVal(String(v)); }}>−</button>
              <div style={{flex:1,textAlign:'center'}}>
                <input
                  className={s.qtyAdjInput}
                  type="number" min="0.5" step="0.5"
                  value={inputVal}
                  onChange={e => setAdjFromInput(e.target.value)}
                />
                <div className={s.qtyAdjUnit}>{item.unit}</div>
              </div>
              <button className={s.qtyAdjBtn} onClick={() => { const v = adj+1; setAdj(v); setInputVal(String(v)); }}>+</button>
            </div>
          </div>

          {/* Before → After */}
          <div style={{display:'flex',gap:'1.5rem',marginBottom:'1.25rem',padding:'1rem 1.25rem',background:'rgba(255,255,255,0.04)',borderRadius:'14px',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div>
              <div style={{fontSize:'0.65rem',color:'rgba(255,255,255,0.3)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'0.25rem'}}>Current</div>
              <div style={{fontWeight:800,color:'#fff',fontSize:'1.125rem'}}>{item.qty} <span style={{fontSize:'0.8rem',color:'rgba(255,255,255,0.4)',fontWeight:500}}>{item.unit}</span></div>
              {item.unitSize && <div style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.25)',marginTop:'0.15rem'}}>{item.unitSize}</div>}
            </div>
            <div style={{fontSize:'1.5rem',color:'rgba(255,255,255,0.2)',alignSelf:'center'}}>→</div>
            <div>
              <div style={{fontSize:'0.65rem',color:'rgba(255,255,255,0.3)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'0.25rem'}}>After</div>
              <div style={{fontWeight:800,fontSize:'1.125rem',color:type==='IN'?'#34d399':'#f87171'}}>{newQty} <span style={{fontSize:'0.8rem',color:'rgba(255,255,255,0.4)',fontWeight:500}}>{item.unit}</span></div>
              <div style={{fontSize:'0.7rem',color:newQty<=item.minQty?'#f87171':'rgba(255,255,255,0.3)',marginTop:'0.15rem'}}>
                {newQty === 0 ? '⚠ Will be OUT of stock' : newQty <= item.minQty ? `⚠ Below min (${item.minQty} ${item.unit})` : `Min: ${item.minQty} ${item.unit}`}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className={s.formGroup}>
            <label className={s.formLabel}>Notes (optional)</label>
            <input className={s.formInput} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Kitchen usage, Supplier delivery, Wastage…" />
          </div>
        </div>
        <div className={s.modalFooter}>
          <button className={s.modalBtnSecondary} onClick={onClose}>Cancel</button>
          <button className={s.modalBtnPrimary}
            style={type==='OUT'?{background:'linear-gradient(135deg,#ef4444,#dc2626)',boxShadow:'0 4px 14px rgba(239,68,68,0.3)'}:{}}
            onClick={() => { onSave(item.id, newQty, type, notes||(type==='IN'?'Stock in':'Stock out')); onClose(); }}>
            Confirm {type==='IN'?'Stock In':'Stock Out'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Confirm Modal ── */
function DeleteModal({ item, onClose, onDelete }: { item: InventoryItem; onClose:()=>void; onDelete:()=>void }) {
  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} style={{maxWidth:'420px'}} onClick={e => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <div className={s.modalTitle}>Delete Item</div>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={s.modalBody}>
          <div style={{textAlign:'center',padding:'1rem 0'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>{item.emoji}</div>
            <div style={{fontWeight:700,color:'#fff',fontSize:'1.1rem',marginBottom:'0.5rem'}}>{item.name}</div>
            <div style={{color:'rgba(255,255,255,0.4)',fontSize:'0.875rem'}}>
              This will permanently remove the item and all its data from inventory. This action cannot be undone.
            </div>
          </div>
        </div>
        <div className={s.modalFooter}>
          <button className={s.modalBtnSecondary} onClick={onClose}>Cancel</button>
          <button onClick={() => { onDelete(); onClose(); }}
            style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',background:'linear-gradient(135deg,#ef4444,#dc2626)',color:'#fff',border:'none',
              padding:'0.75rem 1.5rem',borderRadius:'12px',fontSize:'0.875rem',fontWeight:700,cursor:'pointer',
              fontFamily:'Inter,sans-serif',boxShadow:'0 4px 14px rgba(239,68,68,0.3)'}}>
            🗑 Delete Item
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function InventoryClient({ initialItems, initialTransactions }: { initialItems: InventoryItem[], initialTransactions: Transaction[] }) {
  const [items, setItems]   = useState<InventoryItem[]>(initialItems);
  const [txns, setTxns]     = useState<Transaction[]>(initialTransactions);
  const router = useRouter();


  useEffect(() => setItems(initialItems), [initialItems]);
  useEffect(() => setTxns(initialTransactions), [initialTransactions]);

  const [view, setView]     = useState<'grid'|'list'>('grid');
  const [cat, setCat]       = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort]     = useState<SortOpt>('Name A–Z');
  const [hovered, setHovered] = useState<string|null>(null);
  const [addModal, setAddModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem|null>(null);
  const [adjItem, setAdjItem]   = useState<InventoryItem|null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem|null>(null);
  const [txnFilter, setTxnFilter] = useState<'ALL'|'IN'|'OUT'>('ALL');
  
  const { toast } = useToast();

  const showToast = (msg: string) => { toast(msg, 'success'); };

  /* filtering + sorting */
  const filtered = sortItems(
    items.filter(i =>
      (cat === 'All' || i.category === cat) &&
      (i.name.toLowerCase().includes(search.toLowerCase()) ||
       i.supplier.toLowerCase().includes(search.toLowerCase()) ||
       i.unitSize.toLowerCase().includes(search.toLowerCase()))
    ),
    sort
  );

  /* stats */
  const totalValue = items.reduce((a,i) => a + i.qty*i.costPerUnit, 0);
  const lowCount   = items.filter(i => stockStatus(i)==='LOW').length;
  const outCount   = items.filter(i => stockStatus(i)==='OUT').length;

  /* bar chart — top 10 by qty */
  const topItems = [...items].sort((a,b) => b.qty-a.qty).slice(0,10);
  const maxQty   = Math.max(...topItems.map(i => i.qty), 1);

  /* handlers */
  const handleSaveItem = async (data: Partial<InventoryItem>) => {
    console.log("[INVENTORY] Saving item:", data);
    try {
      const res = await saveInventoryItem(editItem?.id, data);
      console.log("[INVENTORY] Save response:", res);
      if (res.success) {
        if (editItem) {
          setItems(prev => prev.map(i => i.id===editItem.id ? {...i,...data} : i));
          showToast(`${data.name} updated`);
        } else {
          setItems(prev => [...prev, { ...data, id: res.item?.id ?? crypto.randomUUID() } as InventoryItem]);
          showToast(`${data.name} added to inventory`);
        }
        router.refresh();
      } else {
        console.error("[INVENTORY] Save failed:", res.error);
        showToast('Error: ' + res.error);
      }
    } catch (e: any) {
      console.error("[INVENTORY] Exception saving:", e);
      showToast('Error saving item: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    const item = items.find(i => i.id===id)!;
    try {
      const res = await deleteInventoryItem(id);
      if (res.success) {
        setItems(prev => prev.filter(i => i.id!==id));
        showToast(`${item.name} removed from inventory`);
        router.refresh();
      } else {
        showToast('Error deleting: ' + res.error);
      }
    } catch (e: any) {
      console.error("[INVENTORY] Delete error:", e);
      showToast('Error deleting item: ' + e.message);
    }
  };

  const handleAdjust = async (id: string, newQty: number, type: 'IN'|'OUT', notes: string) => {
    const item = items.find(i => i.id===id)!;
    const delta = Math.abs(newQty - item.qty);
    try {
      const res = await adjustInventoryQuantity(id, newQty, type, delta, notes);
      if (res.success) {
        setItems(prev => prev.map(i => i.id===id ? {...i, qty: newQty} : i));
        setTxns(prev => [{
          id: crypto.randomUUID(), itemName: item.name, type, qty: delta,
          unit: item.unit, notes,
          date: new Date().toLocaleString('en-IN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}),
        },...prev]);
        showToast(`${item.name}: ${type==='IN'?'+':'−'}${delta} ${item.unit} recorded`);
        router.refresh();
      } else {
        showToast('Error adjusting: ' + res.error);
      }
    } catch (e: any) {
      console.error("[INVENTORY] Adjust error:", e);
      showToast('Error adjusting quantity: ' + e.message);
    }
  };

  const filteredTxns = txnFilter==='ALL' ? txns : txns.filter(t => t.type===txnFilter);

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Inventory</h1>
          <p className={styles.pageSubtitle}>{items.length} items · {lowCount+outCount} need attention</p>
        </div>
        <div className={styles.headerActions}>
          <div className={s.viewToggle}>
            <button className={`${s.viewBtn} ${view==='grid'?s.viewBtnActive:''}`} onClick={() => setView('grid')}>⊞ Grid</button>
            <button className={`${s.viewBtn} ${view==='list'?s.viewBtnActive:''}`} onClick={() => setView('list')}>☰ List</button>
          </div>
          <MagneticButton variant="secondary">Export CSV</MagneticButton>
          <MagneticButton variant="primary" onClick={() => { setEditItem(null); setAddModal(true); }}>+ Add Item</MagneticButton>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className={styles.statsGrid} style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:'1.5rem'}}>
        {[
          {label:'Total Items',     value:items.length,        prefix:'',   suffix:'',   decimals:0, colorClass:'statIconBlue',   icon:'📦'},
          {label:'Stock Value',     value:totalValue/1000,     prefix:'₹',  suffix:'k',  decimals:1, colorClass:'statIconGreen',  icon:'💰'},
          {label:'Low Stock',       value:lowCount,            prefix:'',   suffix:'',   decimals:0, colorClass:'statIconOrange', icon:'⚠️'},
          {label:'Out of Stock',    value:outCount,            prefix:'',   suffix:'',   decimals:0, colorClass:'statIconPurple', icon:'❌'},
        ].map((stat,i) => (
          <div key={i} className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles[stat.colorClass as keyof typeof styles]}`} style={{fontSize:'1.1rem'}}>{stat.icon}</div>
            <div className={styles.statValue}>
              <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.decimals} />
            </div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Alert Banner ── */}
      {(lowCount+outCount) > 0 && (
        <div className={s.alertBanner}>
          <div className={s.alertIcon}>⚠️</div>
          <div style={{flex:1}}>
            <div className={s.alertText}>
              {outCount > 0 && <><strong style={{color:'#f87171'}}>{outCount} item{outCount!==1?'s':''}</strong> out of stock · </>}
              {lowCount > 0 && <><strong style={{color:'#fb923c'}}>{lowCount} item{lowCount!==1?'s':''}</strong> running low</>}
            </div>
            <div className={s.alertSub}>{items.filter(i => stockStatus(i)!=='OK').map(i => i.name).join(', ')}</div>
          </div>
          <button className={s.reorderBtn} onClick={() => showToast('Reorder list sent to suppliers!')}>📋 Reorder All</button>
        </div>
      )}

      {/* ── Charts Row ── */}
      <div className={s.chartsRow}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Top Items by Stock Quantity</div>
            <span style={{fontSize:'0.75rem',color:'rgba(255,255,255,0.3)',fontWeight:500}}>Top 10</span>
          </div>
          <div className={styles.cardBody}>
            <div className={s.barChart}>
              {topItems.map(item => {
                const pct = (item.qty/maxQty)*100;
                const st  = stockStatus(item);
                const color = st==='OUT'?'linear-gradient(to top,#ef4444,#f87171)':st==='LOW'?'linear-gradient(to top,#ea580c,#f97316)':'linear-gradient(to top,#10b981,#34d399)';
                return (
                  <div key={item.id} className={s.barWrap}
                    onMouseEnter={() => setHovered(item.id)}
                    onMouseLeave={() => setHovered(null)}>
                    {hovered===item.id && <div className={s.barTooltip}>{item.qty} {item.unit}</div>}
                    <div className={s.bar} style={{height:`${Math.max(pct,3)}%`,background:color}} />
                    <span className={s.barLabel}>{item.name.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardHeader}><div className={styles.cardTitle}>Value by Category</div></div>
          <div className={styles.cardBody}><DonutChart items={items} /></div>
        </div>
      </div>

      {/* ── Search / Sort / Filter ── */}
      <div className={s.topRow}>
        <div className={s.searchWrap}>
          <svg className={s.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input className={s.searchInput} placeholder="Search items, suppliers, or pack size…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className={s.sortWrap}>
          <span className={s.sortLabel}>Sort:</span>
          <select className={s.sortSelect} value={sort} onChange={e => setSort(e.target.value as SortOpt)}>
            {SORT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div className={s.filterRow}>
        {CATEGORIES.map(c => {
          const count = c==='All' ? items.length : items.filter(i => i.category===c).length;
          const attentionCount = c==='All'
            ? items.filter(i => stockStatus(i)!=='OK').length
            : items.filter(i => i.category===c && stockStatus(i)!=='OK').length;
          return (
            <button key={c} className={`${s.filterPill} ${cat===c?s.filterPillActive:''}`} onClick={() => setCat(c)}>
              {c}
              <span className={s.pillCount}>{count}</span>
              {attentionCount > 0 && <span className={s.pillAlert}>{attentionCount}⚠</span>}
            </button>
          );
        })}
      </div>

      {/* ── Results count ── */}
      <div className={s.resultsCount}>
        Showing {filtered.length} of {items.length} items
        {search && <> matching "<strong>{search}</strong>"</>}
      </div>

      {/* ══════════════════ GRID VIEW ══════════════════ */}
      {view === 'grid' && (
        <div className={s.itemGrid}>
          {filtered.map((item, idx) => {
            const st  = stockStatus(item);
            const pct = stockPct(item);
            const col = stockColor(item);
            const delay = idx * 0.04;
            const glow = st === 'OUT' ? 'rgba(239,68,68,0.2)' : st === 'LOW' ? 'rgba(234,88,12,0.2)' : 'rgba(16,185,129,0.15)';
            return (
              <PremiumCard
                key={item.id}
                delay={delay}
                activePulse={st === 'OUT' ? 'out' : st === 'LOW' ? 'low' : null}
                glowColor={glow}
              >
                <div className={s.itemCard}>
                  <div className={s.itemCardImg}>{item.emoji}</div>
                  <div className={s.itemCardBody}>
                    <div className={s.itemCardName}>{item.name}</div>
                    <div className={s.itemCardCat}>{item.category} · {item.supplier}</div>
                    {item.unitSize && <div className={s.itemCardUnitSize}>{item.unitSize}</div>}

                  <div className={s.itemCardQtyRow}>
                    <div>
                      <div className={s.itemCardQty}>{item.qty}</div>
                      <div className={s.itemCardUnit}>{item.unit}</div>
                    </div>
                    <span className={`${s.stockBadge} ${st==='OK'?s.stockOk:st==='LOW'?s.stockLow:s.stockOut}`}>
                      {st==='OK'?'✓ OK':st==='LOW'?'⚠ Low':'✕ Out'}
                    </span>
                  </div>

                  <div className={s.stockBar}><div className={s.stockBarFill} style={{width:`${pct}%`,background:col,animationDelay:`${delay}s`}} /></div>
                  <div style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.25)',marginBottom:'0.75rem'}}>
                    Min: {item.minQty} {item.unit} · ₹{item.costPerUnit}/{item.unit}
                  </div>

                    <div className={s.itemCardFooter}>
                      <span className={s.itemCardCost}>₹{(item.qty*item.costPerUnit).toLocaleString('en-IN')}</span>
                      <div style={{display:'flex',gap:'0.375rem'}}>
                        <button className={s.itemCardEditBtn} onClick={() => setAdjItem(item)}>± Qty</button>
                        <button className={s.itemCardEditBtn} onClick={() => { setEditItem(item); setAddModal(false); }}>Edit</button>
                        <button className={s.itemCardDeleteBtn} onClick={() => setDeleteItem(item)} title="Delete">🗑</button>
                      </div>
                    </div>
                  </div>
                </div>
              </PremiumCard>
            );
          })}
        </div>
      )}

      {/* ══════════════════ LIST VIEW ══════════════════ */}
      {view === 'list' && (
        <div className={styles.card} style={{marginBottom:'1.5rem'}}>
          <div style={{overflowX:'auto'}}>
            <table className={s.listTable}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Unit / Pack Size</th>
                  <th>Quantity</th>
                  <th>Min</th>
                  <th>Cost/Unit</th>
                  <th>Total Value</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const st  = stockStatus(item);
                  const pct = stockPct(item);
                  const col = stockColor(item);
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:'0.625rem'}}>
                          <span style={{fontSize:'1.25rem'}}>{item.emoji}</span>
                          <span style={{fontWeight:600,color:'#fff'}}>{item.name}</span>
                        </div>
                      </td>
                      <td><span className={`${styles.badge} ${styles.badgeGray}`}>{item.category}</span></td>
                      <td>
                        <div style={{fontWeight:600,color:'rgba(255,255,255,0.75)',fontSize:'0.85rem'}}>{item.unit}</div>
                        {item.unitSize && <div style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.3)'}}>{item.unitSize}</div>}
                      </td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:'0.625rem'}}>
                          <span className={s.qtyCell}>{item.qty}</span>
                          <div className={s.miniStockBar}>
                            <div className={s.miniStockBarFill} style={{width:`${pct}%`,background:col}} />
                          </div>
                        </div>
                      </td>
                      <td style={{color:'rgba(255,255,255,0.4)'}}>{item.minQty}</td>
                      <td>₹{item.costPerUnit}/{item.unit}</td>
                      <td style={{fontWeight:700,color:'#fff'}}>₹{(item.qty*item.costPerUnit).toLocaleString('en-IN')}</td>
                      <td style={{color:'rgba(255,255,255,0.45)',fontSize:'0.8rem'}}>{item.supplier}</td>
                      <td>
                        <span className={`${s.stockBadge} ${st==='OK'?s.stockOk:st==='LOW'?s.stockLow:s.stockOut}`}>
                          {st==='OK'?'✓ OK':st==='LOW'?'⚠ Low':'✕ Out'}
                        </span>
                      </td>
                      <td>
                        <div style={{display:'flex',gap:'0.375rem'}}>
                          <button className={s.itemCardEditBtn} onClick={() => setAdjItem(item)}>± Qty</button>
                          <button className={s.itemCardEditBtn} onClick={() => { setEditItem(item); setAddModal(false); }}>Edit</button>
                          <button className={s.itemCardDeleteBtn} onClick={() => setDeleteItem(item)} title="Delete">🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Transaction Log ── */}
      <div className={s.transLog}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Stock Transaction Log</div>
            <div style={{display:'flex',gap:'0.375rem'}}>
              {(['ALL','IN','OUT'] as const).map(f => (
                <button key={f} onClick={() => setTxnFilter(f)}
                  style={{padding:'0.3rem 0.75rem',borderRadius:'8px',fontWeight:600,fontSize:'0.75rem',cursor:'pointer',
                    fontFamily:'Inter,sans-serif',transition:'all 0.15s',
                    background: txnFilter===f ? (f==='IN'?'rgba(16,185,129,0.2)':f==='OUT'?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.1)') : 'transparent',
                    border: txnFilter===f ? (f==='IN'?'1px solid rgba(16,185,129,0.3)':f==='OUT'?'1px solid rgba(239,68,68,0.3)':'1px solid rgba(255,255,255,0.12)') : '1px solid transparent',
                    color: txnFilter===f ? '#fff' : 'rgba(255,255,255,0.4)',
                  }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <table className={s.transTable}>
            <thead>
              <tr><th>Item</th><th>Type</th><th>Quantity</th><th>Notes</th><th>Date & Time</th></tr>
            </thead>
            <tbody>
              {filteredTxns.map(t => (
                <tr key={t.id}>
                  <td style={{fontWeight:600,color:'#fff'}}>{t.itemName}</td>
                  <td><span className={`${s.stockBadge} ${t.type==='IN'?s.stockOk:s.stockOut}`}>{t.type==='IN'?'⬆ IN':'⬇ OUT'}</span></td>
                  <td><span className={t.type==='IN'?s.transIn:s.transOut}>{t.type==='IN'?'+':'−'}{t.qty} {t.unit}</span></td>
                  <td style={{color:'rgba(255,255,255,0.4)'}}>{t.notes}</td>
                  <td style={{color:'rgba(255,255,255,0.35)',fontSize:'0.8rem'}}>{t.date}</td>
                </tr>
              ))}
              {filteredTxns.length === 0 && (
                <tr><td colSpan={5} style={{textAlign:'center',color:'rgba(255,255,255,0.2)',padding:'2rem',fontSize:'0.875rem'}}>No {txnFilter!=='ALL'?txnFilter:''} transactions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ── */}
      {(addModal || editItem) && (
        <ItemModal item={editItem} onClose={() => { setAddModal(false); setEditItem(null); }} onSave={handleSaveItem} />
      )}
      {adjItem && <AdjustModal item={adjItem} onClose={() => setAdjItem(null)} onSave={handleAdjust} />}
      {deleteItem && <DeleteModal item={deleteItem} onClose={() => setDeleteItem(null)} onDelete={() => handleDelete(deleteItem.id)} />}

    </div>
  );
}
