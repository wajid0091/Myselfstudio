import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // CRITICAL: Prioritize the Netlify system variable (process.env.API_KEY)
  // We check multiple variations to be safe.
  const apiKey = process.env.API_KEY || process.env.VITE_API_KEY || env.API_KEY || env.VITE_API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Inject the key securely into the client bundle
      // This ensures 'process.env.API_KEY' is replaced by the actual string value during build
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.VITE_API_KEY': JSON.stringify(apiKey)
    },
    server: {
      host: true
    }
  };
});