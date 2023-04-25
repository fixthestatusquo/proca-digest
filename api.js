const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
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

const makeUrl = (campaign, hash) => {
  return (
    process.env.REACT_APP_SUPABASE_URL +
    "/storage/v1/object/public/picture/" +
    campaign +
    "/" +
    hash +
    ".jpg"
  );
};

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

  if (error) console.log("error getting top pics", error)

  if (data.length < 3) {
    console.log("no top pics for ", campaign, area);
    return "";
  }

  let topPics = "";

  data.map((pic) => {const style = `height:${pic.height}px;width:${pic.width}px`;
    console.log("pic", style)
    console.log("pic", makeUrl(campaign, pic.hash))

    topPics += `<p>${pic.legend}</p><img src="${makeUrl(campaign, pic.hash)}" style=${style} alt="${pic.id}" />`
  });

  return topPics;
}
const getTopComments = async (campaign, area) => {
  console.log("getting top comments for ", campaign, area)

  const { data, error } = await supabase
    .from('comments')
    .select("*")
    .eq("campaign", campaign)
    .ilike("area", area)
    .is("star", true)
    .limit(3)

  if (error) console.log("error getting top comments", error)

  if (data.length < 3) {
    console.log("no top pics for ", campaign, area);
    return "";
  }

  let topComments = "";

  data.map((comment) => {
    console.log("comment", comment)
    topComments += `<p><b>${comment.name.split(",")[0]}: </b>${comment.comment}</p>`
  });
  return topComments;
}


module.exports = { supabase, getDigests, getTopPics, getTopComments, getTargets };
