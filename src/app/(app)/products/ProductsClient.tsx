"use client";
import React, { useState, useTransition } from 'react';
import styles from '../shared.module.css';
import { addProduct, updateProduct, deleteProduct, toggleProductAvailability } from '../../actions/productActions';

interface Product {
  id: string;
  sku: string | null;
  name: string;
  price: number;
  available: boolean;
  notes?: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
}

const getEmojiForCat = (cat: string) => {
  switch (cat) {
    case 'Bread': return '🫓';
    case 'Main Course': return '🍛';
    case 'Starter': return '🧆';
    case 'Breakfast': return '🥞';
    case 'Beverages': return '☕';
    case 'Dessert': return '🍮';
    default: return '🍽️';
  }
};

const CATS = ['All', 'Bread', 'Main Course', 'Starter', 'Breakfast', 'Beverages', 'Dessert'];

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [activeCat, setActiveCat] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    cat: 'Bread',
    price: '',
    available: true,
    notes: ''
  });

  const filteredProducts = activeCat === 'All' 
    ? initialProducts 
    : initialProducts.filter(p => p.category?.name === activeCat);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', cat: 'Bread', price: '', available: true, notes: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      cat: product.category?.name || 'Bread',
      price: product.price.toString(),
      available: product.available,
      notes: product.notes || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: formData.name,
          categoryName: formData.cat,
          price: parseFloat(formData.price),
          available: formData.available,
          notes: formData.notes
        });
      } else {
        await addProduct({
          name: formData.name,
          categoryName: formData.cat,
          price: parseFloat(formData.price),
          available: formData.available,
          notes: formData.notes
        });
      }
      closeModal();
    });
  };

  const handleDelete = (id: string) => {
    if(confirm("Are you sure you want to delete this dish?")) {
      startTransition(async () => {
        await deleteProduct(id);
      });
    }
  };

  const toggleAvailability = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleProductAvailability(id, !currentStatus);
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Menu & Products</h1>
          <p className={styles.pageSubtitle}>Product management studio</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={openAddModal} disabled={isPending}>+ Add Item</button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Products</div>
          <div className={styles.statValue}>{initialProducts.length}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Active Products</div>
          <div className={styles.statValue}>{initialProducts.filter(p=>p.available).length}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Avg Price</div>
          <div className={styles.statValue}>₹{initialProducts.length > 0 ? Math.round(initialProducts.reduce((sum, p) => sum + p.price, 0) / initialProducts.length) : 0}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Best Category</div>
          <div className={styles.statValue} style={{fontSize: '1.25rem', marginTop: '0.5rem'}}>Main Course</div>
        </div>
      </div>

      <div className={styles.filterPills}>
        {CATS.map((c) => (
          <button 
            key={c} 
            onClick={() => setActiveCat(c)}
            className={`${styles.filterPill} ${activeCat === c ? styles.filterPillActive : ''}`}
          >
            {c}
          </button>
        ))}
      </div>

      {isPending && <div style={{ marginBottom: '1rem', color: '#f97316' }}>Saving changes...</div>}

      <div className={styles.productMgmtGrid}>
        {filteredProducts.map((p) => (
          <div key={p.id} className={styles.productMgmtCard}>
            <div className={styles.productMgmtImg}>{getEmojiForCat(p.category?.name || '')}</div>
            <div className={styles.productMgmtBody}>
              <div className={styles.productMgmtName}>{p.name}</div>
              <div className={styles.productMgmtCat}>{p.category?.name}</div>
              <div className={styles.productMgmtFooter}>
                <span className={styles.productMgmtPrice}>₹{p.price}</span>
                <span className={`${styles.badge} ${p.available ? styles.badgeGreen : styles.badgeRed}`}>
                  {p.available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              {p.notes && <div style={{fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem'}}>Notes: {p.notes}</div>}
              <div style={{display:'flex', gap:'0.5rem', marginTop:'0.875rem'}}>
                <button 
                  onClick={() => openEditModal(p)}
                  disabled={isPending}
                  style={{flex:1, padding:'0.5rem', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', background:'rgba(255,255,255,0.05)', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', color:'rgba(255,255,255,0.6)', fontFamily:'Inter,sans-serif'}}
                >
                  Edit
                </button>
                <button 
                  onClick={() => toggleAvailability(p.id, p.available)}
                  disabled={isPending}
                  style={{flex:1, padding:'0.5rem', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', background:'rgba(239,68,68,0.08)', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', color:'#f87171', fontFamily:'Inter,sans-serif'}}
                >
                  {p.available ? 'Disable' : 'Enable'}
                </button>
                <button 
                  onClick={() => handleDelete(p.id)}
                  disabled={isPending}
                  style={{padding:'0.5rem', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', background:'rgba(239,68,68,0.08)', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', color:'#f87171', fontFamily:'Inter,sans-serif'}}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          animation: 'fadeIn 0.15s ease'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #0f1929, #111e30)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px',
            padding: '0',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04) inset',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 1.75rem 1.25rem',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>
                {editingProduct ? 'Edit Dish' : 'Add New Dish'}
              </h2>
              <button onClick={closeModal} style={{
                width: '32px', height: '32px', borderRadius: '9px',
                background: 'rgba(255,255,255,0.07)', border: 'none',
                color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', transition: 'all 0.15s'
              }}>✕</button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

              <div>
                <label className={styles.formLabel}>Dish Name</label>
                <input
                  required
                  type="text"
                  className={styles.formInput}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Chicken Biryani"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.formLabel}>Category</label>
                  <select
                    className={styles.formInput}
                    value={formData.cat}
                    onChange={e => setFormData({...formData, cat: e.target.value})}
                    style={{ appearance: 'none', cursor: 'pointer' }}
                  >
                    {CATS.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c} style={{ background: '#0f1929' }}>{c}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.formLabel}>Price (₹)</label>
                  <input
                    required
                    type="number"
                    className={styles.formInput}
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    placeholder="e.g. 150"
                  />
                </div>
              </div>

              <div>
                <label className={styles.formLabel}>Notes (Optional)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="e.g. Full: 150, Half: 90"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={e => setFormData({...formData, available: e.target.checked})}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>Available on Menu</span>
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex', gap: '0.75rem', paddingTop: '0.5rem',
                borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '0.25rem'
              }}>
                <button type="button" onClick={closeModal} disabled={isPending}
                  className={styles.btnSecondary} style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isPending}
                  className={styles.btnPrimary} style={{ flex: 1, justifyContent: 'center' }}>
                  {isPending ? 'Saving…' : (editingProduct ? 'Update Dish' : 'Add Dish')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
