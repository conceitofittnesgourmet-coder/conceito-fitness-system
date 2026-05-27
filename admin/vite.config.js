import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";

import { VitePWA }
from "vite-plugin-pwa";

export default defineConfig({

  plugins: [

    react(),

    VitePWA({

      registerType:
        "autoUpdate",

      includeAssets: [

        "icon-192.png",
        "icon-512.png"

      ],

      manifest: {

        name:
          "Conceito Fitness Gourmet",

        short_name:
          "Conceito Admin",

        description:
          "Painel gourmet realtime",

        theme_color:
          "#22c55e",

        background_color:
          "#0f172a",

        display:
          "standalone",

        icons: [

          {
            src:
              "/icon-192.png",

            sizes:
              "192x192",

            type:
              "image/png"
          },

          {
            src:
              "/icon-512.png",

            sizes:
              "512x512",

            type:
              "image/png"
          }

        ]

      }

    })

  ]

});