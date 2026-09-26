import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import JavaScriptObfuscator from 'javascript-obfuscator'

/**
 * Security headers. Served by `vite preview` here; mirror them on the real
 * host (see public/_headers and SECURITY.md) — headers such as
 * frame-ancestors / X-Frame-Options only work when sent by the server.
 */
function buildCsp(apiOrigin: string): string {
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}

function securityHeaders(csp: string): Record<string, string> {
  return {
    'Content-Security-Policy': csp,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  }
}

/** Obfuscates first-party source (src/**) in production builds only. */
function obfuscateAppCode(): Plugin {
  return {
    name: 'babyscan:obfuscate',
    apply: 'build',
    enforce: 'post',
    transform(code, id) {
      if (id.includes('node_modules') || !/\/src\/.*\.[jt]sx?$/.test(id)) return null
      const result = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.5,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.2,
        identifierNamesGenerator: 'hexadecimal',
        numbersToExpressions: true,
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 6,
        stringArray: true,
        stringArrayEncoding: ['rc4'],
        stringArrayThreshold: 0.9,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        // Module names in dynamic import() must stay literal or the bundler can't resolve them.
        reservedStrings: ['^jszip$', '^pdf-lib$'],
        transformObjectKeys: true,
        unicodeEscapeSequence: false,
        // selfDefending must stay off: Vite minifies after this step, which trips it into a hang.
        selfDefending: false,
        disableConsoleOutput: true,
        sourceMap: false,
        target: 'browser',
      })
      return { code: result.getObfuscatedCode(), map: null }
    },
  }
}

/** Adds CSP + referrer meta tags to the built index.html (dev needs inline HMR scripts). */
function injectSecurityMeta(csp: string): Plugin {
  return {
    name: 'babyscan:security-meta',
    apply: 'build',
    transformIndexHtml() {
      // frame-ancestors is ignored inside <meta>; it is sent as a header instead.
      const metaCsp = csp
        .split('; ')
        .filter((d) => !d.startsWith('frame-ancestors'))
        .join('; ')
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: metaCsp },
          injectTo: 'head-prepend',
        },
        {
          tag: 'meta',
          attrs: { name: 'referrer', content: 'no-referrer' },
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // Optional while the app runs on mock data (src/features/reports/mockData.ts):
  // without it the CSP simply allows no external API origin.
  if (!env.VITE_SUPABASE_URL) {
    console.warn('VITE_SUPABASE_URL is not set: building without a report API origin (mock data only).')
  }
  const csp = buildCsp(env.VITE_SUPABASE_URL ? new URL(env.VITE_SUPABASE_URL).origin : '')

  return {
    plugins: [react(), obfuscateAppCode(), injectSecurityMeta(csp)],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
      },
    },
    preview: { headers: securityHeaders(csp) },
    build: {
      target: 'es2022',
      sourcemap: false,
      minify: true,
      cssMinify: true,
      assetsInlineLimit: 0,
      reportCompressedSize: false,
      rolldownOptions: {
        output: {
          comments: false,
          entryFileNames: 'assets/[hash].js',
          chunkFileNames: 'assets/[hash].js',
          assetFileNames: 'assets/[hash][extname]',
        },
      },
    },
  }
})
