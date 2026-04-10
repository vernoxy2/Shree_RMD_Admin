import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yhakugpbgzosckyiaqna.supabase.co";      // ← replace
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloYWt1Z3BiZ3pvc2NreWlhcW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3OTg5NTAsImV4cCI6MjA5MTM3NDk1MH0.jNZiCuO9pz7WqSlHkVunHqCgP0Fm7pHleEJCfGwgEl0";    // ← replace

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);