import { describe, expect, it } from "vitest";
import { getSample, InMemorySource, renderReport, runDailyCycle, SAMPLE_TODAY } from "../src/index";

async function sampleReport(): Promise<string> {
  const t = getSample();
  const source = new InMemorySource({ customers: t.customers, invoices: t.invoices, payments: t.payments });
  const result = await runDailyCycle({
    tenantId: t.tenantId,
    business: t.business,
    source,
    sequences: t.sequences,
    today: SAMPLE_TODAY,
    scanOnly: true,
  });
  return renderReport(result, t.customers);
}

describe("renderReport", () => {
  it("should render the headline sections for the sample tenant", async () => {
    const md = await sampleReport();
    expect(md).toContain(`# Receivables — ${SAMPLE_TODAY}`);
    expect(md).toContain("to collect");
    expect(md).toContain("Ageing:");
    expect(md).toContain("## Chase list — who to chase first");
    expect(md).toContain("## Approval queue");
  });

  it("should resolve customer names and show the chase table header", async () => {
    const md = await sampleReport();
    expect(md).toContain("| # | Customer | Risk | Exposure | Overdue | Why |");
    // A real customer name from the sample, not a raw id.
    expect(md).toMatch(/\|\s*1\s*\|\s*[A-Za-zΑ-Ωα-ω]/);
  });

  it("should note scan-only drafts and a cost footer", async () => {
    const md = await sampleReport();
    expect(md).toContain("draft generated on approval");
    expect(md).toMatch(/_\d+ to review · \$\d+\.\d{4}_$/);
  });

  it("should handle an empty queue gracefully", async () => {
    const t = getSample();
    const source = new InMemorySource({ customers: t.customers, invoices: [], payments: [] });
    const result = await runDailyCycle({
      tenantId: t.tenantId,
      business: t.business,
      source,
      sequences: t.sequences,
      today: SAMPLE_TODAY,
      scanOnly: true,
    });
    const md = renderReport(result, t.customers);
    expect(md).toContain("_Nothing due to chase today._");
  });
});
