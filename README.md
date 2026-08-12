# Kinetic Typography

Upload a song and explore how AI interprets it as kinetic typography. Audio is analyzed in the browser, an LLM suggests typography and motion, and you refine the result before exporting it as a video.

## How it works

1. **Upload audio** — Your file is analyzed for musical features (tempo, energy, mood, and more).
2. **AI interpretation** — Gemini generates a creative direction for typography, color, layout, and motion.
3. **Edit** — Adjust the design to match how you want the typography to feel.
4. **Export** — Download the animation as a video.

## Tech stack

- **Frontend:** React, TypeScript, Vite
- **AI:** Google Gemini (`gemini-2.5-flash`)
- **Audio:** Web Audio API (client-side analysis)
- **Export:** Client-side video encoding

## Local development

### Prerequisites

- Node.js 18+ (Node 20 recommended)

### Setup

```bash
git clone <your-repo-url>
cd kinetic-typography
npm install
```

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_google_ai_key_here
VITE_USE_GEMINI_CREATIVE_DIRECTION=true
VITE_SKIP_CREATIVE_DIRECTION_CACHE=true
```

Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey).

### Run

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

This project is set up for [Vercel](https://vercel.com) with a serverless API route at `/api/creative-direction`.

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. Add these environment variables in the Vercel dashboard:

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Your Google AI API key (server only) |
| `VITE_USE_GEMINI_CREATIVE_DIRECTION` | Set to `true` to enable LLM interpretation |
| `RATE_LIMIT_MAX` | Optional. Max API requests per IP (default: `5`) |
| `RATE_LIMIT_WINDOW_MS` | Optional. Rate limit window in ms (default: `3600000` = 1 hour) |

**Do not commit `.env.local`** — it is already in `.gitignore`.

## Notes

- LLM requests use your Google AI free-tier quota. Rate limiting helps protect against abuse on the public API.
- Without `VITE_USE_GEMINI_CREATIVE_DIRECTION=true`, the app falls back to a deterministic design brief (no Gemini calls).
