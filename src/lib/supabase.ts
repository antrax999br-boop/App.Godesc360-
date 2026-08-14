import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hhoiexewnnbgwhgliefb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhob2lleGV3bm5iZ3doZ2xpZWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2Nzk5NDYsImV4cCI6MjEwMjI1NTk0Nn0.6-WkEJYfsD7xuD0z4-jQSxZPS5OPM3oN4WtXoVlpGFU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
