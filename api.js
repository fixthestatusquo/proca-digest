const { createClient } = require("@supabase/supabase-js");

const supaUrl = process.env.REACT_APP_SUPABASE_URL;
const supaAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supaAdminKey = process.env.SUPABASE_SECRET_KEY;


const supabase = createClient(supaUrl, supaAdminKey);

const getDigests = async ( campaign, status = "pending") => {
  const { data, error } = await supabase
  .from('digest')
  .select("*")
  .eq('status',status) 
  .eq('campaign',campaign)
  if (error)
    throw error;

  return data;
}

const getTargets = async ( campaign, status = "pending") => {
  const { data, error } = await supabase
  .from('digest_targets')
  .select("*")
  .eq('status',status) 
  .eq('campaign',campaign)
  if (error)
    throw error;

  return data;
}

module.exports = { supabase, getTargets, getDigests };
