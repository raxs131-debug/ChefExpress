import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // Archivos estáticos a precachear para el acceso offline
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      manifest: {
        name: 'Chef Express',
        short_name: 'ChefExpress',
        description: 'Encuentra recetas basadas en tus ingredientes.',
        theme_color: '#3498db', // Color primario de tu app (puedes cambiarlo)
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/', // Alcance de la PWA
        start_url: '/', // URL de inicio al abrir la PWA
        icons: [
          {
            // Ícono de 192x192
            src: '/chef.png', 
            sizes: '192x192',
            type: 'image/png',
          },
          {
            // Ícono de 512x512
            src: '/receta.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            // Ícono 'maskable' (ideal para Android)
            src: '/receta.png', // Reutilizamos el de 512x512
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable', 
          },
        ],
      },
    }),
  ],
});