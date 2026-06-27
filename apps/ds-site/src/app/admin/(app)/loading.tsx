/** Instant skeleton shown while an admin page's server data loads. */
export default function Loading() {
  return (
    <div className="admin-skel" aria-busy="true" aria-label="Loading">
      <div className="admin-skel__bar" style={{ width: 120, height: 12, marginBottom: 14 }} />
      <div className="admin-skel__bar" style={{ width: 280, height: 30, marginBottom: 8 }} />
      <div className="admin-skel__bar" style={{ width: 420, height: 14 }} />
      <div className="admin-skel__grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="admin-skel__bar" style={{ height: 96 }} />
        ))}
      </div>
    </div>
  )
}
