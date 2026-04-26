import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function getSiteLabel(hostname: string): string {
  const map: Record<string, string> = {
    'smartstore.naver.com': '네이버 스마트스토어',
    'brand.naver.com': '네이버 브랜드스토어',
    'shopping.naver.com': '네이버쇼핑',
    'musinsa.com': '무신사',
    'coupang.com': '쿠팡',
    'gmarket.co.kr': 'G마켓',
    '11st.co.kr': '11번가',
    'ssg.com': 'SSG닷컴',
    'ohou.se': '오늘의집',
    '29cm.co.kr': '29CM',
    'zigzag.kr': '지그재그',
    'instagram.com': '인스타그램',
    'ably.co.kr': '에이블리',
    'brandi.co.kr': '브랜디',
  }
  for (const [key, label] of Object.entries(map)) {
    if (hostname.includes(key)) return label
  }
  return hostname.replace('www.', '')
}

function getMeta(html: string, ...properties: string[]): string | null {
  for (const property of properties) {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"'<>]+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"'<>]+)["'][^>]+property=["']${property}["']`, 'i'),
      new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"'<>]+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"'<>]+)["'][^>]+name=["']${property}["']`, 'i'),
    ]
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match?.[1]) {
        const val = match[1].trim()
        if (val && !val.includes('에러') && !val.includes('오류')) return val
      }
    }
  }
  return null
}

async function tryMicrolink(url: string) {
  try {
    const res = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=false&meta=true`,
      { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 'success') return null
    return {
      title: data.data?.title || null,
      description: data.data?.description || null,
      thumbnail: data.data?.image?.url || data.data?.logo?.url || null,
    }
  } catch { return null }
}

async function tryDirectFetch(url: string) {
  const agents = [
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Twitterbot/1.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  ]
  for (const ua of agents) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ko-KR,ko;q=0.9',
          'Referer': 'https://www.google.com/',
        },
        signal: AbortSignal.timeout(7000),
        redirect: 'follow',
      })
      if (!res.ok) continue
      const html = await res.text()
      if (html.includes('에러페이지') || html.includes('accessDenied') || html.length < 500) continue
      const title = getMeta(html, 'og:title', 'twitter:title')
      const thumbnail = getMeta(html, 'og:image', 'twitter:image')
      const description = getMeta(html, 'og:description', 'description')
      if (title || thumbnail) return { title, description, thumbnail }
    } catch { continue }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    let parsedUrl: URL
    try { parsedUrl = new URL(url) } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const hostname = parsedUrl.hostname
    const siteName = getSiteLabel(hostname)
    const favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`

    const microlink = await tryMicrolink(url)
    const direct = (!microlink?.title && !microlink?.thumbnail) ? await tryDirectFetch(url) : null

    return NextResponse.json({
      title: microlink?.title || direct?.title || siteName + ' 상품',
      description: microlink?.description || direct?.description || null,
      thumbnail: microlink?.thumbnail || direct?.thumbnail || null,
      site_name: siteName,
      favicon,
      needsManualEdit: !microlink?.title && !direct?.title,
    })
  } catch (err) {
    console.error('OG parse error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
