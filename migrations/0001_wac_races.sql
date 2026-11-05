CREATE TABLE IF NOT EXISTS runners (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS race_responses (
  race_id TEXT NOT NULL,
  runner_id INTEGER NOT NULL REFERENCES runners(id),
  status TEXT NOT NULL CHECK(status IN ('yes','maybe','cant')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (race_id, runner_id)
);
CREATE TABLE IF NOT EXISTS personal_races (
  id TEXT PRIMARY KEY,
  runner_id INTEGER NOT NULL REFERENCES runners(id),
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 80),
  date TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_personal_races_runner_date ON personal_races(runner_id,date);
