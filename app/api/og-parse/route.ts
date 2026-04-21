import { NextRequest, NextResponse } from 'next/server'
import ogs from 'open-graph-scraper'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // URL 유효성 검사
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const { result, error } = await ogs({
      url: parsedUrl.href,
      fetchOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MyLinkBox/1.0)',
        },
      },
      timeout: 10000,
    })

    if (error || !result.success) {
      // OG 파싱 실패 시 기본값 반환
      return NextResponse.json({
        title: getSiteName(url),
        description: null,
        thumbnail: null,
        site_name: getSiteName(url),
        favicon: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`,
      })
    }

    const ogImage = result.ogImage?.[0]?.url || null
    const favicon = result.favicon
      ? (result.favicon.startsWith('http')
          ? result.favicon
          : `${parsedUrl.origin}${result.favicon}`)
      : `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`

    return NextResponse.json({
      title: result.ogTitle || result.twitterTitle || getSiteName(url),
      description: result.ogDescription || result.twitterDescription || null,
      thumbnail: ogImage,
      site_name: result.ogSiteName || getSiteName(url),
      favicon,
    })
  } catch (err) {
    console.error('OG parse error:', err)
    return NextResponse.json({ error: 'Failed to parse URL' }, { status: 500 })
  }
}

function getSiteName(url: string): string {
  try {
    const { hostname } = new URL(url)
    const domain = hostname.replace('www.', '')
    const map: Record<string, string> = {
      'smartstore.naver.com': '네이버 스마트스토어',
      'shopping.naver.com': '네이버쇼핑',
      'musinsa.com': '무신사',
      'coupang.com': '쿠팡',
      'gmarket.co.kr': 'G마켓',
      '11st.co.kr': '11번가',
      'ssg.com': 'SSG닷컴',
      'ohou.se': '오늘의집',
      '29cm.co.kr': '29CM',
      'zigzag.kr': '지그재그',
    }
    for (const [key, label] of Object.entries(map)) {
      if (domain.includes(key)) return label
    }
    return domain
  } catch {
    return '웹사이트'
  }
}
