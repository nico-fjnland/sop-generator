# Export Document Edge Function

Server-side PDF/Word document export using Gotenberg for consistent rendering across all browsers.

## Setup

### 1. Deploy Gotenberg on Railway

See `railway-gotenberg-setup.md` in the project root for detailed instructions.

Quick summary:
1. Create Railway account at https://railway.app
2. Deploy Docker image: `gotenberg/gotenberg:8`
3. Enable public networking to get URL

### 2. Set Environment Variables

The function uses the following environment variables:

**Required:**
- `GOTENBERG_URL` - Your Gotenberg service URL (e.g., `https://gotenberg-xxx.up.railway.app`)

**Auto-available in Supabase:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (optional, for caching on Pro plan)

**Configure in Supabase Dashboard:**
1. Go to Project Settings → Edge Functions → Secrets
2. Add `GOTENBERG_URL` with your Railway URL

### 3. Deploy the Edge Function

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy export-document
```

### 4. Create Storage Bucket (Optional, for caching)

If you want to enable caching (requires Pro plan with Service Role Key):

```sql
-- Create exports bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', false);

-- Set up RLS policy (adjust as needed)
CREATE POLICY "Allow authenticated users to read exports"
ON storage.objects FOR SELECT
USING (bucket_id = 'exports' AND auth.role() = 'authenticated');
```

## Usage

The function accepts POST requests with the following body:

```json
{
  "html": "<html>...</html>",
  "format": "pdf" | "docx",
  "metadata": {
    "title": "Document Title",
    "stand": "STAND 12/22",
    "documentId": "uuid-optional"
  },
  "cacheKey": "optional-cache-key"
}
```

### Response

- **Success**: Returns the file as a blob with appropriate Content-Type
- **Error**: Returns JSON with error message and `fallback: true` to trigger client-side export

### Headers

- `Authorization: Bearer <token>` - User's auth token or anon key
- `apikey: <anon-key>` - Supabase anon key

## Caching

Caching is automatically enabled if:
1. A `cacheKey` is provided
2. `SUPABASE_SERVICE_ROLE_KEY` is available (Pro plan)

Cache TTL: 1 hour (3600 seconds)

## How It Works

### PDF Export

1. Frontend sends HTML to Edge Function
2. Edge Function forwards HTML to Gotenberg
3. Gotenberg renders HTML with Chromium and returns PDF
4. Edge Function caches PDF (optional) and returns to frontend

### Word Export

1. Frontend sends HTML to Edge Function
2. Edge Function parses HTML to find `.a4-page` elements
3. For each page, requests screenshot from Gotenberg
4. Screenshots are assembled into Word document using `docx` library
5. Edge Function caches DOCX (optional) and returns to frontend

## Dependencies

- `docx@9.5.1` - Word document generation
- Gotenberg (external service) - HTML to PDF/Screenshot conversion

## Gotenberg API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/forms/chromium/convert/html` | HTML → PDF conversion |
| `/forms/chromium/screenshot/html` | HTML → PNG screenshot |
| `/health` | Health check |

## Limits

- **Free Plan**: 10 second timeout, no caching
- **Pro Plan**: 60 second timeout, caching enabled
- **Gotenberg**: No inherent limits, depends on Railway plan

## Costs

| Service | Cost |
|---------|------|
| Supabase Edge Functions | Included in plan |
| Railway (Gotenberg) | ~$5-10/month |

## Troubleshooting

### Gotenberg Not Reachable

If Gotenberg is not reachable:
1. Check Railway dashboard for service status
2. Verify `GOTENBERG_URL` is set correctly in Supabase Secrets
3. Check if Railway URL has changed
4. Client-side fallback will be used automatically

### Timeout Errors

If you get timeout errors:
1. Reduce document complexity
2. Check Gotenberg health endpoint
3. Use client-side export as fallback

### PDF Rendering Issues

If PDFs don't render correctly:
1. Ensure all CSS is inline in HTML
2. Fonts should be loaded via Google Fonts
3. Check Gotenberg logs on Railway

### Word Export Quality

For best Word export quality:
1. Each page should have `.a4-page` class
2. Pages should be 794×1123 pixels
3. Screenshots are taken at 100% quality
