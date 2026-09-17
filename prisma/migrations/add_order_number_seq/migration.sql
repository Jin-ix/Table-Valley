-- Create a sequence for atomic, race-condition-free order number generation.
-- The sequence starts from the current max order count so existing VT-XXXX
-- numbers are not re-used.
CREATE SEQUENCE IF NOT EXISTS order_number_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Sync the sequence to the actual current order count so the next generated
-- number continues from where the COUNT(*)-based approach left off.
SELECT setval(
  'order_number_seq',
  COALESCE((SELECT COUNT(*) FROM orders), 0),
  true
);
