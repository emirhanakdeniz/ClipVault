import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Tauri expects a fixed dev server port; fail if it is taken.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // Cargo locks files under src-tauri/target while linking the app exe;
      // watching them crashes Vite with EBUSY on Windows.
      ignored: ["**/src-tauri/**"],
    },
  },
});
