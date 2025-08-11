import { NextRequest, NextResponse } from 'next/server';

// Allow longer processing time for screenshot capture to avoid 504s
export const maxDuration = 60; // seconds

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Use Firecrawl API to capture screenshot
    if (!process.env.FIRECRAWL_API_KEY) {
      return NextResponse.json({ error: 'Server not configured: missing FIRECRAWL_API_KEY' }, { status: 500 });
    }
    
    async function attemptScreenshot(params: { waitFor: number; timeout: number; addWaitAction?: boolean }) {
      const payload: any = {
        url,
        formats: ['screenshot'],
        waitFor: params.waitFor,
        timeout: params.timeout,
        blockAds: true,
      };
      if (params.addWaitAction) {
        payload.actions = [{ type: 'wait', milliseconds: Math.min(2000, params.waitFor) }];
      }
      const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      return resp;
    }

    // Try fast path first, then a moderate retry if Firecrawl needs more time
    let firecrawlResponse = await attemptScreenshot({ waitFor: 500, timeout: 15000, addWaitAction: false });
    if (!firecrawlResponse.ok) {
      const errText = await firecrawlResponse.text().catch(() => '');
      // Retry once with a bit longer timeout, still under typical platform limits
      firecrawlResponse = await attemptScreenshot({ waitFor: 0, timeout: 25000, addWaitAction: false });
      if (!firecrawlResponse.ok) {
        const retryErrText = await firecrawlResponse.text().catch(() => '');
        throw new Error(`Firecrawl API error: ${retryErrText || errText}`);
      }
    }

    const data = await firecrawlResponse.json();
    if (!data.success || !data.data?.screenshot) {
      throw new Error('Failed to capture screenshot');
    }

    return NextResponse.json({
      success: true,
      screenshot: data.data.screenshot,
      metadata: data.data.metadata
    });

  } catch (error: any) {
    console.error('Screenshot capture error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to capture screenshot' 
    }, { status: 500 });
  }
}