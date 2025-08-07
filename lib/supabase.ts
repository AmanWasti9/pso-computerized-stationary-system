import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://mmlrujbbhepfsvakbvaj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbHJ1amJiaGVwZnN2YWtidmFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNDI0MzcsImV4cCI6MjA2OTgxODQzN30.i29L3FtK5YG-X-jBsCKxJiTrVqXnymWUT08GiQgouHs";

// Singleton pattern for client-side Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
})()
