ALTER TABLE wallets ADD COLUMN locked INTEGER NOT NULL DEFAULT 0 CHECK (locked IN (0, 1));
ALTER TABLE paid_checkouts ADD COLUMN payment_intent TEXT;
ALTER TABLE paid_checkouts ADD COLUMN reversed_at TEXT;

CREATE INDEX IF NOT EXISTS paid_checkouts_payment_intent ON paid_checkouts(payment_intent);

CREATE TRIGGER IF NOT EXISTS reverse_checkout_credits
AFTER UPDATE OF reversed_at ON paid_checkouts
WHEN OLD.reversed_at IS NULL AND NEW.reversed_at IS NOT NULL
BEGIN
  UPDATE wallets SET credits = MAX(0, credits - 10), locked = 1 WHERE id = NEW.wallet_id;
END;
