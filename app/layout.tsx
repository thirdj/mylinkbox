import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MyLinkBox - 나만의 쇼핑 링크 보관함',
  description: '네이버, 무신사, 쿠팡 등 쇼핑몰 링크를 한 곳에 모아두는 나만의 위시리스트',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
