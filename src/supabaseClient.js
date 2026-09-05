import { createClient } from "@supabase/supabase-js";

// V14: configuration injectable par environnement, avec fallback de compatibilité
// pour ne pas casser une installation existante qui n'a pas encore défini les variables Netlify.
const rawSupabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "https://ybewryneaksqhtlagvxk.supabase.co").trim();
const supabaseUrl = rawSupabaseUrl.replace(/^https:\/\/https:\/\//i, "https://");
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZXdyeW5lYWtzcWh0bGFndnhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODk2OTYsImV4cCI6MjEwMjM2NTY5Nn0.13uLZry9ivPwFZSJy7a362SSvr6U1HIl_WjkbJO93PY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
