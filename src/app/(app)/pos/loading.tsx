import skeletonStyles from '../skeleton.module.css';

export default function POSLoading() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', height: '100%', gap: 0 }}>
      {/* Left: product grid */}
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
        {/* Category tabs */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`${skeletonStyles.bone} ${skeletonStyles.h10} ${skeletonStyles.w20}`} style={{ borderRadius: '999px' }} />
          ))}
        </div>

        {/* Search bar */}
        <div className={`${skeletonStyles.bone} ${skeletonStyles.h10} ${skeletonStyles.wFull}`} style={{ borderRadius: '12px' }} />

        {/* Product grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ borderRadius: '16px', overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className={skeletonStyles.bone} style={{ height: '100px', borderRadius: 0 }} />
              <div style={{ padding: '0.75rem' }}>
                <div className={`${skeletonStyles.bone} ${skeletonStyles.h5} ${skeletonStyles.w24}`} style={{ marginBottom: '0.4rem' }} />
                <div className={`${skeletonStyles.bone} ${skeletonStyles.h4} ${skeletonStyles.w16}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: order panel */}
      <div style={{ borderLeft: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className={`${skeletonStyles.bone} ${skeletonStyles.h8} ${skeletonStyles.w32}`} />
        <div className={`${skeletonStyles.bone}`} style={{ flex: 1, borderRadius: '12px', minHeight: '300px' }} />
        <div className={`${skeletonStyles.bone} ${skeletonStyles.h10} ${skeletonStyles.wFull}`} style={{ borderRadius: '12px' }} />
        <div className={`${skeletonStyles.bone} ${skeletonStyles.h10} ${skeletonStyles.wFull}`} style={{ borderRadius: '12px' }} />
      </div>
    </div>
  );
}
