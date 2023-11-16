import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from "path";

const __dirname = path.resolve();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    }
  }
})
