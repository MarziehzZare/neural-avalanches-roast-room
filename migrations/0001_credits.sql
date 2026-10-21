CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS paid_checkouts (
  session_id TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL REFERENCES wallets(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents = 500),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS grant_checkout_credits
AFTER INSERT ON paid_checkouts
BEGIN
  UPDATE wallets SET credits = credits + 10 WHERE id = NEW.wallet_id;
END;
