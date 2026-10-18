import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://pureclear.dusrel.com",
  output: "static",
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
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    worker: {
      format: "es",
    },
  },
});
