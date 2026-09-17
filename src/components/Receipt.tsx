'use client';

import { useEffect, useRef } from 'react';
import { Printer, X, CheckCircle } from 'lucide-react';
import styles from './Receipt.module.css';

function printReceipt(order: any) {
  const date = new Date(order.createdAt);
  const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const itemRows = order.items.map((item: any) => `
    <tr>
      <td style="padding:6px 0; font-size:13px; color:#1e293b;">${item.product.name}${item.notes ? `<br><span style="font-size:11px;color:#94a3b8;">${item.notes}</span>` : ''}</td>
      <td style="padding:6px 0; font-size:13px; text-align:center; color:#64748b;">${item.qty}</td>
      <td style="padding:6px 0; font-size:13px; text-align:right; font-weight:700; color:#1e293b;">₹${item.price * item.qty}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${order.orderNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #fff; }
    .receipt { width: 320px; margin: 0 auto; padding: 0 0 24px; }
    .header { background: #0f172a; color: #fff; text-align: center; padding: 24px 20px 20px; }
    .brand-icon { width: 48px; height: 48px; background: linear-gradient(135deg,#ea580c,#f97316); border-radius: 12px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; }
    .brand-name { font-size: 20px; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 4px; }
    .brand-tag  { font-size: 12px; color: rgba(255,255,255,0.45); }
    .body { padding: 16px 20px; }
    .status-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
    .pill { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; border: 1px solid; }
    .pill-green  { background: rgba(16,185,129,0.08); color: #059669; border-color: rgba(16,185,129,0.2); }
    .pill-gray   { background: #f3f4f8; color: #475569; border-color: rgba(0,0,0,0.08); }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f8fafc; border: 1px solid rgba(0,0,0,0.07); border-radius: 12px; padding: 12px 14px; margin-bottom: 14px; }
    .info-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: 700; margin-bottom: 2px; }
    .info-value { font-size: 13px; font-weight: 700; color: #0f172a; }
    .divider { height: 1px; background: rgba(0,0,0,0.07); margin: 10px 0; }
    .items-header { display: grid; grid-template-columns: 1fr 36px 72px; gap: 6px; padding-bottom: 8px; border-bottom: 1px solid rgba(0,0,0,0.07); margin-bottom: 4px; }
    .items-header span { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; }
    .items-header span:nth-child(2) { text-align: center; }
    .items-header span:nth-child(3) { text-align: right; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    table td { vertical-align: top; }
    table td:nth-child(2) { text-align: center; }
    table td:nth-child(3) { text-align: right; }
    .totals { background: #f8fafc; border: 1px solid rgba(0,0,0,0.07); border-radius: 12px; padding: 12px 14px; margin-bottom: 12px; }
    .t-row { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-bottom: 5px; }
    .t-total { display: flex; justify-content: space-between; border-top: 1px solid rgba(0,0,0,0.08); padding-top: 10px; margin-top: 6px; }
    .t-total-label { font-size: 14px; font-weight: 800; color: #0f172a; }
    .t-total-amount { font-size: 22px; font-weight: 800; color: #ea580c; letter-spacing: -0.04em; }
    .payment { display: flex; align-items: center; justify-content: center; gap: 6px; background: rgba(16,185,129,0.07); border: 1px solid rgba(16,185,129,0.15); color: #059669; font-size: 13px; font-weight: 700; padding: 10px; border-radius: 10px; margin-bottom: 14px; }
    .thankyou { text-align: center; padding-top: 14px; border-top: 1px solid rgba(0,0,0,0.06); }
    .thankyou-title { font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 3px; }
    .thankyou-sub { font-size: 12px; color: #94a3b8; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <div class="brand-icon">TV</div>
    <div class="brand-name">Table Valley</div>
    <div class="brand-tag">Restaurant &amp; Food Shop</div>
  </div>
  <div class="body">
    <div class="status-row">
      <span class="pill pill-green">✓ Payment Successful</span>
      <span class="pill pill-gray">${order.type === 'DINE_IN' ? '🍽 Dine In' : '🛍 Take Away'}</span>
      ${order.tableNumber ? `<span class="pill pill-gray">Table ${order.tableNumber}</span>` : ''}
    </div>
    <div class="info-grid">
      <div><div class="info-label">Invoice No.</div><div class="info-value">${order.orderNumber}</div></div>
      <div><div class="info-label">Date</div><div class="info-value">${dateStr}</div></div>
      <div><div class="info-label">Time</div><div class="info-value">${timeStr}</div></div>
      <div><div class="info-label">Items</div><div class="info-value">${order.items.length} item${order.items.length !== 1 ? 's' : ''}</div></div>
    </div>
    <div class="items-header">
      <span>Item</span><span>Qty</span><span>Amount</span>
    </div>
    <table>${itemRows}</table>
    <div class="totals">
      <div class="t-row"><span>Subtotal</span><span>₹${order.subtotal}</span></div>
      ${order.discount > 0 ? `<div class="t-row"><span>Discount</span><span style="color:#10b981">−₹${order.discount}</span></div>` : ''}
      ${order.tax > 0 ? `<div class="t-row"><span>Tax (GST)</span><span>₹${order.tax}</span></div>` : ''}
      <div class="t-total">
        <span class="t-total-label">Total Paid</span>
        <span class="t-total-amount">₹${order.total}</span>
      </div>
    </div>
    <div class="payment">✓ Paid via ${order.paymentMethod}</div>
    <div class="thankyou">
      <div class="thankyou-title">Thank you for dining with us! 🙏</div>
      <div class="thankyou-sub">We hope to see you again soon.</div>
    </div>
  </div>
</div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=400,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 600);
}

export default function Receipt({
  order,
  onClose
}: {
  order: any;
  onClose: () => void;
}) {
  const hasPrinted = useRef(false);

  useEffect(() => {
    if (!hasPrinted.current) {
      hasPrinted.current = true;
      setTimeout(() => printReceipt(order), 500);
    }
  }, [order]);

  const date = new Date(order.createdAt);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* ── BRAND HEADER ── */}
        <div className={styles.receiptBrand}>
          <div className={styles.brandIcon}>TV</div>
          <div className={styles.brandName}>Table Valley</div>
          <div className={styles.brandTagline}>Restaurant &amp; Food Shop</div>
        </div>

        {/* Torn paper edge */}
        <div className={styles.receiptEdge} />

        {/* ── RECEIPT BODY ── */}
        <div className={styles.receiptBody}>

          {/* Status + Type Pill */}
          <div className={styles.metaRow}>
            <span className={`${styles.metaPill} ${styles.metaPillAccent}`}>
              <CheckCircle size={12} /> Payment Successful
            </span>
            <span className={styles.metaPill}>
              {order.type === 'DINE_IN' ? '🍽 Dine In' : '🛍 Take Away'}
            </span>
            {order.tableNumber && (
              <span className={styles.metaPill}>Table {order.tableNumber}</span>
            )}
          </div>

          {/* Invoice Info Grid */}
          <div className={styles.invoiceInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Invoice No.</span>
              <span className={styles.infoValue}>{order.orderNumber}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Date</span>
              <span className={styles.infoValue}>{date.toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Time</span>
              <span className={styles.infoValue}>{date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Items</span>
              <span className={styles.infoValue}>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Items */}
          <div className={styles.itemsHeader}>
            <span className={styles.itemsHeaderCell}>Item</span>
            <span className={styles.itemsHeaderCell}>Qty</span>
            <span className={styles.itemsHeaderCell}>Amount</span>
          </div>

          {order.items.map((item: any) => (
            <div key={item.id} className={styles.itemRow}>
              <div>
                <div className={styles.itemName}>{item.product.name}</div>
                {item.notes && <div className={styles.itemNotes}>{item.notes}</div>}
              </div>
              <div className={styles.itemQty}>{item.qty}</div>
              <div className={styles.itemPrice}>₹{item.price * item.qty}</div>
            </div>
          ))}

          {/* Totals */}
          <div className={styles.totalsBox}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            {order.discount > 0 && (
              <div className={styles.totalRow}>
                <span>Discount</span>
                <span style={{color:'#10b981'}}>−₹{order.discount}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className={styles.totalRow}>
                <span>Tax (GST)</span>
                <span>₹{order.tax}</span>
              </div>
            )}
            <div className={styles.totalRowFinal}>
              <span className={styles.totalLabel}>Total Paid</span>
              <span className={styles.totalAmount}>₹{order.total}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className={styles.paymentBadge}>
            <CheckCircle size={16} />
            Paid via {order.paymentMethod}
          </div>

          {/* Thank you */}
          <div className={styles.thankYou}>
            <div className={styles.thankYouTitle}>Thank you for dining with us! 🙏</div>
            <div className={styles.thankYouSub}>We hope to see you again soon.</div>
          </div>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div className={styles.actions}>
          <button className={styles.btnPrint} onClick={() => printReceipt(order)}>
            <Printer size={18} /> Print Receipt
          </button>
          <button className={styles.btnClose} onClick={onClose}>
            <X size={18} /> Close
          </button>
        </div>

      </div>
    </div>
  );
}
