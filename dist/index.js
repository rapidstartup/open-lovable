import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
const app = new Hono();
// Middleware
app.use('*', logger());
app.use('*', cors({
    origin: ['*'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}));
// Health check
app.get('/', (c) => c.json({
    status: 'ok',
    message: 'Open Lovable API is running on Cloudflare Workers',
    timestamp: new Date().toISOString(),
    environment: c.env.NODE_ENV || 'development'
}));
// Environment variables test endpoint
app.get('/api/env-test', (c) => c.json({
    status: 'environment test',
    NODE_ENV: c.env.NODE_ENV || 'not set',
    ANTHROPIC_API_KEY: c.env.ANTHROPIC_API_KEY ? '***set***' : 'not set',
    E2B_API_KEY: c.env.E2B_API_KEY ? '***set***' : 'not set',
    OPENAI_API_KEY: c.env.OPENAI_API_KEY ? '***set***' : 'not set',
    GROQ_API_KEY: c.env.GROQ_API_KEY ? '***set***' : 'not set'
}));
// Example API route
app.get('/api/health', (c) => c.json({
    status: 'healthy',
    worker: 'open-lovable',
    environment: c.env.NODE_ENV || 'development'
}));
// GPT-5 generation endpoint (placeholder for now)
app.post('/api/generate-ai-code-stream', async (c) => {
    try {
        const body = await c.req.json();
        // Check if required API keys are available
        if (!c.env.ANTHROPIC_API_KEY) {
            return c.json({
                error: 'ANTHROPIC_API_KEY not configured',
                message: 'Set this in Cloudflare dashboard Variables and Secrets'
            }, 500);
        }
        // This is where your GPT-5 generation logic would go
        // Workers have 30-minute timeout by default - much better than Netlify's 30 seconds!
        return c.json({
            message: 'GPT-5 generation endpoint ready',
            timeout: '30 minutes available',
            apiKeyConfigured: !!c.env.ANTHROPIC_API_KEY,
            body: body
        });
    }
    catch (error) {
        return c.json({ error: 'Invalid request' }, 400);
    }
});
// 404 handler
app.notFound((c) => c.json({ error: 'Not Found' }, 404));
// Error handler
app.onError((err, c) => {
    console.error('Error:', err);
    return c.json({ error: 'Internal Server Error' }, 500);
});
export default app;
