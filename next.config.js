/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    // 이미지 최적화 캐시 늘리기
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7일
  },
  // 빌드 최적화
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig
