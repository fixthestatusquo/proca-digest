require("dotenv").config();
const { subject, html, insertVariables } = require("./template");
const { supabase } = require("./api");
const getTargets = require("./targets").getTargets;
const color = require("cli-color");
const argv = require("minimist")(process.argv.slice(2), {
  boolean: ["help", "dry-run"],
  default: { template: "default" },
});

const help = () => {
  console.log(
    [
      "--help (this command)",
      "--template (template folder in config/email/digest/campaigName), by default default.xx.html",
      "--source (source file in config/targets/source/)",
      "--dry-run",
      "{campaign_name}",
    ].join("\n")
  );
  process.exit(0);
};

const createdAt = new Date();
const  dateFormat = date => {
  const utc = 'getUTC';// 'get'?
  return "%Y-%m-%d %H:%M:%S".replace (/%[YmdHMS]/g, function (m) {
    switch (m) {
    case '%Y': return date[utc + 'FullYear'] (); // no leading zeros required
    case '%m': m = 1 + date[utc + 'Month'] (); break;
    case '%d': m = date[utc + 'Date'] (); break;
    case '%H': m = date[utc + 'Hours'] (); break;
    case '%M': m = date[utc + 'Minutes'] (); break;
    case '%S': m = date[utc + 'Seconds'] (); break;
    default: return m.slice (1); // unknown code, remove %
    }
    // add leading zero if required
    return ('0' + m).slice (-2);
  }) + "+00";
}

const campaign = argv._[0];

if (argv.help || !campaign) return help();
if (!argv.source) argv.source = campaign;
let templateName = argv["template"] || "default"; // TODO: for each target, check if the target has received an email, "initial", otherwise, "default"
const sourceName = argv["source"];

const targets = getTargets(sourceName);
console.log("targetting ", targets.length, " from ", sourceName);
console.log(
  color.green("timestamp of the digest", createdAt, dateFormat(createdAt))
);

const prepare = async (target, templateName, campaign) => {
  if (!target.lang && argv.lang) {
    console.warn("no language for ", target.email);
  }
  const lang = target.lang || argv.lang;
  const s = subject(campaign, templateName, target.lang);
  const h = html(campaign, templateName, target.lang);
  if (!s) {
    console.error("Subject not found:", target);
    throw new Error("Subject not found:", target);
  }
  if (!h) {
    console.error("HTML not found:", target);
    throw new Error("HTML not found:", target);
  }
  // fetch variables
  // insert variables in template
  insertVariables(h, (variables = ""));
  console.log("lang", lang);

  const { data, error } = await supabase.from("digest").insert([
    {
      created_at: createdAt,
      subject: s,
      body: h,
      status: "pending",
      template: templateName,
      email: target.email,
      target_id: target.externalId || target.email,
      variables: {},
    }, // , template: `${campaign}/${name}` },
  ]);

  if (error) {
    console.log("error saving template", error);
    return error;
  }
  console.log(data);
};

const main = async () => {
  for (const i in targets) {
    const target = targets[i];
    // todo: if template not set, supabase.select email,target_id from digests where campaign=campaign and status='sent' group by email
    // if in that list -> template= default, else -> initial
    await prepare(targets[i], templateName, campaign);

    process.exit(1);
  }
};

main().catch(console.error);
