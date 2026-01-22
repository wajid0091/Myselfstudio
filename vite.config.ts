import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // We cast process to 'any' to avoid TypeScript errors with 'cwd'
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // CRITICAL: Prioritize the Netlify system variable (process.env.API_KEY)
  // We check multiple variations to be safe.
  const apiKey = process.env.API_KEY || env.API_KEY || env.VITE_API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Inject the key securely into the client bundle
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    server: {
      host: true
    }
  };
});