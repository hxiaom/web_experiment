import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type Db = Database.Database;

declare global {
  // eslint-disable-next-line no-var
  var __webExperimentDb: Db | undefined;
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function getDbPath(): string {
  const explicit = process.env.DB_PATH;
  if (explicit) return explicit;
  return path.join(process.cwd(), "data", "app.db");
}

function initSchema(db: Db) {
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      participant_id TEXT PRIMARY KEY,
      cond TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      participant_id TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL,
      user_agent TEXT,
      ip_hash TEXT,
      FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
    );

    CREATE TABLE IF NOT EXISTS events (
      event_id TEXT PRIMARY KEY,
      ts INTEGER NOT NULL,
      participant_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      turn_index INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      page TEXT,
      payload TEXT,
      FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
      FOREIGN KEY (session_id) REFERENCES sessions(session_id)
    );

    CREATE INDEX IF NOT EXISTS idx_events_session_ts ON events(session_id, ts);
    CREATE INDEX IF NOT EXISTS idx_events_participant_ts ON events(participant_id, ts);
    CREATE INDEX IF NOT EXISTS idx_events_type_ts ON events(event_type, ts);

    CREATE TABLE IF NOT EXISTS chat_messages (
      message_id TEXT PRIMARY KEY,
      ts INTEGER NOT NULL,
      participant_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      turn_index INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      model TEXT,
      latency_ms INTEGER,
      FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
      FOREIGN KEY (session_id) REFERENCES sessions(session_id)
    );

    CREATE INDEX IF NOT EXISTS idx_chat_session_ts ON chat_messages(session_id, ts);
  `);
}

export function getDb(): Db {
  if (globalThis.__webExperimentDb) return globalThis.__webExperimentDb;

  const dbPath = getDbPath();
  ensureDir(path.dirname(dbPath));
  const db = new Database(dbPath);
  initSchema(db);
  globalThis.__webExperimentDb = db;
  return db;
}

