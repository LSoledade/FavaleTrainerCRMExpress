import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl) {
  throw new Error("Supabase URL not found. Please set SUPABASE_URL environment variable.");
}

if (!supabaseKey) {
  throw new Error("Supabase key not found. Please set SUPABASE_KEY environment variable.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
