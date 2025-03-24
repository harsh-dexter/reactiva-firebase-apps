
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080
  },
  build: {
    chunkSizeWarningLimit: 800, // Increase warning limit to 800kb
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendors (large dependencies) into their own chunk
          vendor: ['react', 'react-dom', 'firebase', 'crypto-js', 'date-fns'],
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
})
