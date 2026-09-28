import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3000;

app.use(express.json());

// Serve static assets from public folder directly (3D models, draco wasm decoders, audio)
app.use(express.static(path.resolve(__dirname, 'public')));

// In-memory Leaderboard with realistic global entries
interface LeaderboardRecord {
  id: string;
  playerName: string;
  trackId: string;
  lapTimeMs: number;
  carModel: string;
  topSpeedKmh: number;
  driftScore: number;
  date: string;
  tier: string;
}

let leaderboardRecords: LeaderboardRecord[] = [
  {
    id: 'lb-1',
    playerName: 'GhostRider_X',
    trackId: 'cyber_neon',
    lapTimeMs: 41250,
    carModel: 'Ferrari SF90',
    topSpeedKmh: 340,
    driftScore: 14850,
    date: '2026-09-26',
    tier: '传奇车神'
  },
  {
    id: 'lb-2',
    playerName: 'TokyoDrifter_99',
    trackId: 'cyber_neon',
    lapTimeMs: 42100,
    carModel: 'Pagani Zonda',
    topSpeedKmh: 348,
    driftScore: 18200,
    date: '2026-09-25',
    tier: '传奇车神'
  },
  {
    id: 'lb-3',
    playerName: 'SpeedDemon',
    trackId: 'cyber_neon',
    lapTimeMs: 43450,
    carModel: 'Xiaomi SU7 Ultra',
    topSpeedKmh: 355,
    driftScore: 11200,
    date: '2026-09-24',
    tier: '宗师'
  },
  {
    id: 'lb-4',
    playerName: 'CanyonKing',
    trackId: 'red_rock',
    lapTimeMs: 48920,
    carModel: 'Lamborghini Urus',
    topSpeedKmh: 342,
    driftScore: 16400,
    date: '2026-09-26',
    tier: '传奇车神'
  },
  {
    id: 'lb-5',
    playerName: 'HyperApollo',
    trackId: 'red_rock',
    lapTimeMs: 49800,
    carModel: 'Apollo IE',
    topSpeedKmh: 358,
    driftScore: 12500,
    date: '2026-09-25',
    tier: '宗师'
  },
];

app.get('/api/leaderboard', (req: Request, res: Response) => {
  const trackId = (req.query.trackId as string) || 'cyber_neon';
  const filtered = leaderboardRecords
    .filter((r) => r.trackId === trackId)
    .sort((a, b) => a.lapTimeMs - b.lapTimeMs);
  res.json(filtered);
});

app.post('/api/leaderboard', (req: Request, res: Response) => {
  const { playerName, trackId, lapTimeMs, carModel, topSpeedKmh, driftScore } = req.body;
  if (!playerName || !lapTimeMs || !trackId) {
    res.status(400).json({ error: 'Missing required race records fields' });
    return;
  }

  const newRecord: LeaderboardRecord = {
    id: `lb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    playerName: playerName.slice(0, 16),
    trackId,
    lapTimeMs: Number(lapTimeMs),
    carModel: carModel || 'Ferrari SF90',
    topSpeedKmh: Math.round(Number(topSpeedKmh) || 280),
    driftScore: Math.round(Number(driftScore) || 0),
    date: new Date().toISOString().split('T')[0],
    tier: lapTimeMs < 45000 ? '传奇车神' : lapTimeMs < 55000 ? '宗师' : '大师',
  };

  leaderboardRecords.push(newRecord);
  res.json({ success: true, record: newRecord });
});

// WebSocket Multiplayer Rooms
wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (_data: string) => {
    // Room logic ping/pong
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Apex Drift Server running on http://localhost:${PORT}`);
  });
}

startServer();
