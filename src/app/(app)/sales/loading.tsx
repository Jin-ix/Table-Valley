import styles from '../shared.module.css';
import skeletonStyles from '../skeleton.module.css';

export default function SalesLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div className={`${skeletonStyles.bone} ${skeletonStyles.h8} ${skeletonStyles.w48}`} style={{ marginBottom: '0.5rem' }} />
          <div className={`${skeletonStyles.bone} ${skeletonStyles.h4} ${skeletonStyles.w32}`} />
        </div>
        <div className={`${skeletonStyles.bone} ${skeletonStyles.h10} ${skeletonStyles.w24}`} />
      </div>

      {/* Period tabs */}
      <div className={`${skeletonStyles.bone} ${skeletonStyles.h10} ${skeletonStyles.w48}`} style={{ marginBottom: '1.5rem', borderRadius: '12px' }} />

      {/* Stat cards */}
      <div className={styles.statsGrid} style={{ marginBottom: '1.5rem' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={styles.statCard} style={{ animation: 'none' }}>
            <div className={`${skeletonStyles.bone} ${skeletonStyles.h10} ${skeletonStyles.w10}`} style={{ borderRadius: '13px', marginBottom: '1.125rem' }} />
            <div className={`${skeletonStyles.bone} ${skeletonStyles.h8} ${skeletonStyles.w24}`} style={{ marginBottom: '0.4rem' }} />
            <div className={`${skeletonStyles.bone} ${skeletonStyles.h4} ${skeletonStyles.w16}`} />
          </div>
        ))}
      </div>

      {/* Chart rows */}
      {[0, 1, 2].map(row => (
        <div key={row} className={styles.grid2} style={{ marginBottom: '1.375rem' }}>
          {[0, 1].map(i => (
            <div key={i} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={`${skeletonStyles.bone} ${skeletonStyles.h5} ${skeletonStyles.w28}`} />
                <div className={`${skeletonStyles.bone} ${skeletonStyles.h4} ${skeletonStyles.w20}`} />
              </div>
              <div className={styles.cardBody}>
                <div className={`${skeletonStyles.bone}`} style={{ height: '130px', borderRadius: '10px' }} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
