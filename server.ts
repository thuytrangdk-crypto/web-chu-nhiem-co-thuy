import 'dotenv/config';
import express from 'express';
import { createServer } from 'vite';
import app from './backend/app.js';

async function main() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => res.sendFile('index.html', { root: 'dist' }));
  }
  app.listen(Number(process.env.PORT || 3000), '0.0.0.0');
}
main().catch(console.error);
