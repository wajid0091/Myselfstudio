
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables from the root folder and the system
  // Fixed: Cast process to any to handle type error where cwd() might not be defined on the process type
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Try to find the API key in all possible locations
  const apiKey = env.API_KEY || env.VITE_API_KEY || process.env.API_KEY || process.env.VITE_API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // This makes process.env.API_KEY available throughout the React app
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.VITE_API_KEY': JSON.stringify(apiKey)
    },
    server: {
      host: true
    },
    build: {
      sourcemap: false,
      outDir: 'dist'
    }
  };
});
