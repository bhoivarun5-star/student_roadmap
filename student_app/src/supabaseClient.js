import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mmzshrvagdatbbmqjwis.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_DTWHEsG8BZiegXvPrWAvEQ_GzJxLLJu'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

