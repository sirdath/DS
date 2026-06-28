/** Instant skeleton for the products tools while their server data loads — fills the
 *  same .ws-main__in column, so switching to a tool shows structure immediately
 *  instead of a blank wait. */
export default function Loading() {
  return (
    <div className="admin-skel" aria-busy="true" aria-label="Loading" style={{ padding: 0, maxWidth: 'none' }}>
      <div className="admin-skel__bar" style={{ width: 110, height: 12, marginBottom: 12 }} />
      <div className="admin-skel__bar" style={{ width: 240, height: 28, marginBottom: 10 }} />
      <div className="admin-skel__bar" style={{ width: 360, height: 14, marginBottom: 24 }} />
      <div className="admin-skel__grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="admin-skel__bar" style={{ height: 150 }} />
        ))}
      </div>
    </div>
  )
}
