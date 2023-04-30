const fs = require("fs");
require("dotenv").config();
const {
  subject,
  html,
  getTokens,
  insertVariables,
  getLetter,
  getBackup,
} = require("./template");
const { supabase, getDigests, getTopPics, getTopComments } = require("./api");
const { getTargets, filter } = require("./targets");
const color = require("cli-color");
const countries = require("i18n-iso-countries");
const { preview } = require("./mailer");
const { getStats } = require("./server");
let csv = "name,email,saluation,gender,language,area,external_id";

const argv = require("minimist")(process.argv.slice(2), {
  boolean: ["help", "dry-run", "verbose", "csv"],
  default: { template: "default", csv: true },
});

const writeCsv = () => {
  const filename = "/tmp/" + dateFormat(createdAt) + ".csv";
  fs.writeFileSync(filename, csv);
  console.log(color.green("saved", filename));
};

const help = () => {
  console.log(
    [
      "--help (this command)",
      "--template (template folder in config/email/digest/campaigName), by default default.xx.html",
      "--source (source file in config/targets/source/)",
      "--lang (default language if not specified in source)",
      "--force process even if there are already pending digests waiting to be sent",
      "--dry-run",
      "--verbose",
      "--csv|no-csv generate a csv with the targets + some variables",
      "--preview (genereate a link to etheral.mail with a preview of the message)",
      "--target= email@example.org or number of targets to process",
      "--backup template to use if no tops or something else is missing",
      "{campaign_name}",
    ].join("\n")
  );
  process.exit(0);
};

const createdAt = new Date();

const dateFormat = (date) => {
  const utc = "getUTC"; // 'get'?
  return (
    "%Y%m%d_%H%M%S".replace(/%[YmdHMS]/g, function (m) {
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
    })
  );
};

const campaign = argv._[0];

if (argv.help || !campaign) return help();
if (!argv.source) argv.source = campaign;
let templateName = argv["template"]; // TODO: for each target, check if the target has received an email, "initial", otherwise, "default"
const sourceName = argv["source"];
const backup = argv["backup"];

console.log(
  color.green("timestamp of the digest", dateFormat(createdAt)),
  createdAt.toString()
);
let targets = getTargets(sourceName);
console.log("targetting ", targets.length, " from ", sourceName);

const prepare = async (target, templateName, campaign, data) => {
  if (!target.locale && target.field.lang && argv.lang) {
    console.warn("no language for ", target.email);
  }
  const locale = argv.locale || target.locale || target.field.lang;
  let variables = {
    target: { ...target.field, ...target },
    country: {
      code: target.area,
      name: countries.getName(target.area, locale) || "",
      total: data.country[target.area],
    },
    total: data.total,
    campaign: { letter: getLetter(campaign, locale) },
    top: {
      pictures: await getTopPics(campaign, target.area),
      comments: await getTopComments(campaign, target.area),
    },
  };
  delete variables.target.email;
  delete variables.target.externalId;
  delete variables.target.field;

  let s;
  let template;

  if ((variables.top.comments === "" || variables.top.pictures === "") && backup) {
    s = getBackup(`${campaign}/${templateName}/${backup}.json`);
    template = getBackup(`${campaign}/${templateName}/${backup}.html`);
    variables.top.comments = await getTopComments(campaign);
    variables.top.pictures = await getTopPics(campaign);
  } else {
    s = subject(campaign, templateName, locale);
    template = html(campaign, templateName, locale);
  }

  const tokens = getTokens(template);
  if (argv.verbose) console.log("We need variables for each of these", tokens);
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

  if (argv.verbose) console.log(target.email, locale, templateName, s);

  const info = {
    created_at: createdAt,
    subject: s,
    body: body,
    status: "pending",
    template: templateName,
    campaign: campaign,
    email: target.email,
    target_id: target.externalId || target.email,
    variables: variables,
  };
  // DON'T SAVE TO SUPABASE IF THERE IS NO TOP 3??
  if (variables.top.pictures === "" || variables.top.comments === "") {
    console.warn(
      color.red(
        "->skipping ",target.name
      ),target.area,data.country[target.area],"supporters"
    );
    return info;
  }
  if (argv["dry-run"]) return info;

  const { error } = await supabase.from("digest").insert([info]);

  if (error) {
    console.error(color.red("error saving template"), error);
    throw error;
  }
  return info;
};

const main = async () => {
  const pending = await getDigests(campaign, "pending");
  const stats = await getStats(campaign);
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
  targets = filter(targets, argv.target);

  if (argv.preview) {
    csv + ",preview";
  }
  for (const i in targets) {
    const target = targets[i];
    // todo: if template not set, supabase.select email,target_id from digests where campaign=campaign and status='sent' group by email
    // if in that list -> template= default, else -> initial
    const r = await prepare(target, templateName, campaign, stats);

    csv += `\n${target.name},${target.email},${target.salutation},${target.field.gender},${target.locale},${target.area},${target.externalId}`;
    if (argv.preview) {
      const b = insertVariables(r.body, r.variables);
      const info = await preview(r.email, r.subject, b);
      console.log(color.green(info.url));
      csv +=','+info.url;
    }
  }
  writeCsv();
};

main().catch(console.error);
