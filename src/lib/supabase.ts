import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://uooxubwuvkigfieqbksv.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvb3h1Ynd1dmtpZmdpZXFia3N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMjkzODEsImV4cCI6MjEwNjcwNTM4MX0.UoBlqBUdfDrE1nHNLaIvIzGBn41dxD7kqrZvJhuG4zo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);