import { supabase as novacabSupabase } from "../../supabaseClient";
export const supabase = novacabSupabase;
export const supabaseReady = Boolean(supabase);
