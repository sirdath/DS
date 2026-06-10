import dsConfig from "@ds/eslint-config";
import nextPlugin from "@next/eslint-plugin-next";
import react from "eslint-plugin-react";

// The shared @ds/eslint-config covers JS + TS + prettier. This app also needs
// the Next.js and React rules — the codebase relies on `@next/next/*` and
// `react/*` rule names in inline eslint-disable comments, so the plugins that
// define them must be loaded here (Next 16 removed `next lint`, which used to
// provide them implicitly).
export default [
  ...dsConfig,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
      react,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "react/no-unescaped-entities": "error",
    },
  },
  {
    // public/ holds built/vendored static sites (e.g. delivered client builds);
    // they are deploy artifacts, not our source, so never lint them.
    ignores: [".next/**", "out/**", "public/**"],
  },
];
