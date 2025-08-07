-- Add DELETE policy for stock_items table if it doesn't exist
-- This ensures authenticated users can delete stock items

-- First, check if the policy already exists and drop it if it does
DROP POLICY IF EXISTS "Authenticated users can delete stock items" ON public.stock_items;

-- Create the DELETE policy for stock_items
CREATE POLICY "Authenticated users can delete stock items" ON public.stock_items
  FOR DELETE USING (auth.role() = 'authenticated');

-- Verify RLS is enabled on stock_items table
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;