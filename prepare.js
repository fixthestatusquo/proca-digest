require("dotenv").config();
const { subject, html, getTokens, insertVariables } = require("./template");
const { supabase, getDigests, getTopPics } = require("./api");
const {getTargets, filter} = require("./targets");
const color = require("cli-color");
const countries=require("i18n-iso-countries");

const argv = require("minimist")(process.argv.slice(2), {
  boolean: ["help", "dry-run", "verbose"],
  default: { template: "default" },
});

const help = () => {
  console.log(
    [
      "--help (this command)",
      "--template (template folder in config/email/digest/campaigName), by default default.xx.html",
      "--source (source file in config/targets/source/)",
      "[todo] --lang (default language if not specified in source)",
      "--force process even if there are already pending digests waiting to be sent",
      "--dry-run",
      "--verbose",
      "--target= email@example.org or number of targets to process",
      "{campaign_name}",
    ].join("\n")
  );
  process.exit(0);
};

const createdAt = new Date();

const dateFormat = (date) => {
  const utc = "getUTC"; // 'get'?
  return (
    "%Y-%m-%d %H:%M:%S".replace(/%[YmdHMS]/g, function (m) {
      switch (m) {
        case "%Y":
          return date[utc + "FullYear"](); // no leading zeros required
        case "%m":
          m = 1 + date[utc + "Month"]();
          break;
        case "%d":
          m = date[utc + "Date"]();
          break;
        case "%H":
          m = date[utc + "Hours"]();
          break;
        case "%M":
          m = date[utc + "Minutes"]();
          break;
        case "%S":
          m = date[utc + "Seconds"]();
          break;
        default:
          return m.slice(1); // unknown code, remove %
      }
      // add leading zero if required
      return ("0" + m).slice(-2);
    }) + "+00"
  );
};

const campaign = argv._[0];

if (argv.help || !campaign) return help();
if (!argv.source) argv.source = campaign;
let templateName = argv["template"]; // TODO: for each target, check if the target has received an email, "initial", otherwise, "default"
const sourceName = argv["source"];

console.log(
  color.green("timestamp of the digest", dateFormat(createdAt)),
  createdAt.toString()
);
let targets = getTargets(sourceName);
console.log("targetting ", targets.length, " from ", sourceName);


const prepare = async (target, templateName, campaign) => {
  if (!target.locale && argv.lang) {
    console.warn("no language for ", target.email);
  }
  const locale = target.locale || argv.locale;
  let variables = {target:{ ...target.field,...target },
    country: {code: target.area, name: countries.getName(target.area, locale) || ""},
    total: "MISSING",
    top: { picturess: await getTopPics(campaign, target.area), comments: "" },
  };
  delete variables.target.email;
  delete variables.target.externalId;
  delete variables.target.field;
  console.log("variables", variables)
  const s = subject(campaign, templateName, locale);
  const template = html(campaign, templateName, locale);
  const tokens = getTokens (template);
if (argv.verbose)
console.log("ivana, we need variables for each of these",tokens);
  if (!s) {
    console.error("Subject not found:", target);
    throw new Error("Subject not found:", target);
  }
  if (!template) {
    console.error("HTML not found:", target);
    throw new Error("HTML not found:", target);
  }
  // fetch variables
  // insert variables in template
  const body = insertVariables(template, variables);
//console.log(body);
  if (argv.verbose) console.log(target.email, locale, templateName, s);
  if (argv["dry-run"]) return;


  // DON'T SEND IF THERE IS NO TOP 3??
  if (variables.top.pictures === "") return; //|| variables.top.comments === ""

  const { data, error } = await supabase.from("digest").insert([
    {
      created_at: createdAt,
      subject: s,
      body: body,
      status: "pending",
      template: templateName,
      campaign: campaign,
      email: target.email,
      target_id: target.externalId || target.email,
      variables: variables,
    }, // , template: `${campaign}/${name}` },
  ]);

  if (error) {
    console.error(color.red("error saving template"), error);
    throw error;
  }
};

const main = async () => {
  const pending = await getDigests(campaign, "pending");
  if (pending.length > 0) {
    console.log("targetted already ", pending.length, " from ", sourceName);
    if (!argv.force && !argv["dry-run"]) {
      console.error(
        color.red(
          "send the prepared digests before preparing new ones or run with --force"
        )
      );
      process.exit(1);
    }
  }
  targets = filter (targets, argv.target);

  for (const i in targets) {
    const target = targets[i];
    // todo: if template not set, supabase.select email,target_id from digests where campaign=campaign and status='sent' group by email
    // if in that list -> template= default, else -> initial
    await prepare(targets[i], templateName, campaign);
  }
};

main().catch(console.error);
