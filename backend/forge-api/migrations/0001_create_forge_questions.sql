CREATE TABLE forge_questions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  question TEXT NOT NULL,
  topic TEXT,
  country_relevance TEXT,
  email TEXT,
  notify_answer INTEGER NOT NULL DEFAULT 0 CHECK (notify_answer IN (0, 1)),
  newsletter_consent INTEGER NOT NULL DEFAULT 0 CHECK (newsletter_consent IN (0, 1)),
  source_page TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  answer_url TEXT,
  editorial_notes TEXT
);
CREATE INDEX idx_forge_questions_created_at ON forge_questions(created_at);
CREATE INDEX idx_forge_questions_topic ON forge_questions(topic);
CREATE INDEX idx_forge_questions_country ON forge_questions(country_relevance);
CREATE INDEX idx_forge_questions_status ON forge_questions(status);
