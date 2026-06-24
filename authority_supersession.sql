-- authority_supersession.sql
-- Track supersession events between authority objects

CREATE TABLE IF NOT EXISTS authority_supersession (
  id UUID PRIMARY KEY,
  old_authority UUID NOT NULL,
  new_authority UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_old FOREIGN KEY(old_authority) REFERENCES authority_objects(authority_id) ON DELETE SET NULL,
  CONSTRAINT fk_new FOREIGN KEY(new_authority) REFERENCES authority_objects(authority_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_authority_supersession_old ON authority_supersession(old_authority);
CREATE INDEX IF NOT EXISTS idx_authority_supersession_new ON authority_supersession(new_authority);
