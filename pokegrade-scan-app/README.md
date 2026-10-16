# PokeGrade scan-only app

This package contains all three working layers:
1. Browser scan UI with automatic image compression.
2. Secure Vercel/Next.js `/api/scan-card` endpoint using OpenAI image analysis.
3. PkmnPrices catalogue matching and raw/graded pricing.

## Run locally
1. Copy `.env.example` to `.env.local`.
2. Add `OPENAI_API_KEY` and `PKMNPRICES_API_KEY`.
3. Run `npm install` and `npm run dev`.

## Deploy to Vercel
Import this folder/repository into Vercel. Add the same environment variables in Project Settings > Environment Variables, then deploy.

## Existing GitHub Pages site
GitHub Pages cannot run the server endpoint. Deploy this project to Vercel and link to it from the existing site, or set a full Vercel endpoint URL in the frontend and add strict CORS controls.

## Security notes
- Secrets are read only from server environment variables.
- The production endpoint rejects unsupported formats and processed images above 2 MB each.
- The browser compresses camera photos before upload to remain below Vercel's request-body limit.
- Add authentication, rate limiting, bot protection, and request logging before a public launch.
- Visual grades are estimates only.
