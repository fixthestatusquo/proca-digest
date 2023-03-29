const { createClient } = require("@supabase/supabase-js");

const supaUrl = process.env.REACT_APP_SUPABASE_URL;
const supaAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supaAdminKey = process.env.SUPABASE_SECRET_KEY;


const supabase = createClient(supaUrl, supaAdminKey);

module.exports = { supabase };