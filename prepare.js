require('dotenv').config()
const { subject, html, insertVariables } = require("./template");
const { supabase } = require("./api");
const getTargets = require("./targets").getTargets;
const argv = require("minimist")(process.argv.slice(2), {
  boolean: ["help","dry-run"],
  default: {"template":"default"}
});


const help = () => {
  console.log(
    [
      "--help (this command)",
      "--template (template folder in config/email/digest/campaigName), by default default.xx.html",
      "--source (source file in config/targets/source/)",
      "--lang (default language if not specified in source)",
      "--dry-run",
      "{campaign_name}",
    ].join("\n")
  );
  process.exit(0);
};

const campaign = argv._[0];

if (argv.help || !campaign) return help();

if (!argv.source) argv.source = campaign;
let templateName = argv["template"] || "default"; // TODO: for each target, check if the target has received an email, "initial", otherwise, "default"
const sourceName = argv["source"];

const targets = getTargets(sourceName);
console.log("targetting ", targets.length, " from ", sourceName);

const main = async () => {
  for (const i in targets) {
    const target = targets[i];
    // todo: if template not set, supabase.select email,target_id from digests where campaign=campaign and status='sent' group by email
    // if in that list -> template= default, else -> initial
    if (!target.lang && argv.lang) {
      console.warn("no language for ", target.email);
    }
    const lang = target.lang || argv.lang;
    const s = subject(campaign, templateName, target.lang)
    const h = html(campaign, templateName, target.lang)
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
    insertVariables(h, variables = "");

    const { data, error } = await supabase
      .from('digest')
      .insert([
        { subject: s, body: h, status: "pending", template: templateName, email: target.email, target_id: target.externalId || target.email, campaign: campaign, variables: {} }// , template: `${campaign}/${name}` },
      ])

    if (error) console.log('error saving template', error)
  }
process.exit(1);

  }

main().catch(console.error);
