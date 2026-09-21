import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolveMangaMetadata } from './netlify/lib/manga-metadata.mjs'

const mangaMetadataMiddleware = () => ({
  name: 'manga-metadata-dev-endpoint',
  configureServer(server) {
    server.middlewares.use('/api/manga-metadata', async (request, response) => {
      const url = new URL(request.url || '/', 'http://localhost')
      const title = String(url.searchParams.get('title') || '').trim().slice(0, 180)
      const malId = String(url.searchParams.get('malId') || '').slice(0, 20)
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      if (!title) {
        response.statusCode = 400
        response.end(JSON.stringify({ error: 'A manga title is required.' }))
        return
      }
      try {
        response.end(JSON.stringify(await resolveMangaMetadata({ malId, title })))
      } catch {
        response.end(JSON.stringify({ chapterCount: 0, mangaDexId: null, sourceUnavailable: true }))
      }
    })
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), mangaMetadataMiddleware()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-animations': ['gsap', 'framer-motion'],
          'vendor-graphics': ['ogl'],
          'vendor-icons': ['lucide-react', 'react-icons'],
          'vendor-ui': ['react-toastify', 'react-loading-skeleton', 'swiper'],
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
})
