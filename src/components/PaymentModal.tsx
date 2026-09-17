'use client';

import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import styles from './PaymentModal.module.css';

const METHOD_META: Record<string, { icon: string; label: string }> = {
  CASH: { icon: '💵', label: 'Cash' },
  UPI:  { icon: '📱', label: 'UPI / QR' },
  CARD: { icon: '💳', label: 'Card' },
};

export default function PaymentModal({
  total,
  onClose,
  onComplete
}: {
  total: number;
  onClose: () => void;
  onComplete: (paymentDetails: { method: string; amountReceived: number }) => void;
}) {
  const [method, setMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [amountReceivedStr, setAmountReceivedStr] = useState(total.toString());

  const amountReceived = parseFloat(amountReceivedStr) || 0;
  const changeDue = Math.max(0, amountReceived - total);

  const handleComplete = () => {
    onComplete({
      method,
      amountReceived: method === 'CASH' ? amountReceived : total,
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* ── HEADER ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerTitle}>Complete Payment</span>
            <span className={styles.headerSub}>Select method and confirm</span>
          </div>
          <button onClick={onClose} className={styles.closeBtn}><X size={18} /></button>
        </div>

        <div className={styles.content}>
          {/* ── TOTAL BOX ── */}
          <div className={styles.totalBox}>
            <div className={styles.totalLabel}>Amount Due</div>
            <div className={styles.totalAmount}>
              <span className={styles.totalAmountSup}>₹</span>{total.toLocaleString('en-IN')}
            </div>
          </div>

          {/* ── PAYMENT METHOD ── */}
          <div className={styles.methodLabel}>Payment Method</div>
          <div className={styles.methods}>
            {(['CASH', 'UPI', 'CARD'] as const).map(m => (
              <button
                key={m}
                className={`${styles.methodBtn} ${method === m ? styles.activeMethod : ''}`}
                onClick={() => setMethod(m)}
              >
                <span className={styles.methodIcon}>{METHOD_META[m].icon}</span>
                {METHOD_META[m].label}
              </button>
            ))}
          </div>

          {/* ── CASH CALCULATOR ── */}
          {method === 'CASH' && (
            <div className={styles.cashSection}>
              <div className={styles.inputGroup}>
                <label>Amount Received (₹)</label>
                <input
                  type="number"
                  value={amountReceivedStr}
                  onChange={e => setAmountReceivedStr(e.target.value)}
                  className={styles.input}
                  min={total}
                />
              </div>
              <div className={styles.changeRow}>
                <span className={styles.changeLabel}>Change Due</span>
                <span className={styles.changeAmount}>₹{changeDue.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* ── COMPLETE BUTTON ── */}
          <button
            className={styles.completeBtn}
            disabled={method === 'CASH' && amountReceived < total}
            onClick={handleComplete}
          >
            <CheckCircle size={20} />
            {method === 'CASH' ? 'Confirm Cash Payment' : `Pay ₹${total.toLocaleString('en-IN')} via ${METHOD_META[method].label}`}
          </button>
        </div>
      </div>
    </div>
  );
}
