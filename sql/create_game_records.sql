CREATE TABLE IF NOT EXISTS game_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  game_type TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  plates_earned INTEGER NOT NULL DEFAULT 0,
  plates_spent INTEGER NOT NULL DEFAULT 0,
  result TEXT NOT NULL CHECK(result IN ('win', 'loss', 'draw')),
  metadata TEXT,
  played_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT,
  hlc TEXT NOT NULL,
  last_modified_by_device_id TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS game_records_user_idx ON game_records(user_id);
CREATE INDEX IF NOT EXISTS game_records_game_type_idx ON game_records(game_type);
CREATE INDEX IF NOT EXISTS game_records_played_at_idx ON game_records(played_at);
CREATE INDEX IF NOT EXISTS game_records_user_game_idx ON game_records(user_id, game_type);
