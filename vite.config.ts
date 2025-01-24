import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      'process.env.SERVER_URL': JSON.stringify(env.SERVER_URL)
    }, 
    plugins: [react()],
    server: {
      watch: {
        usePolling: true, // Ensures Docker handles file change notifications correctly
      },
      host: "0.0.0.0", // Makes the server accessible outside the container
      port: 8000, // Ensure the port matches the exposed one
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
