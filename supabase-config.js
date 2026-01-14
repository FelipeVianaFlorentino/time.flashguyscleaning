// Configuração do Supabase
const SUPABASE_URL = 'https://zvcrdmayvxphigovbdkv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2Y3JkbWF5dnhwaGlnb3ZiZGt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjExMzQsImV4cCI6MjA4MzkzNzEzNH0.YPrHvQtuFycUKowHtfI-I73GYfFwcap_AULlye9qpiQ';

// Inicializar cliente Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

