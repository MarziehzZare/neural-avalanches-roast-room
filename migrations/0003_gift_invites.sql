ALTER TABLE wallets ADD COLUMN invite_access INTEGER NOT NULL DEFAULT 0 CHECK (invite_access IN (0, 1));

CREATE TABLE IF NOT EXISTS gift_invites (
  token_hash TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits BETWEEN 1 AND 100),
  claimed_wallet_id TEXT REFERENCES wallets(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  claimed_at TEXT
);

CREATE TRIGGER IF NOT EXISTS grant_gift_credits
AFTER UPDATE OF claimed_wallet_id ON gift_invites
WHEN OLD.claimed_wallet_id IS NULL AND NEW.claimed_wallet_id IS NOT NULL
BEGIN
  UPDATE wallets SET credits = credits + NEW.credits, invite_access = 1 WHERE id = NEW.claimed_wallet_id;
END;
