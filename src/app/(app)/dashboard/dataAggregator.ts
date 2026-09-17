import { DashboardDataPayload } from './DashboardClient';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const HOURS = ['9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM','6PM','7PM','8PM','9PM','10PM'];
const HEAT_HOURS = ['9AM','11AM','1PM','3PM','5PM','7PM','9PM'];

// Helper to convert hour (0-23) to an index in our HOURS array (9AM = 0)
function getHourIndex(hour: number) {
  if (hour < 9) return 0;
  if (hour > 22) return 13;
  return hour - 9;
}

function getHeatHourIndex(hour: number) {
  if (hour < 9) return 0;
  if (hour > 21) return 6;
  return Math.floor((hour - 9) / 2);
}

// Helper to convert day of week (0=Sun, 6=Sat) to Mon=0...Sun=6
function getDayIndex(day: number) {
  return day === 0 ? 6 : day - 1;
}

function initBuckets(length: number, labels: string[]) {
  return {
    labels,
    revenue: Array(length).fill(0),
    orders: Array(length).fill(0),
    covers: Array(length).fill(0),
    aov: Array(length).fill(0),
    prevRevenue: Array(length).fill(0),
    prevOrders: Array(length).fill(0),
  };
}

const CATEGORY_COLORS = ['#ea580c', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6'];

export function aggregateDashboardData(orders: any[]): DashboardDataPayload {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();
  const currentDay = getDayIndex(now.getDay());

  // Initialize data structures
  const dataByPeriod: any = {
    daily: initBuckets(14, HOURS),
    weekly: initBuckets(7, DAYS_SHORT),
    monthly: initBuckets(new Date(currentYear, currentMonth + 1, 0).getDate(), Array.from({length: new Date(currentYear, currentMonth + 1, 0).getDate()}, (_, i) => `${i+1}`)),
    yearly: initBuckets(12, MONTHS)
  };

  const monthDataByIdx: any = {};
  for (let i = 0; i < 12; i++) {
    const daysInMonth = new Date(currentYear, i + 1, 0).getDate();
    monthDataByIdx[i] = initBuckets(daysInMonth, Array.from({length: daysInMonth}, (_, j) => `${j+1}`));
  }

  const heatData = Array.from({ length: 7 }, () => Array(7).fill(0));
  
  const itemCountsByPeriod: any = { daily: {}, weekly: {}, monthly: {}, yearly: {} };
  let typeDineIn = 0;
  let typeTakeAway = 0;
  const catRevenues: any = {};
  let totalRevenue = 0;
  let totalItemsSold = 0;
  let totalOrdersCount = 0;

  // Add global previous totals tracking
  const totalsByPeriod: any = {
    daily: { revenue: 0, orders: 0, items: 0, cancellations: 0, prevRevenue: 0, prevOrders: 0, prevItems: 0, prevCancellations: 0 },
    weekly: { revenue: 0, orders: 0, items: 0, cancellations: 0, prevRevenue: 0, prevOrders: 0, prevItems: 0, prevCancellations: 0 },
    monthly: { revenue: 0, orders: 0, items: 0, cancellations: 0, prevRevenue: 0, prevOrders: 0, prevItems: 0, prevCancellations: 0 },
    yearly: { revenue: 0, orders: 0, items: 0, cancellations: 0, prevRevenue: 0, prevOrders: 0, prevItems: 0, prevCancellations: 0 },
  };

  const paymentRevenues: Record<string, number> = {};

  // Compute week boundaries once, outside the loop
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - currentDay);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfWeek.getDate() - 7);
  const endOfLastWeek = new Date(endOfWeek);
  endOfLastWeek.setDate(endOfWeek.getDate() - 7);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  // Hoist helpers outside the loop — they don't capture per-iteration state
  const addOrderToBucket = (bucket: any, idx: number, total: number, itemsCount: number, isPrev = false) => {
    if (isPrev) {
      bucket.prevRevenue[idx] += total;
      bucket.prevOrders[idx] += 1;
    } else {
      bucket.revenue[idx] += total;
      bucket.orders[idx] += 1;
      bucket.covers[idx] += itemsCount;
    }
  };

  const addItemToCounts = (periodMap: any, item: any) => {
    if (!periodMap[item.product.name]) periodMap[item.product.name] = { sold: 0, revenue: 0 };
    periodMap[item.product.name].sold += item.qty;
    periodMap[item.product.name].revenue += item.qty * item.product.price;
  };

  for (const order of orders) {
    const date = new Date(order.createdAt);
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const hour = date.getHours();
    const dayOfWeek = getDayIndex(date.getDay());

    const isThisYear = y === currentYear;
    const isLastYear = y === currentYear - 1;
    
    const isThisMonth = isThisYear && m === currentMonth;
    const isLastMonth = isThisYear ? (m === currentMonth - 1) : (isLastYear && currentMonth === 0 && m === 11);
    
    const isToday = isThisMonth && d === currentDate;
    const isYesterday = y === yesterday.getFullYear() && m === yesterday.getMonth() && d === yesterday.getDate();
    
    const isThisWeek = date >= startOfWeek && date <= endOfWeek;
    const isLastWeek = date >= startOfLastWeek && date <= endOfLastWeek;

    const itemsCount = order.items.reduce((acc: number, item: any) => acc + item.qty, 0);

    // 1. Heatmap (based on all orders)
    heatData[dayOfWeek][getHeatHourIndex(hour)] += 1;

    // 2. Order Type Split
    if (order.type === 'DINE_IN') typeDineIn++;
    else typeTakeAway++;

    // 3. Category Mix
    for (const item of order.items) {
      const catName = item.product.category?.name || 'Uncategorized';
      catRevenues[catName] = (catRevenues[catName] || 0) + (item.qty * item.product.price);
      totalRevenue += (item.qty * item.product.price);
      totalItemsSold += item.qty;
    }
    
    // 3.5 Payment Methods
    if (order.status === 'COMPLETED' || order.status === 'PAID') {
      const pMethod = order.paymentMethod || 'OTHER';
      paymentRevenues[pMethod] = (paymentRevenues[pMethod] || 0) + order.total;
    }
    
    totalOrdersCount++;

    const isCancelled = order.status === 'CANCELLED';

    // Helper to update totals
    const updateTotals = (period: string, isPrev: boolean) => {
      if (isPrev) {
        totalsByPeriod[period].prevRevenue += order.total;
        totalsByPeriod[period].prevOrders += 1;
        totalsByPeriod[period].prevItems += itemsCount;
        if (isCancelled) totalsByPeriod[period].prevCancellations += 1;
      } else {
        totalsByPeriod[period].revenue += order.total;
        totalsByPeriod[period].orders += 1;
        totalsByPeriod[period].items += itemsCount;
        if (isCancelled) totalsByPeriod[period].cancellations += 1;
      }
    };

    // 4-7. Period buckets + item counts — single item-pass per order
    const applicablePeriods: string[] = [];
    
    if (isThisYear)  { addOrderToBucket(dataByPeriod.yearly, m, order.total, itemsCount); addOrderToBucket(monthDataByIdx[m], d - 1, order.total, itemsCount); applicablePeriods.push('yearly'); updateTotals('yearly', false); }
    if (isLastYear)  { addOrderToBucket(dataByPeriod.yearly, m, order.total, itemsCount, true); updateTotals('yearly', true); }
    
    if (isThisMonth) { addOrderToBucket(dataByPeriod.monthly, d - 1, order.total, itemsCount); applicablePeriods.push('monthly'); updateTotals('monthly', false); }
    if (isLastMonth) { addOrderToBucket(dataByPeriod.monthly, d - 1, order.total, itemsCount, true); updateTotals('monthly', true); }
    
    if (isThisWeek)  { addOrderToBucket(dataByPeriod.weekly, dayOfWeek, order.total, itemsCount); applicablePeriods.push('weekly'); updateTotals('weekly', false); }
    if (isLastWeek)  { addOrderToBucket(dataByPeriod.weekly, dayOfWeek, order.total, itemsCount, true); updateTotals('weekly', true); }
    
    if (isToday)     { addOrderToBucket(dataByPeriod.daily, getHourIndex(hour), order.total, itemsCount); applicablePeriods.push('daily'); updateTotals('daily', false); }
    if (isYesterday) { addOrderToBucket(dataByPeriod.daily, getHourIndex(hour), order.total, itemsCount, true); updateTotals('daily', true); }

    if (applicablePeriods.length > 0) {
      for (const item of order.items) {
        for (const p of applicablePeriods) {
          addItemToCounts(itemCountsByPeriod[p], item);
        }
      }
    }
  }

  // Calculate AOV
  const calcAOV = (bucket: any) => {
    for (let i = 0; i < bucket.revenue.length; i++) {
      bucket.aov[i] = bucket.orders[i] ? Math.round(bucket.revenue[i] / bucket.orders[i]) : 0;
    }
  };
  calcAOV(dataByPeriod.daily);
  calcAOV(dataByPeriod.weekly);
  calcAOV(dataByPeriod.monthly);
  calcAOV(dataByPeriod.yearly);
  for (let i=0; i<12; i++) calcAOV(monthDataByIdx[i]);

  // Transform top items
  const formatTopItems = (countsMap: any) => {
    const arr = Object.keys(countsMap).map(name => ({
      name,
      sold: countsMap[name].sold,
      revenueVal: countsMap[name].revenue,
      revenue: `₹${countsMap[name].revenue.toLocaleString('en-IN')}`,
      pct: 0
    })).sort((a, b) => b.sold - a.sold).slice(0, 5);
    
    const maxSold = arr[0]?.sold || 1;
    arr.forEach(a => a.pct = Math.round((a.sold / maxSold) * 100));
    return arr;
  };

  const topItemsByPeriod = {
    daily: formatTopItems(itemCountsByPeriod.daily),
    weekly: formatTopItems(itemCountsByPeriod.weekly),
    monthly: formatTopItems(itemCountsByPeriod.monthly),
    yearly: formatTopItems(itemCountsByPeriod.yearly),
  };

  // Transform Category Mix
  let cats = Object.keys(catRevenues).map(label => ({
    label,
    rev: catRevenues[label]
  })).sort((a,b) => b.rev - a.rev);
  
  const categoryPie = cats.map((c, i) => ({
    label: c.label,
    pct: totalRevenue ? Math.round((c.rev / totalRevenue) * 100) : 0,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
  }));

  // Order Type
  const totalOrders = typeDineIn + typeTakeAway;
  const orderTypeSplit = [
    { label: 'Dine In', pct: totalOrders ? Math.round((typeDineIn/totalOrders)*100) : 0, color: '#ea580c' },
    { label: 'Take Away', pct: totalOrders ? Math.round((typeTakeAway/totalOrders)*100) : 0, color: '#3b82f6' }
  ];

  // Payment Methods
  const totalPaymentRev = Object.values(paymentRevenues).reduce((a, b) => a + b, 0);
  const paymentMethods = Object.keys(paymentRevenues).map((label, i) => {
    const rev = paymentRevenues[label];
    return {
      label: label === 'UPI' ? 'UPI / QR' : label === 'CARD' ? 'Card' : label === 'CASH' ? 'Cash' : label,
      pct: totalPaymentRev ? Math.round((rev / totalPaymentRev) * 100) : 0,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      revenue: `₹${rev.toLocaleString('en-IN')}`
    };
  }).sort((a,b) => parseInt(b.revenue.replace(/[^0-9]/g, '')) - parseInt(a.revenue.replace(/[^0-9]/g, '')));

  return {
    dataByPeriod,
    monthDataByIdx,
    topItemsByPeriod,
    categoryPie,
    orderTypeSplit,
    paymentMethods,
    heatData,
    totalsByPeriod
  };
}
