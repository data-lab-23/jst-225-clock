import { defineConfig } from "vite";

export function resolveBasePath(envValue?: string): string {
  if (!envValue) return "./";

  return `/${envValue.replace(/^\/+|\/+$/g, "")}/`;
}

export default defineConfig({
  base: resolveBasePath(process.env.VITE_BASE_PATH),
  test: {
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
