import express from 'express';
import helmet from 'helmet';
import type {Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import  authRouter  from './auth.js';
import  taskRouter  from './tasks.js';

dotenv.config();

const app : Express = express();

// --- DB CONNECTION ---
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  connectionTimeoutMillis: 5000,
});

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

// --- ROUTES ---

// 1. Root Route (Fixes the error when visiting the main URL)
app.get('/', (req, res) => {
  res.json({
    message: 'Hardened Task API is Online',
    documentation: '/README.md',
    health: '/health'
  });
});

// 2. Health Check
app.get('/health', async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    res.status(200).json({ status: 'healthy', database: 'connected' });
  } catch (err: any) {
    res.status(503).json({ status: 'unhealthy', error: err.message });
  }
});

app.use('/auth', authRouter);
app.use('/api/tasks', taskRouter);

// --- ERROR HANDLER ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('--- PRODUCTION ERROR ---');
  console.error(err.message);
  
  res.status(err.status || 500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

export default app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(process.env.PORT || 3000);
}