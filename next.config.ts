import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Strict mode para detectar problemas em desenvolvimento
  reactStrictMode: true,

  // Módulos Swc para melhor performance
  swcMinify: true,

  // Imagens otimizadas
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudflare.com',
      },
    ],
  },

  // Headers de segurança
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value:
            "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:;",
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ],

  // Variáveis de ambiente públicas
  env: {
    NEXT_PUBLIC_APP_NAME: 'Hubstry Compliance',
    NEXT_PUBLIC_APP_DESCRIPTION:
      'Plataforma profissional de auditoria de conformidade digital',
  },

  // Webpack para otimizações
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    }
    return config
  },

  // Experimental features
  experimental: {
    // Componentes do App Router totalmente funcionais
    optimizePackageImports: [
      '@radix-ui/*',
      'lucide-react',
      'framer-motion',
    ],
  },

  // Redirects e rewrites
  async redirects() {
    return []
  },

  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    }
  },
}

export default nextConfig
