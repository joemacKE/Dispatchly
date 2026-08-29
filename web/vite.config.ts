import {
  defineConfig,
} from "vite";

import react from "@vitejs/plugin-react";

import {
  VitePWA,
} from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType:
        "autoUpdate",

      injectRegister:
        "auto",

      includeAssets: [
        "reflex-icon.svg",
      ],

      manifest: {
        name:
          "Reflex Delivery Coordination",

        short_name:
          "Reflex",

        description:
          "Delivery coordination for retailers, dispatchers and riders.",

        theme_color:
          "#1d6e59",

        background_color:
          "#f4f6f8",

        display:
          "standalone",

        start_url:
          "/",

        scope:
          "/",

        orientation:
          "portrait-primary",

        icons: [
          {
            src:
              "/reflex-icon.svg",

            sizes:
              "any",

            type:
              "image/svg+xml",

            purpose:
              "any maskable",
          },
        ],
      },

      workbox: {
        navigateFallback:
          "/index.html",

        cleanupOutdatedCaches:
          true,

        runtimeCaching: [
          {
            urlPattern:
              /^https?:\/\/localhost:8000\/.*$/,

            handler:
              "NetworkOnly",

            options: {
              cacheName:
                "reflex-api",
            },
          },
        ],
      },

      devOptions: {
        enabled: true,
      },
    }),
  ],
});