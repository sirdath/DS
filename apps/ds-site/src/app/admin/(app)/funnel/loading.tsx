/** Skeleton for the Funnel sub-views (Leads / Hunt / Outreach) while data loads. */
export default function Loading() {
  return (
    <div className="admin-skel" aria-busy="true" aria-label="Loading">
      <div className="admin-skel__bar" style={{ width: 220, height: 34, borderRadius: 999, marginBottom: 20 }} />
      <div className="admin-skel__bar" style={{ width: 120, height: 12, marginBottom: 14 }} />
      <div className="admin-skel__bar" style={{ width: 280, height: 30, marginBottom: 18 }} />
      <div className="admin-skel__grid">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="admin-skel__bar" style={{ height: 110 }} />
        ))}
      </div>
    </div>
  )
}
