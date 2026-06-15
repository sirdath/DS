/**
 * The observation seam. The engine never knows how a competitor's weekly metrics
 * were obtained — Firecrawl scrape, a reviews API, manual entry — it talks to this
 * interface. The package ships the interface + an example observer (drives the demo
 * and tests with zero network); the real Firecrawl-backed observer lives in
 * observers/firecrawl.ts and is selected only when a key is present.
 */

import type { BusinessRef, CompetitorMetrics, CompetitorRef } from "./types";

export interface Observer {
  readonly kind: string;
  /** Capture this competitor's current metrics. Missing signals are simply absent. */
  observe(competitor: CompetitorRef, business: BusinessRef): Promise<CompetitorMetrics>;
}

/** Returns pre-supplied metrics by competitor id — the demo/test observer. */
export class ExampleObserver implements Observer {
  readonly kind = "example";
  constructor(private readonly byId: Record<string, CompetitorMetrics>) {}
  async observe(competitor: CompetitorRef): Promise<CompetitorMetrics> {
    return this.byId[competitor.id] ?? {};
  }
}
