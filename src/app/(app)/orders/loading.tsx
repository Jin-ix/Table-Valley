import styles from '../shared.module.css';
import skeletonStyles from '../skeleton.module.css';

export default function OrdersLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div className={`${skeletonStyles.bone} ${skeletonStyles.h8} ${skeletonStyles.w48}`} style={{ marginBottom: '0.5rem' }} />
          <div className={`${skeletonStyles.bone} ${skeletonStyles.h4} ${skeletonStyles.w32}`} />
        </div>
        <div className={`${skeletonStyles.bone} ${skeletonStyles.h10} ${skeletonStyles.w24}`} />
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={`${skeletonStyles.bone} ${skeletonStyles.h10} ${skeletonStyles.w24}`} style={{ borderRadius: '999px' }} />
        ))}
      </div>

      {/* Table card */}
      <div className={styles.card}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: '1rem', padding: '0.9rem 1.375rem', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`${skeletonStyles.bone} ${skeletonStyles.h4} ${skeletonStyles.w16}`} />
          ))}
        </div>

        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: '1rem', padding: '1rem 1.375rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className={`${skeletonStyles.bone} ${skeletonStyles.h5} ${skeletonStyles.w20}`} />
            <div className={`${skeletonStyles.bone} ${skeletonStyles.h5} ${skeletonStyles.w16}`} />
            <div className={`${skeletonStyles.bone} ${skeletonStyles.h5} ${skeletonStyles.w16}`} />
            <div className={`${skeletonStyles.bone} ${skeletonStyles.h5} ${skeletonStyles.w20}`} style={{ borderRadius: '999px' }} />
            <div className={`${skeletonStyles.bone} ${skeletonStyles.h5} ${skeletonStyles.w20}`} />
            <div className={`${skeletonStyles.bone} ${skeletonStyles.h5} ${skeletonStyles.w20}`} style={{ borderRadius: '999px' }} />
            <div className={`${skeletonStyles.bone} ${skeletonStyles.h5} ${skeletonStyles.w24}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
