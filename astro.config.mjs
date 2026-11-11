import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://pureclear.dusrel.com",
  output: "static",
  trailingSlash: "never",
  i18n: {
    locales: ["en", "hi", "as"],
    defaultLocale: "en",
    prefixDefaultLocale: false,
  },
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en",
          hi: "hi",
          as: "as",
        },
      },
      serialize(item) {
        return { ...item, lastmod: new Date().toISOString().slice(0, 10) };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    worker: {
      format: "es",
    },
  },
});
