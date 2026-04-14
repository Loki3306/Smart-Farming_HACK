CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES farmers(id),
  status TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
