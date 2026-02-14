
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables from the root folder and the system
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Explicitly capture specific API keys requested by the user
  const apiKey = env.API_KEY || env.VITE_API_KEY || '';
  const apiKey1 = env.API_KEY_1 || env.VITE_API_KEY_1 || '';
  const apiKey2 = env.API_KEY_2 || env.VITE_API_KEY_2 || '';
  const apiKey3 = env.API_KEY_3 || env.VITE_API_KEY_3 || '';
  const apiKey4 = env.API_KEY_4 || env.VITE_API_KEY_4 || '';
  const openRouterKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Pass these specific keys to the client-side code safely
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.API_KEY_1': JSON.stringify(apiKey1),
      'process.env.API_KEY_2': JSON.stringify(apiKey2),
      'process.env.API_KEY_3': JSON.stringify(apiKey3),
      'process.env.API_KEY_4': JSON.stringify(apiKey4),
      'process.env.OPENROUTER_API_KEY': JSON.stringify(openRouterKey),
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
