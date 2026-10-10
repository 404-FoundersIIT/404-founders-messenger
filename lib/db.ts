import { Pool } from 'pg';

// Global singleton pool for Next.js API routes
declare global {
  var _pgPool: Pool | undefined;
}

const pool =
  global._pgPool ||
  new Pool({
    host: 'aws-0-ap-south-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.glrnweimiibhawobvoif',
    password: process.env.SUPABASE_DB_PASSWORD || 'DashirB10219',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== 'production') {
  global._pgPool = pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number | null }> {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return { rows: res.rows, rowCount: res.rowCount };
  } finally {
    client.release();
  }
}

export default pool;
