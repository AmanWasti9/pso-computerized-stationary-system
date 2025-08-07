-- Migration to add 'stock_dispatch' type to stock_history table
-- This script updates the CHECK constraint to include the new type

-- Drop the existing constraint
ALTER TABLE public.stock_history DROP CONSTRAINT IF EXISTS stock_history_type_check;

-- Add the new constraint with the additional type
ALTER TABLE public.stock_history ADD CONSTRAINT stock_history_type_check 
  CHECK (type IN ('new_item', 'stock_addition', 'stock_dispatch'));