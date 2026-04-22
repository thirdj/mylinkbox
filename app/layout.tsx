import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Damoajo - 나만의 링크 보관함',
  description: '쇼핑몰, SNS 링크를 한 곳에 모아두는 나만의 즐겨찾기',
  icons: {
    icon: '/favicon.svg',
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
