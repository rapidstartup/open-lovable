import { NextResponse } from 'next/server';

export const runtime = 'edge';

declare global {
  var activeSandbox: any;
  var sandboxData: any;
  var existingFiles: Set<string>;
}

export async function GET() {
  try {
    // Check if sandbox exists
    const sandboxExists = !!global.activeSandbox;
    
    let sandboxHealthy = false;
    let sandboxInfo = null;
    
    if (sandboxExists && global.activeSandbox) {
      try {
        // Verify the dev server is actually responding
        const url = global.sandboxData?.url as string | undefined;
        let statusCode: number | undefined;
        if (url) {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4000);
          try {
            const resp = await fetch(url, { method: 'GET', signal: controller.signal });
            statusCode = resp.status;
            sandboxHealthy = resp.ok;
          } catch {
            sandboxHealthy = false;
          } finally {
            clearTimeout(timeout);
          }
        } else {
          sandboxHealthy = false;
        }
        sandboxInfo = {
          sandboxId: global.sandboxData?.sandboxId,
          url: global.sandboxData?.url,
          filesTracked: global.existingFiles ? Array.from(global.existingFiles) : [],
          lastHealthCheck: new Date().toISOString(),
          statusCode
        };
      } catch (error) {
        console.error('[sandbox-status] Health check failed:', error);
        sandboxHealthy = false;
      }
    }
    
    return NextResponse.json({
      success: true,
      active: sandboxExists,
      healthy: sandboxHealthy,
      sandboxData: sandboxInfo,
      message: sandboxHealthy 
        ? 'Sandbox is active and healthy' 
        : sandboxExists 
          ? 'Sandbox exists but is not responding' 
          : 'No active sandbox'
    });
    
  } catch (error) {
    console.error('[sandbox-status] Error:', error);
    return NextResponse.json({ 
      success: false,
      active: false,
      error: (error as Error).message 
    }, { status: 500 });
  }
}