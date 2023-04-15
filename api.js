const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const supaUrl = process.env.REACT_APP_SUPABASE_URL;
const supaAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supaAdminKey = process.env.SUPABASE_SECRET_KEY;


const supabase = createClient(supaUrl, supaAdminKey);

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

const getTopPics = async (campaign, area) => {
  console.log("getting top pics for ", campaign, area)

  const { data, error } = await supabase
    .from('pictures')
    .select("*")
    .eq("campaign", campaign)
    .ilike("area", area)
    .is("star", true)
    .limit(3)



// let { data: pictures, error } = await supabase
// .from('pictures')
// .select("*")

// // Filters
// .eq('column', 'Equal to')
// .gt('column', 'Greater than')
// .lt('column', 'Less than')
// .gte('column', 'Greater than or equal to')
// .lte('column', 'Less than or equal to')
// .like('column', '%CaseSensitive%')
// .ilike('column', '%CaseInsensitive%')
// .is('column', null)
// .in('column', ['Array', 'Values'])
// .neq('column', 'Not equal to')

// // Arrays
// .cs('array_column', ['array', 'contains'])
// .cd('array_column', ['contained', 'by'])






  if (error) console.log("error getting top pics", error)

  if (data.length < 3) {
    console.log("no top pics for ", campaign, area);
    return "";
  }

  let topPics = "";

  data.map((pic) => {
    console.log("pic", pic)
    topPics += `<p>${pic.legend}</p><img src="${pic.hash}" alt="${pic.id}" />`
  });
  return topPics;
}

module.exports = { supabase, getTargets, getTopPics };
