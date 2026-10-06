import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import dns from "dns";

dns.setDefaultResultOrder("verbatim");

export default () => {
  const baseURL = process.env.APP_ENV === "production" ? "/sev2026/p3/t4/" : "/";
  return defineConfig({
    plugins: [vue(), vuetify({ autoImport: false })],
    server: { host: "localhost", port: 8082 },
    base: baseURL,
  });
};
