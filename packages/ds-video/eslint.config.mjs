// Remotion's own flat config — this package is a Remotion video project, not
// part of the site's lint surface.
import { config } from "@remotion/eslint-config-flat";

export default [
  ...config,
  {
    ignores: ["node_modules/**", "out/**", ".remotion/**"],
  },
];
