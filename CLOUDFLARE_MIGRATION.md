# Cloudflare Migration Guide

## 🚀 Why Cloudflare Pages + Workers is Better

### Timeout Handling
- **Netlify**: 10s default, 300s max (what we were fighting)
- **Cloudflare Workers**: 30 minutes default (1800s) - much more generous!
- **Cloudflare Pages Functions**: 30 minutes default (1800s)

### Performance & CDN
- **Global CDN**: 200+ locations vs Netlify's ~20
- **Better throughput**: Optimized for streaming responses
- **Edge computing**: Functions run closer to users

### Cost & Scaling
- **Workers**: $5/month for 10M requests (very generous)
- **Pages**: Free tier includes 100K requests/month
- **Better cold start performance**

## 🔧 What We've Added

### 1. Wrangler CLI
```bash
npm install -D wrangler
```

### 2. Configuration Files
- `wrangler.toml` - Main Wrangler configuration
- `.cloudflare/pages.toml` - Cloudflare Pages specific config
- `.cloudflare/pages.json` - Alternative JSON config

### 3. Updated Package.json Scripts
```json
"deploy:cf": "wrangler pages deploy .next --project-name open-lovable",
"deploy:cf:dev": "wrangler pages dev .next --project-name open-lovable"
```

## 🚀 Migration Steps

### Step 1: Login to Cloudflare
```bash
npx wrangler login
```

### Step 2: Create Cloudflare Pages Project
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Pages
3. Create new project: "open-lovable"
4. Connect your GitHub repository

### Step 3: Set Environment Variables
In Cloudflare Pages dashboard, set:
- `NODE_ENV`: `production`
- `ANTHROPIC_API_KEY`: Your API key
- `E2B_API_KEY`: Your E2B key
- Any other environment variables from your `.env`

### Step 4: Deploy
```bash
npm run deploy:cf
```

## 🎯 Benefits for Your Use Case

### GPT-5 Generations
- **Before**: 30 seconds max (Netlify)
- **After**: 30 minutes max (Cloudflare) - 60x improvement!

### Better Streaming
- Optimized for long-running responses
- Better handling of AI generation streams

### Global Performance
- Users worldwide get better response times
- Edge functions run closer to users

## 🔄 Testing the Migration

### Local Development
```bash
npm run deploy:cf:dev
```

### Production Deployment
```bash
npm run deploy:cf
```

### Verify Timeouts
Test your GPT-5 generation endpoints - they should now support much longer timeouts!

## 🚨 Important Notes

### API Routes
- Your existing Next.js API routes will work as Cloudflare Pages Functions
- Functions automatically get 30-minute timeout
- No code changes needed for most endpoints

### Environment Variables
- Set all environment variables in Cloudflare Pages dashboard
- They'll be available to your functions

### Monitoring
- Use Cloudflare Analytics to monitor performance
- Check function logs in the dashboard

## 🔮 Future Enhancements

### Option 1: Keep Pages Functions
- Minimal migration effort
- 30-minute timeout by default
- Good performance

### Option 2: Migrate to Workers
- Better performance and control
- More complex migration
- Can be done incrementally

## 📚 Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Pages Functions](https://developers.cloudflare.com/pages/platform/functions/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Migration from Netlify](https://developers.cloudflare.com/pages/platform/functions/migrate-from-netlify/)


