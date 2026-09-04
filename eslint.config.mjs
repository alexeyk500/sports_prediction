import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "prisma/migrations/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
];

export default eslintConfig;
