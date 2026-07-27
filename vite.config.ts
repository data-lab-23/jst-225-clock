import { configDefaults, defineConfig } from "vitest/config";

export function resolveBasePath(envValue?: string): string {
  if (!envValue) return "./";

  const normalized = envValue.replace(/^\/+|\/+$/g, "");
  return normalized ? `/${normalized}/` : "/";
}

export default defineConfig({
  base: resolveBasePath(process.env.VITE_BASE_PATH),
  test: {
    environment: "jsdom",
    exclude: configDefaults.exclude.filter((pattern) => !pattern.includes(".config.*")),
  },
});
