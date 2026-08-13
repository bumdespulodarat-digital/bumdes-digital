import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
supabase.from('transaction_details').select('qty, items(name)').then(r => console.log(JSON.stringify(r.data, null, 2))).catch(console.error);
