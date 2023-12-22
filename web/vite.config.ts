import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {resolve} from "path";

const __dirname = resolve();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
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
  })],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    }
  }
})
