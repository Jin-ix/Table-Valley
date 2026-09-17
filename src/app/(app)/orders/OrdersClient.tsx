'use client';

import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Clock, User, Phone, CheckCircle, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../shared.module.css';

export default function OrdersClient({ initialOrders }: { initialOrders: any[] }) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Orders');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const FILTERS = [
    { label: 'All Orders', count: initialOrders.length },
    { label: 'Paid', count: initialOrders.filter(o => o.status === 'COMPLETED').length },
    { label: 'Preparing', count: initialOrders.filter(o => o.status === 'PREPARING').length },
    { label: 'Serving', count: initialOrders.filter(o => o.status === 'SERVED').length },
    { label: 'Cancelled', count: initialOrders.filter(o => o.status === 'CANCELLED').length },
  ];

  const filteredOrders = initialOrders.filter(o => {
    const matchesSearch = o.orderNumber?.toLowerCase().includes(search.toLowerCase());
    const mappedStatus = o.status === 'COMPLETED' ? 'Paid' : o.status === 'PREPARING' ? 'Preparing' : o.status === 'SERVED' ? 'Serving' : 'Cancelled';
    const matchesFilter = activeFilter === 'All Orders' || mappedStatus === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <span className={`${styles.badge} ${styles.badgeGreen}`}><CheckCircle size={12} style={{marginRight:'4px'}}/> Paid</span>;
      case 'PREPARING': return <span className={`${styles.badge} ${styles.badgeOrange}`}><Clock size={12} style={{marginRight:'4px'}}/> Preparing</span>;
      case 'SERVED': return <span className={`${styles.badge} ${styles.badgeBlue}`}>Serving</span>;
      case 'CANCELLED': return <span className={`${styles.badge} ${styles.badgeRed}`}>Cancelled</span>;
      default: return <span className={`${styles.badge} ${styles.badgeGray}`}>{status}</span>;
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Orders</h1>
          <p className={styles.pageSubtitle}>Real-time order management · {initialOrders.length} total</p>
        </div>
        <div className={styles.headerActions}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.5rem 1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search size={16} color="rgba(255,255,255,0.4)" />
            <input 
              type="text" 
              placeholder="Search Order ID..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', marginLeft: '8px', fontSize: '0.875rem' }}
            />
          </div>
          <button className={styles.btnSecondary}>Export CSV</button>
          <a href="/pos" className={styles.btnPrimary}>+ New Order</a>
        </div>
      </div>

      <div className={styles.filterPills}>
        {FILTERS.map((f, i) => (
          <button 
            key={i} 
            className={`${styles.filterPill} ${activeFilter === f.label ? styles.filterPillActive : ''}`}
            onClick={() => setActiveFilter(f.label)}
            style={activeFilter === f.label ? { background: 'linear-gradient(135deg, #ea580c, #f97316)', color: '#fff', borderColor: 'transparent' } : {}}
          >
            {f.label}
            <span style={{ 
              background: activeFilter === f.label ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', 
              padding: '2px 8px', borderRadius: '99px', fontSize: '0.7rem', marginLeft: '6px' 
            }}>{f.count}</span>
          </button>
        ))}
      </div>

      <div className={styles.card} style={{ padding: 0 }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order ID</th><th>Table</th><th>Type</th><th>Items Overview</th>
              <th>Total</th><th>Status</th><th>Time</th><th></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredOrders.map((o, i) => (
                <React.Fragment key={o.id}>
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
                    style={{ cursor: 'pointer', background: expandedId === o.id ? 'rgba(255,255,255,0.03)' : 'transparent' }}
                  >
                    <td><span style={{fontWeight:700, color:'#fff'}}>{o.orderNumber}</span></td>
                    <td>{o.tableNumber || '—'}</td>
                    <td><span className={`${styles.badge} ${styles.badgeGray}`}>{o.type === 'DINE_IN' ? 'Dine In' : 'Take Away'}</span></td>
                    <td style={{maxWidth:'220px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                      {o.items.map((item: any) => `${item.product.name} ×${item.qty}`).join(', ')}
                    </td>
                    <td><span style={{fontWeight:800, color:'#f97316', fontSize:'1rem'}}>₹{o.total.toLocaleString('en-IN')}</span></td>
                    <td>{getStatusBadge(o.status)}</td>
                    <td style={{fontSize:'0.8125rem'}}>{format(new Date(o.createdAt), 'hh:mm a')}</td>
                    <td>
                      {expandedId === o.id ? <ChevronUp size={18} color="rgba(255,255,255,0.5)"/> : <ChevronDown size={18} color="rgba(255,255,255,0.5)"/>}
                    </td>
                  </motion.tr>
                  {expandedId === o.id && (
                    <tr>
                      <td colSpan={8} style={{ padding: 0, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ padding: '1.5rem 2rem', background: 'rgba(0,0,0,0.2)', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}
                        >
                          <div>
                            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem', letterSpacing: '0.05em' }}>Order Items</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {o.items.map((item: any, idx: number) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontWeight: 800, color: '#f97316', background: 'rgba(249,115,22,0.1)', padding: '4px 10px', borderRadius: '8px' }}>{item.qty}x</span>
                                    <div>
                                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{item.product.name}</div>
                                      {item.notes && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Note: {item.notes}</div>}
                                    </div>
                                  </div>
                                  <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>₹{item.price * item.qty}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem', letterSpacing: '0.05em' }}>Order Details</h4>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16} color="rgba(255,255,255,0.6)"/></div>
                                <div>
                                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Served By</div>
                                  <div style={{ fontSize: '0.875rem', color: '#fff', fontWeight: 600 }}>{o.cashier?.name || 'Staff'}</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={16} color="rgba(255,255,255,0.6)"/></div>
                                <div>
                                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Order Timeline</div>
                                  <div style={{ fontSize: '0.875rem', color: '#fff', fontWeight: 600 }}>{format(new Date(o.createdAt), 'MMM d, yyyy - hh:mm a')}</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <button className={styles.btnSecondary} style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}><Printer size={14}/> Print Receipt</button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
