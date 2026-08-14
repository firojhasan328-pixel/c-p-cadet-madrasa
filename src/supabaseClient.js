import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wgkcedpinnhvpouivdqg.supabase.co'
const supabaseKey = 'sb_publishable_HdeR6W6GD_uQCRRsTV7PjQ_561TVCCr'

export const supabase = createClient(supabaseUrl, supabaseKey)
