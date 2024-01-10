import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";

const __dirname = resolve();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          [
            "babel-plugin-direct-import",
            {
              modules: ["@mui/material", "@mui/icons-material", "@mui/lab"],
            },
          ],
        ],
      },
    }),
    legacy(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
