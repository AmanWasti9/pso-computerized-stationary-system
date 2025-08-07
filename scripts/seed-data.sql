-- Insert default stock items
INSERT INTO public.stock_items (name, quantity, description) VALUES
  ('SLS01', 126, 'Standard SLS01 items'),
  ('SLS02', 131, 'Standard SLS02 items'),
  ('SLS01 Extra', 147, 'Extra SLS01 items'),
  ('Token', 710, 'Token items'),
  ('STK01', -135, 'STK01 items'),
  ('PART I', 9, 'Part I items'),
  ('PART II', 215, 'Part II items'),
  ('PART III', -5, 'Part III items')
ON CONFLICT (name) DO NOTHING;

-- Insert sample stock history
INSERT INTO public.stock_history (item_name, quantity, type, description, date, added_by) VALUES
  ('Token', 100, 'stock_addition', 'Stock added', '2025-08-04T15:30:00.000Z', 'Admin User'),
  ('Token', 100, 'stock_addition', 'Stock added', '2025-08-04T12:10:00.000Z', 'Admin User'),
  ('Token', 100, 'stock_addition', 'Stock added', '2025-08-03T23:49:00.000Z', 'Admin User')
ON CONFLICT DO NOTHING;
