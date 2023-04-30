const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const supaUrl = process.env.REACT_APP_SUPABASE_URL;
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

// TO DO: For the next digests, check if pics/comments are already sent
// mark stars and comment if included in digests??

const getTopPics = async (campaign, area = null) => {
  //console.log("getting top pics for ", campaign, area)
const q = area ?
 supabase
  .from('pictures')
  .select("*")
  .eq("campaign", campaign)
  .ilike("area", area)
  .is("star", true)
   .limit(3)
: supabase
  .from('pictures')
  .select("*")
    .eq("campaign", campaign)
    .not('legend', 'like', '')
  .is("star", true)
    .limit(3)

  const { data, error } = await q;

  if (error) console.error("error getting top pics", error)

  if (data.length < 3) {
    console.error("no top pics for ", campaign, area);
    return "";
  }

  let topPics = "";

  data.map((pic) => {const style = `height:${pic.height}px;width:${pic.width}px`;
    topPics += `<p><b>${pic.legend}: </b></p><img src="${makeUrl(campaign, pic.hash)}" style=${style} alt="${pic.id}" />`
  });

  return topPics;
}
const getTopComments = async (campaign, area=null) => {

  const q = area
    ? supabase
    .from('comments')
    .select("*")
    .eq("campaign", campaign)
    .ilike("area", area)
    .is("star", true)
      .limit(3)
    : qEU = supabase
    .from('comments')
    .select("*")
    .eq("campaign", campaign)
    .is("star", true)
      .limit(3)

    const { data, error } = await q;

  if (error) console.log("error getting top comments", error)

  if (data.length < 3) {
    console.log("no top comments for ", campaign, area);
    return "";
  }

  let topComments = "";

  data.map((comment) => {
    topComments += `<p><b>${comment.name}: </b>${comment.comment}</p>`
  });

  return `<div style="background-color: #d3d3d3; padding: 1%">${topComments}</div>`;
}

module.exports = { supabase, getDigests, getTopPics, getTopComments };

