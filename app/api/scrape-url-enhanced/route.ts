export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

// Allow longer processing time for scraping to avoid 504s during cold starts
export const maxDuration = 60; // seconds

// Function to sanitize smart quotes and other problematic characters
function sanitizeQuotes(text: string): string {
  return text
    .replace(/[""]/g, '"') // Smart quotes to regular quotes
    .replace(/['']/g, "'") // Smart apostrophes to regular apostrophes
    .replace(/–/g, '-') // En dash to hyphen
    .replace(/—/g, '-') // Em dash to hyphen
    .replace(/…/g, '...') // Ellipsis to three dots
    .replace(/\u00A0/g, ' '); // Non-breaking space
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'URL is required'
      }, { status: 400 });
    }
    
    console.log('[scrape-url-enhanced] Scraping with Firecrawl:', url);
    
    const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY environment variable is not set');
    }
    
    // Implement retry logic with exponential backoff
    const maxRetries = 3;
    let lastError: string = '';
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Calculate timeout based on attempt number
        const baseTimeout = 25000; // 25 seconds base
        const timeout = Math.min(baseTimeout * Math.pow(2, attempt), 60000); // Max 60 seconds
        
        // Calculate wait time based on attempt number
        const waitFor = Math.min(1500 * Math.pow(2, attempt), 5000); // Max 5 seconds wait
        
        console.log(`[scrape-url-enhanced] Attempt ${attempt + 1}/${maxRetries} with timeout: ${timeout}ms, waitFor: ${waitFor}ms`);
        
        // Make request to Firecrawl API with maxAge for 500% faster scraping
        const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url,
            formats: ['markdown', 'html'],
            waitFor,
            timeout,
            blockAds: true,
            maxAge: 3600000, // Use cached data if less than 1 hour old (500% faster!)
            actions: [
              {
                type: 'wait',
                milliseconds: Math.min(waitFor, 2000)
              }
            ]
          })
        });
        
        if (firecrawlResponse.ok) {
          const data = await firecrawlResponse.json();
          
          if (!data.success || !data.data) {
            throw new Error('Failed to scrape content');
          }
          
          const { markdown, html, metadata } = data.data;
          
          // Sanitize the markdown content
          const sanitizedMarkdown = sanitizeQuotes(markdown || '');
          
          // Extract structured data from the response
          const title = metadata?.title || '';
          const description = metadata?.description || '';
          
          // Format content for AI
          const formattedContent = `
Title: ${sanitizeQuotes(title)}
Description: ${sanitizeQuotes(description)}
URL: ${url}

Main Content:
${sanitizedMarkdown}
          `.trim();
          
          console.log(`[scrape-url-enhanced] Success on attempt ${attempt + 1}`);
          
          return NextResponse.json({
            success: true,
            url,
            content: formattedContent,
            structured: {
              title: sanitizeQuotes(title),
              description: sanitizeQuotes(description),
              content: sanitizedMarkdown,
              url
            },
            metadata: {
              scraper: 'firecrawl-enhanced',
              timestamp: new Date().toISOString(),
              contentLength: formattedContent.length,
              cached: data.data.cached || false, // Indicates if data came from cache
              attempt: attempt + 1,
              ...metadata
            },
            message: 'URL scraped successfully with Firecrawl (with caching for 500% faster performance)'
          });
          
        } else {
          const error = await firecrawlResponse.text();
          lastError = `HTTP ${firecrawlResponse.status}: ${error}`;
          
          // If it's a 504 (gateway timeout), wait before retrying
          if (firecrawlResponse.status === 504 && attempt < maxRetries - 1) {
            const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(`[scrape-url-enhanced] 504 error, waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          // For other errors, throw immediately
          throw new Error(`Firecrawl API error: ${lastError}`);
        }
        
      } catch (error) {
        lastError = (error as Error).message;
        console.error(`[scrape-url-enhanced] Attempt ${attempt + 1} failed:`, lastError);
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries - 1) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`[scrape-url-enhanced] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw new Error(`All ${maxRetries} attempts failed. Last error: ${lastError}`);
    
  } catch (error) {
    console.error('[scrape-url-enhanced] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      retries: 3
    }, { status: 500 });
  }
}