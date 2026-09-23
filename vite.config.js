import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolveMangaMetadata } from './netlify/lib/manga-metadata.mjs'
import { resolveAnimeDigest } from './netlify/lib/anime-digest.mjs'
import { handler as discoveryHandler } from './netlify/functions/discovery.mjs'
import { fetchAnimeQuotes, fetchRandomAnimeQuote } from './netlify/lib/anime-quotes.mjs'
import { searchAcdbCharacters } from './netlify/lib/acdb-characters.mjs'

const mangaMetadataMiddleware = () => ({
  name: 'manga-metadata-dev-endpoint',
  configureServer(server) {
    server.middlewares.use('/api/manga-metadata', async (request, response) => {
      const url = new URL(request.url || '/', 'http://localhost')
      const title = String(url.searchParams.get('title') || '').trim().slice(0, 180)
      const malId = String(url.searchParams.get('malId') || '').slice(0, 20)
      const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0)
      const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 50))
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      if (!title) {
        response.statusCode = 400
        response.end(JSON.stringify({ error: 'A manga title is required.' }))
        return
      }
      try {
        response.end(JSON.stringify(await resolveMangaMetadata({ malId, title, offset, limit })))
      } catch {
        response.end(JSON.stringify({ chapterCount: 0, mangaDexId: null, chapters: [], sourceUnavailable: true }))
      }
    })
  },
})

const animeDigestMiddleware = () => ({
  name: 'anime-digest-dev-endpoint',
  configureServer(server) {
    server.middlewares.use('/api/anime-digest', async (request, response) => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      try {
        const url = new URL(request.url || '/', 'http://localhost')
        response.end(JSON.stringify(await resolveAnimeDigest({ force: url.searchParams.get('refresh') === '1' })))
      } catch {
        response.end(JSON.stringify({ news: [], quote: null, facts: [] }))
      }
    })
  },
})

const discoveryMiddleware = () => ({
  name: 'ai-discovery-dev-endpoint',
  configureServer(server) {
    server.middlewares.use('/api/discovery', async (request, response) => {
      const chunks = []
      for await (const chunk of request) chunks.push(chunk)
      const result = await discoveryHandler({
        httpMethod: request.method || 'POST',
        body: Buffer.concat(chunks).toString('utf8'),
      })
      response.statusCode = result.statusCode || 200
      Object.entries(result.headers || {}).forEach(([key, value]) => response.setHeader(key, value))
      response.end(result.body || '')
    })
  },
})

const animeQuotesMiddleware = () => ({
  name: 'anime-quotes-dev-endpoint',
  configureServer(server) {
    server.middlewares.use('/api/anime-quotes', async (request, response) => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      const url = new URL(request.url || '/', 'http://localhost')
      const query = String(url.searchParams.get('q') || url.searchParams.get('character') || '').trim()
      if (query) {
        const quotes = await fetchAnimeQuotes(query)
        response.end(JSON.stringify({ quotes, available: quotes.length > 0 }))
        return
      }
      const quote = await fetchRandomAnimeQuote()
      response.end(JSON.stringify({ quote, available: Boolean(quote) }))
    })
  },
})

const characterSearchMiddleware = () => ({
  name: 'character-search-dev-endpoint',
  configureServer(server) {
    server.middlewares.use('/api/characters', async (request, response) => {
      const url = new URL(request.url || '/', 'http://localhost')
      const characters = await searchAcdbCharacters(url.searchParams.get('q') || '')
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ characters, source: 'ACDB' }))
    })
  },
})

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return {
  plugins: [react(), mangaMetadataMiddleware(), animeDigestMiddleware(), discoveryMiddleware(), animeQuotesMiddleware(), characterSearchMiddleware()],
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
  }
})
