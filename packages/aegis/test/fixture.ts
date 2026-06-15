/** A compact but realistically-shaped PageSpeed Insights response for tests. */
export const PSI_FIXTURE = {
  id: "https://example.com/",
  lighthouseResult: {
    finalUrl: "https://example.com/",
    categories: {
      performance: {
        score: 0.45,
        auditRefs: [
          { id: "largest-contentful-paint", weight: 25 },
          { id: "render-blocking-resources", weight: 0 },
          { id: "unused-css-rules", weight: 0 },
          { id: "uses-responsive-images", weight: 0 },
        ],
      },
      accessibility: {
        score: 0.72,
        auditRefs: [
          { id: "image-alt", weight: 10 },
          { id: "color-contrast", weight: 7 },
          { id: "label", weight: 7 },
          { id: "document-title", weight: 3 },
        ],
      },
      seo: {
        score: 0.83,
        auditRefs: [
          { id: "meta-description", weight: 1 },
          { id: "link-text", weight: 1 },
        ],
      },
      "best-practices": {
        score: 0.75,
        auditRefs: [
          { id: "errors-in-console", weight: 1 },
          { id: "uses-https", weight: 5 },
        ],
      },
    },
    audits: {
      "largest-contentful-paint": { title: "Largest Contentful Paint", score: 0.3, scoreDisplayMode: "numeric", numericValue: 4200, displayValue: "4.2 s" },
      "cumulative-layout-shift": { title: "Cumulative Layout Shift", score: 0.9, scoreDisplayMode: "numeric", numericValue: 0.05, displayValue: "0.05" },
      "total-blocking-time": { title: "Total Blocking Time", score: 0.4, scoreDisplayMode: "numeric", numericValue: 600, displayValue: "600 ms" },
      "first-contentful-paint": { title: "First Contentful Paint", score: 0.6, scoreDisplayMode: "numeric", numericValue: 2200, displayValue: "2.2 s" },
      "speed-index": { title: "Speed Index", score: 0.5, scoreDisplayMode: "numeric", numericValue: 4500, displayValue: "4.5 s" },
      "render-blocking-resources": { title: "Eliminate render-blocking resources", score: 0, scoreDisplayMode: "metricSavings", displayValue: "Potential savings of 1,200 ms" },
      "unused-css-rules": { title: "Reduce unused CSS", score: 0.5, scoreDisplayMode: "metricSavings", displayValue: "Potential savings of 90 KiB" },
      "uses-responsive-images": { title: "Properly size images", score: 1, scoreDisplayMode: "metricSavings" },
      "image-alt": { title: "Image elements have [alt] attributes", score: 0, scoreDisplayMode: "binary", displayValue: "3 elements" },
      "color-contrast": { title: "Background and foreground colors have sufficient contrast", score: 0, scoreDisplayMode: "binary" },
      "label": { title: "Form elements have associated labels", score: 0, scoreDisplayMode: "binary" },
      "document-title": { title: "Document has a <title> element", score: 1, scoreDisplayMode: "binary" },
      "meta-description": { title: "Document has a meta description", score: 0, scoreDisplayMode: "binary" },
      "link-text": { title: "Links have descriptive text", score: 1, scoreDisplayMode: "binary" },
      "errors-in-console": { title: "No browser errors logged to the console", score: 0, scoreDisplayMode: "binary" },
      "uses-https": { title: "Uses HTTPS", score: 1, scoreDisplayMode: "binary" },
    },
  },
};
