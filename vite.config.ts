
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { componentTagger } from "lovable-tagger"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: "::",
    port: 8080,
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage']
  },
  build: {
    chunkSizeWarningLimit: 800, // Increase warning limit to 800kb
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendors (large dependencies) into their own chunk
          vendor: ['react', 'react-dom', 'crypto-js', 'date-fns'],
          // Firebase in its own chunk to avoid resolution issues
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          // UI libraries in a separate chunk
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-sheet',
            '@radix-ui/react-toast',
          ],
          // App components
          components: [
            './src/components/Avatar.tsx',
            './src/components/ChatHeader.tsx',
            './src/components/ChatInput.tsx',
            './src/components/Message.tsx',
            './src/components/MessageList.tsx',
            './src/components/RoomsList.tsx',
          ],
        },
      },
    },
  },
}))
