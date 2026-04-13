import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ynsaoxhfkomensnyrvhv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inluc2FveGhma29tZW5zbnlydmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNzg2ODcsImV4cCI6MjA5MTY1NDY4N30.umxrAzadz86sMcCE0WdKFkDAifZ4QeR3PcLOz8K5eL4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
