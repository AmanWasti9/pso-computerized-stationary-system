-- Add DELETE policy for stock_history table
CREATE POLICY "Authenticated users can delete stock history" ON public.stock_history
  FOR DELETE USING (auth.role() = 'authenticated');