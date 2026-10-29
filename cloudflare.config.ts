import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "orun-streaming-platform",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-10",
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    env: {
      ASSETS: bindings.assets(),
      AUTH_SECRET: bindings.secret(),
      ORUN_ADMIN_CODE: bindings.secret(),
      ORUN_ADMIN_PASSWORD_HASH: bindings.secret(),
    },
  }),
});
