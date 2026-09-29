/**
 * PostgreSQL Database Connection
 * 
 * Connects to the existing QOR Auth PostgreSQL instance
 * for VYB social features (chat, profiles, messages).
 */

import { Pool, type PoolConfig } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://qor_auth:password@localhost:5432/qor_auth';

const poolConfig: PoolConfig = {
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Singleton pool
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(poolConfig);
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }
  return pool;
}

/**
 * Execute a single query
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

/**
 * Execute a query and return a single row
 */
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

/**
 * Execute an insert/update and return the affected row
 */
export async function execute<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

/**
 * Run multiple statements in a transaction
 */
export async function transaction<T>(fn: (client: any) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Initialize VYB database schema
 * Creates tables if they don't exist
 */
export async function initializeVYBSchema(): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query(`
      -- VYB Profiles
      CREATE TABLE IF NOT EXISTS vyb_profiles (
        qor_id TEXT PRIMARY KEY,
        display_name TEXT,
        bio TEXT,
        avatar_url TEXT,
        banner_url TEXT,
        music_url TEXT,
        theme_json JSONB DEFAULT '{}',
        sex TEXT,
        age INTEGER,
        location TEXT,
        social_links JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- VYB Chat Rooms
      CREATE TABLE IF NOT EXISTS vyb_rooms (
        id TEXT PRIMARY KEY DEFAULT 'room_' || gen_random_uuid()::text,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        type TEXT NOT NULL DEFAULT 'public' CHECK (type IN ('global', 'public', 'private')),
        password_hash TEXT,
        creator_qor_id TEXT,
        max_members INTEGER DEFAULT 200,
        is_permanent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- VYB Room Members
      CREATE TABLE IF NOT EXISTS vyb_room_members (
        room_id TEXT NOT NULL REFERENCES vyb_rooms(id) ON DELETE CASCADE,
        qor_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
        is_muted BOOLEAN DEFAULT FALSE,
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        last_read_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (room_id, qor_id)
      );

      -- VYB Room Messages
      CREATE TABLE IF NOT EXISTS vyb_messages (
        id TEXT PRIMARY KEY DEFAULT 'msg_' || gen_random_uuid()::text,
        room_id TEXT NOT NULL REFERENCES vyb_rooms(id) ON DELETE CASCADE,
        sender_qor_id TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'media', 'system', 'tip')),
        metadata JSONB DEFAULT '{}',
        reply_to_id TEXT REFERENCES vyb_messages(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        edited_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ
      );

      -- VYB Direct Messages
      CREATE TABLE IF NOT EXISTS vyb_direct_messages (
        id TEXT PRIMARY KEY DEFAULT 'dm_' || gen_random_uuid()::text,
        sender_qor_id TEXT NOT NULL,
        receiver_qor_id TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'media', 'tip')),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        read_at TIMESTAMPTZ
      );

      -- VYB Posts (feed)
      CREATE TABLE IF NOT EXISTS vyb_posts (
        id TEXT PRIMARY KEY DEFAULT 'post_' || gen_random_uuid()::text,
        author_qor_id TEXT NOT NULL,
        content TEXT NOT NULL,
        media JSONB DEFAULT '[]',
        visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        tips NUMERIC DEFAULT 0,
        tx_hash TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_vyb_messages_room_id ON vyb_messages(room_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_vyb_messages_sender ON vyb_messages(sender_qor_id);
      CREATE INDEX IF NOT EXISTS idx_vyb_dm_participants ON vyb_direct_messages(sender_qor_id, receiver_qor_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_vyb_dm_receiver ON vyb_direct_messages(receiver_qor_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_vyb_room_members_qor ON vyb_room_members(qor_id);
      CREATE INDEX IF NOT EXISTS idx_vyb_posts_author ON vyb_posts(author_qor_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_vyb_posts_created ON vyb_posts(created_at DESC);
    `);

    // Seed default global rooms
    await client.query(`
      INSERT INTO vyb_rooms (id, name, description, type, is_permanent, creator_qor_id)
      VALUES 
        ('room_general', 'General', 'Open discussion for the Demiurge community', 'global', TRUE, 'system'),
        ('room_help', 'Help', 'Community support and troubleshooting', 'global', TRUE, 'system'),
        ('room_trading', 'Trading', 'CGT and NFT trading discussion', 'global', TRUE, 'system'),
        ('room_developers', 'Developers', 'Builder discussion and collaboration', 'global', TRUE, 'system'),
        ('room_offtopic', 'Off-Topic', 'Casual chat and anything goes', 'global', TRUE, 'system')
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('[DB] VYB schema initialized successfully');
  } catch (error) {
    console.error('[DB] Failed to initialize VYB schema:', error);
    // Don't throw - allow app to start even if DB is unavailable
  } finally {
    client.release();
  }
}

// Initialize schema on first import in server context
if (typeof window === 'undefined') {
  initializeVYBSchema().catch(console.error);
}
