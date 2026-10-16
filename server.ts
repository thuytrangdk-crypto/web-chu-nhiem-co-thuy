import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { createServer } from 'vite';
import app from './backend/app.js';

async function main() {
  // 1. Explicitly ensure all unmatched /api requests return JSON 404, NEVER falling through to Vite or SPA fallback
  app.all(/^\/api(\/.*)?$/, (req: Request, res: Response) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // 2. Vite dev server or static dist fallback for SPA frontend
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req: Request, res: Response) => res.sendFile('index.html', { root: 'dist' }));
  }

  // 3. Port parsing from argv or env
  const portArgIndex = process.argv.indexOf('--port');
  const port = portArgIndex !== -1 && process.argv[portArgIndex + 1]
    ? Number(process.argv[portArgIndex + 1])
    : Number(process.env.PORT || 3000);

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Server] GVCN Express backend + Vite preview listening on http://0.0.0.0:${port}`);
  });
}

main().catch(console.error);

