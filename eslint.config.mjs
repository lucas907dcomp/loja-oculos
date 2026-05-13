import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // AIOX framework directories (not project code)
    ".aiox-core/**",
    ".aiox/**",
    ".antigravity/**",
    ".codex/**",
    ".gemini/**",
    ".cursor/**",
    ".claude/**",
    "nextjs-bootstrap/**",
    // Prisma generated client
    "src/generated/**",
    // Prisma config (uses CommonJS imports)
    "prisma.config.ts",
  ]),
]);

export default eslintConfig;
