# 🌍 Environment Variables for Cloudflare Workers

## 📋 **Required Environment Variables**

Set these in your **Cloudflare Dashboard** → **Workers & Pages** → **open-lovable** → **Settings** → **Variables and Secrets**

### 🔐 **API Keys (Required)**
```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
E2B_API_KEY=your_e2b_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

### ⚙️ **Application Settings**
```bash
NODE_ENV=production
```

## 🚨 **Important Notes**

### ✅ **Do This:**
- Set variables in **Cloudflare Dashboard** (Variables and Secrets section)
- Use **Secret** type for API keys (more secure)
- Use **Plain Text** type for non-sensitive values like `NODE_ENV`

### ❌ **Don't Do This:**
- Don't commit API keys to version control
- Don't hardcode values in `wrangler.toml`
- Don't use `.env` files (they won't work with Workers)

## 🔧 **How to Set Variables**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **open-lovable**
3. Click **Settings** tab
4. Click **Variables and Secrets**
5. Add each variable:
   - **Type**: Choose "Secret" for API keys, "Plain Text" for others
   - **Variable name**: e.g., `ANTHROPIC_API_KEY`
   - **Value**: Your actual API key or value
6. Click **Add variable** for each one
7. **Deploy** to apply changes

## 🧪 **Testing Variables**

After setting variables, test them in your Worker:

```typescript
// In your Worker code
console.log('NODE_ENV:', c.env.NODE_ENV);
console.log('ANTHROPIC_API_KEY exists:', !!c.env.ANTHROPIC_API_KEY);
```

## 🔄 **Deployment Process**

1. **Set variables** in Cloudflare dashboard
2. **Build Worker**: `npm run build:worker`
3. **Deploy**: `npm run deploy:cf`
4. **Variables persist** across deployments

## 🆘 **Troubleshooting**

### Variables Not Working?
- Check they're set in **Variables and Secrets** section
- Ensure you clicked **Deploy** after adding variables
- Verify variable names match exactly (case-sensitive)
- Check Worker logs for any errors

### Variables Wiped After Deploy?
- This configuration should prevent that
- Variables set in dashboard should persist
- If still happening, check `wrangler.toml` configuration
