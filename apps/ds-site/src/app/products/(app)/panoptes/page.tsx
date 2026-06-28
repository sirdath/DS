// Panoptes — site selection, previewed inside the admin shell. The viewer itself is
// a standalone full-screen map app (/panoptes-viewer); here we embed it live (Athens
// demo study) so it can be explored without leaving /admin. "Open full screen" pops
// the standalone app for the full-bleed experience.
export default function PanoptesEmbedPage() {
  return (
    <div className="ws-embed">
      <div className="ws-embed__head">
        <div>
          <span className="ws-head__eyebrow">DS2 · Panoptes</span>
          <h1 className="ws-head__title">Site selection</h1>
          <p className="ws-head__sub">
            Demand, competition and access scored across a city, on a map, a live Athens demo below.
          </p>
        </div>
        <a
          className="ws-embed__full"
          href="/panoptes-viewer?demo=1"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open full screen ↗
        </a>
      </div>
      <div className="ws-embed__frame">
        <iframe
          src="/panoptes-viewer?demo=1"
          title="Panoptes, site-selection viewer (Athens demo)"
          loading="lazy"
        />
      </div>
    </div>
  )
}
