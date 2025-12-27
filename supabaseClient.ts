import { createClient } from '@supabase/supabase-js';

// ၁။ NEXT_PUBLIC_ လို့ ပြောင်းလိုက်ပါပြီ (ဒါမှ Vercel က Key နဲ့ ကိုက်မှာပါ)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ၂။ createClient ကို တိုက်ရိုက်ပြန်ပေးလိုက်ပါ (Null check ဖြုတ်လိုက်ပါပြီ)
export const supabase = createClient(supabaseUrl, supabaseKey);
