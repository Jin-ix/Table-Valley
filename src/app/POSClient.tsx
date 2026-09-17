'use client';

import { useState } from 'react';
import { Search, Plus, Minus, Trash2, Printer, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './POS.module.css';
import PaymentModal from '@/components/PaymentModal';
import Receipt from '@/components/Receipt';
import { createOrder } from './posActions';

type Product = { id: string; name: string; price: number; available: boolean; categoryId: string; };
type Category = { id: string; name: string; };
type CartItem = { cartId: string; product: Product; qty: number; notes: string; };

// Map product names / categories to emojis
const EMOJI_MAP: Record<string, string> = {
  tea: '🍵', coffee: '☕', 'black tea': '🫖', 'masala chai': '🍵',
  'lime juice': '🍋', 'fresh lime': '🍋', lemonade: '🍋',
  lassi: '🥛', 'mango lassi': '🥭', juice: '🧃', water: '💧',
  'egg puff': '🥚', 'veg puff': '🥐', shawarma: '🌯', sandwich: '🥪',
  burger: '🍔', pizza: '🍕', pasta: '🍝',
  porotta: '🫓', naan: '🫓', roti: '🫓', paratha: '🫓', chapati: '🫓', bread: '🫓',
  'butter chicken': '🍗', 'chicken curry': '🍗', 'chicken tikka': '🍗',
  chicken: '🍗', mutton: '🍖', beef: '🍖', fish: '🐟', prawn: '🦐',
  biryani: '🍛', rice: '🍚', 'fried rice': '🍳',
  'paneer tikka': '🧀', paneer: '🧀', 'dal makhani': '🫘', dal: '🫘',
  'chana masala': '🫘', 'veg meals': '🍱', meals: '🍱', thali: '🍱',
  samosa: '🥟', 'samosa chaat': '🥟', chaat: '🥟',
  'ice cream': '🍦', 'gulab jamun': '🍮', 'rasgulla': '🍮', halwa: '🍮',
  dessert: '🍮', sweet: '🍭',
  'filter coffee': '☕', cappuccino: '☕', espresso: '☕',
};

function getEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(key)) return emoji;
  }
  return '🍽';
}

const CATEGORY_ICONS: Record<string, string> = {
  Beverages: '🥤', Snacks: '🥨', Meals: '🍱', Biryani: '🍛',
  Rice: '🍚', Breads: '🫓', Desserts: '🍮', Starters: '🥗',
  'Main Course': '🍛', 'South Indian': '🥘',
};

export default function POSClient({
  initialProducts,
  categories,
  currentUserId
}: {
  initialProducts: Product[];
  categories: Category[];
  currentUserId: string;
}) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKE_AWAY'>('DINE_IN');
  const [tableNumber, setTableNumber] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredProducts = initialProducts.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.categoryId === categories.find(c => c.name === activeCategory)?.id;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    if (!product.available) return;
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id && i.notes === '');
      if (existing) return prev.map(i => i.cartId === existing.cartId ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { cartId: Math.random().toString(), product, qty: 1, notes: '' }];
    });
  };

  const updateQty = (cartId: string, delta: number) => {
    setCart(prev => prev.map(i => i.cartId === cartId ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  const updateNotes = (cartId: string, notes: string) => {
    setCart(prev => prev.map(i => i.cartId === cartId ? { ...i, notes } : i));
  };

  const removeItem = (cartId: string) => setCart(prev => prev.filter(i => i.cartId !== cartId));

  const subtotal = cart.reduce((sum, i) => sum + i.product.price * i.qty, 0);

  const handleCompletePayment = async (paymentDetails: { method: string; amountReceived: number }) => {
    setIsProcessing(true);
    // Snapshot cart now (before clearing) so Receipt can use it
    const cartSnapshot = cart;
    try {
      const newOrder = await createOrder({
        type: orderType,
        tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
        subtotal, tax: 0, discount: 0, total: subtotal,
        paymentMethod: paymentDetails.method,
        cashierId: currentUserId,
        items: cartSnapshot.map(i => ({ productId: i.product.id, qty: i.qty, price: i.product.price, notes: i.notes }))
      });
      // Build receipt from in-memory cart — no extra DB round-trip needed
      setCompletedOrder({
        ...newOrder,
        type: orderType,
        tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
        subtotal,
        tax: 0,
        discount: 0,
        total: subtotal,
        paymentMethod: paymentDetails.method,
        createdAt: new Date().toISOString(),
        items: cartSnapshot.map(i => ({
          id: i.cartId,
          qty: i.qty,
          price: i.product.price,
          notes: i.notes,
          product: { name: i.product.name },
        })),
      });
      setShowPayment(false);
      setCart([]);
      setTableNumber('');
    } catch (error) {
      console.error('Failed to create order', error);
      alert('Failed to process order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {/* ── LEFT: MENU ── */}
        <div className={`${styles.leftPane} print-hidden`}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2>New Order</h2>
            <span className={styles.headerSub}>{filteredProducts.length} items available</span>
          </div>
          <div className={styles.searchBar}>
            <Search size={16} color="rgba(255,255,255,0.3)" />
            <input
              type="text"
              placeholder="Search dishes..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.categories}>
          <button
            className={`${styles.categoryBtn} ${activeCategory === 'All' ? styles.active : ''}`}
            onClick={() => setActiveCategory('All')}
          >
            🍽 All
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              className={`${styles.categoryBtn} ${activeCategory === c.name ? styles.active : ''}`}
              onClick={() => setActiveCategory(c.name)}
            >
              {CATEGORY_ICONS[c.name] ?? '🍴'} {c.name}
            </button>
          ))}
        </div>

        <motion.div layout className={styles.productGrid}>
          <AnimatePresence>
            {filteredProducts.map(p => (
              <motion.div
                layout
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: p.available ? 1 : 0.4, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileTap={p.available ? { scale: 0.98 } : {}}
                transition={{ duration: 0.15 }}
                className={styles.productCard}
                onClick={() => addToCart(p)}
              >
                <div className={styles.productEmoji}>{getEmoji(p.name)}</div>
                <div className={styles.productName}>{p.name}</div>
                <div className={styles.productPrice}>₹{p.price}</div>
                {!p.available && (
                  <div className={styles.productUnavailable}>Out of Stock</div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── RIGHT: CART ── */}
      <div className={`${styles.rightPane} print-hidden`}>
        <div className={styles.cartHeader}>
          <h3>Current Order</h3>
          <div className={styles.orderControls}>
            <button
              className={`${styles.orderTypeBtn} ${orderType === 'DINE_IN' ? styles.active : ''}`}
              onClick={() => setOrderType('DINE_IN')}
            >
              🍽 Dine In
            </button>
            <button
              className={`${styles.orderTypeBtn} ${orderType === 'TAKE_AWAY' ? styles.active : ''}`}
              onClick={() => setOrderType('TAKE_AWAY')}
            >
              🛍 Take Away
            </button>
          </div>
          {orderType === 'DINE_IN' && (
            <input
              type="text"
              placeholder="Table Number (Optional)"
              className={styles.tableInput}
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
            />
          )}
        </div>

        <div className={styles.cartItems}>
          {cart.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.emptyCart}>
              <div className={styles.emptyCartIcon}>🍽</div>
              <div>No items added yet</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.6 }}>Tap a dish to add it</div>
            </motion.div>
          ) : (
            <AnimatePresence>
              {cart.map(item => (
                <motion.div
                  layout
                  key={item.cartId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0, padding: 0 }}
                  transition={{ duration: 0.15 }}
                  className={styles.cartItem}
                >
                  <div className={styles.itemHeader}>
                    <span>{item.product.name}</span>
                    <span className={styles.itemTotal}>₹{item.product.price * item.qty}</span>
                  </div>
                  <div className={styles.itemControls}>
                    <div className={styles.qtyControls}>
                      <button className={styles.qtyBtn} onClick={() => updateQty(item.cartId, -1)}><Minus size={14} /></button>
                      <span>{item.qty}</span>
                      <button className={styles.qtyBtn} onClick={() => updateQty(item.cartId, 1)}><Plus size={14} /></button>
                    </div>
                    <button onClick={() => removeItem(item.cartId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Note: e.g. less spicy..."
                    className={styles.itemNote}
                    value={item.notes}
                    onChange={e => updateNotes(item.cartId, e.target.value)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className={styles.cartFooter}>
          <div className={styles.summarySection}>
            <div className={styles.summaryRow}><span>Subtotal</span><span>₹{subtotal}</span></div>
            <div className={styles.summaryRow}><span>Discount</span><span>₹0</span></div>
            <div className={styles.summaryRow}><span>GST</span><span>₹0</span></div>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalAmount}>₹{subtotal}</span>
            </div>
          </div>

          <div className={styles.actionButtons}>
            <button className={`${styles.actionBtn} ${styles.btnHold}`}>Hold</button>
            <button
              className={`${styles.actionBtn} ${styles.btnPay}`}
              disabled={cart.length === 0 || isProcessing}
              onClick={() => setShowPayment(true)}
            >
              <CreditCard size={20} /> {isProcessing ? 'Processing…' : 'Pay & Bill'}
            </button>
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentModal total={subtotal} onClose={() => setShowPayment(false)} onComplete={handleCompletePayment} />
      )}

      {completedOrder && (
        <Receipt order={completedOrder} onClose={() => setCompletedOrder(null)} />
      )}
      </div>
    </div>
  );
}
