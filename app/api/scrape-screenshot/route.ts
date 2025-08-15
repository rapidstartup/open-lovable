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

    // Implement exponential backoff retry strategy
    const maxRetries = 3;
    let lastError: string = '';
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Calculate timeout based on attempt number (exponential backoff)
        const baseTimeout = 15000; // 15 seconds base
        const timeout = Math.min(baseTimeout * Math.pow(2, attempt), 45000); // Max 45 seconds
        
        // Calculate wait time based on attempt number
        const waitFor = Math.min(500 * Math.pow(2, attempt), 3000); // Max 3 seconds wait
        
        console.log(`[scrape-screenshot] Attempt ${attempt + 1}/${maxRetries} with timeout: ${timeout}ms, waitFor: ${waitFor}ms`);
        
        const firecrawlResponse = await attemptScreenshot({ 
          waitFor, 
          timeout, 
          addWaitAction: attempt > 0 
        });
        
        if (firecrawlResponse.ok) {
          const data = await firecrawlResponse.json();
          if (data.success && data.data?.screenshot) {
            console.log(`[scrape-screenshot] Success on attempt ${attempt + 1}`);
            return NextResponse.json({
              success: true,
              screenshot: data.data.screenshot,
              metadata: data.data.metadata
            });
          } else {
            throw new Error('Invalid response from Firecrawl API');
          }
        } else {
          const errorText = await firecrawlResponse.text().catch(() => '');
          lastError = `HTTP ${firecrawlResponse.status}: ${errorText}`;
          
          // If it's a 504 (gateway timeout), wait before retrying
          if (firecrawlResponse.status === 504 && attempt < maxRetries - 1) {
            const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(`[scrape-screenshot] 504 error, waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          // For other errors, throw immediately
          throw new Error(`Firecrawl API error: ${lastError}`);
        }
      } catch (error) {
        lastError = (error as Error).message;
        console.error(`[scrape-screenshot] Attempt ${attempt + 1} failed:`, lastError);
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries - 1) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`[scrape-screenshot] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw new Error(`All ${maxRetries} attempts failed. Last error: ${lastError}`);

  } catch (error: any) {
    console.error('Screenshot capture error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to capture screenshot',
      retries: 3
    }, { status: 500 });
  }
}