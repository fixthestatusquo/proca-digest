const fs = require("fs");
require("dotenv").config();
const {
  subject,
  html,
  getTokens,
  insertVariables,
  getLetter,
  getFallback,
  getSender,
} = require("./template");
const {
  supabase,
  getDigests,
  getTopPics,
  getTopComments,
  getLastCount,
} = require("./api");
const { getTargets, filter } = require("./targets");
const color = require("cli-color");
const countries = require("i18n-iso-countries");
const { preview, initPreview } = require("./mailer");
const { getStats } = require("./server");
let csv = "name,email,saluation,gender,language,area,external_id";

const argv = require("minimist")(process.argv.slice(2), {
  boolean: ["help", "dry-run", "verbose", "csv"],
  string: ["file", "lang", "template", "fallback", "preview"],
  //  unknown: (param) => {param[0] === '-' ? console.error("invalid parameter",param) || process.exit(1) : true},
  default: { template: "default", csv: true, min: 0 },
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
      "--template (template folder in config/email/digest/campaign_mame), by default default.xx.html",
      "--file (source file in config/targets/digest/), by default campaign_name.json",
      "--lang (default language if not specified in source)",
      "--force process even if there are already pending digests waiting to be sent",
      "--min skip the sending if supporter counts below min -or use fallback template",
      "--fallback template to use if no tops or something else is missing or below min",
      "--dry-run",
      "--verbose",
      "--csv|no-csv generate a csv with the targets + some variables",
      "--preview ( 'etherhal' or 'mailhog')",
      "--target= email@example.org or number of targets to process",
      "{campaign_name}",
    ].join("\n")
  );
  process.exit(0);
};

const createdAt = new Date();

const dateFormat = (date) => {
  const utc = "getUTC"; // 'get'?
  return "%Y%m%d_%H%M%S".replace(/%[YmdHMS]/g, function (m) {
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
  });
};

const campaign = argv._[0];

if (argv.help || !campaign) return help();
if (!argv.file) argv.file = campaign;
let templateName = argv["template"]; // TODO: for each target, check if the target has received an email, "initial", otherwise, "default"
const sourceName = argv["file"]; 
const fallback = argv["fallback"] === "" ? "fallback" : argv["fallback"];
console.log(
  color.green("timestamp of the digest", dateFormat(createdAt)),
  createdAt.toString()
);
let targets = getTargets(sourceName, campaign);
if (targets.length === 0) {
  console.error(color.red("no targets found", argv.file));
  process.exit(1);
}
console.log("targetting", targets.length, "from", sourceName);
const sender = getSender(campaign);

const prepare = async (target, templateName, campaign, data, last) => {
  if (!target.locale && target.lang && argv.lang) {
    console.warn("no language for", target.name, target.email);
  }

  if (!fallback && data.country[target.area] < argv.min) {
    console.warn(
      color.yellow("skipping", target.name),
      target.area,
      "has only",
      data.country[target.area],
      "supporters"
    );
    return;
  }
  const locale = argv.locale || target.locale;
  const pics = await getTopPics(campaign, target.area);
  const comments = await getTopComments(campaign, target.area);
  let variables = {
    target: { ...target },
    country: {
      code: target.area,
      name: countries.getName(target.area, locale) || "",
      total: data.country[target.area],
    },
    total: data.total,
    campaign: {
      letter: getLetter(campaign, locale),
      period: {
        total: data.total - last.lastTotal,
        country: data.country[target.area] - last.lastCountryTotal,
      },
    },
    top: {
      pictures: pics.html,
      comments: comments.html,
    },
  };
  variables.comments = comments.data;
  variables.pictures = pics.data;
  delete variables.target.email;
  delete variables.target.externalId;
  delete variables.target.field;
  let s;
  let template;

  if (
    (data.country[target.area] < argv.min ||
      !variables.comments ||
      !variables.pictures === 0) &&
    fallback
  ) {
    console.warn(
      color.yellow("fallback for", target.name),
      "from",
      target.area,
      data.country[target.area],
      "supporters"
    );
    const fallbackSubject = subject(campaign, fallback, locale);

    if (fallbackSubject) {
      s = fallbackSubject;
    } else {
      s = subject(campaign, templateName, locale);
    }
    template = html(campaign, fallback, locale);
    const pics = await getTopPics(campaign);
    const comments = await getTopComments(campaign);
    variables.top.comments = comments.html;
    variables.top.pictures = pics.html;
    variables.comments = comments.data;
    variables.pictures = pics.data;
  } else {
    s = subject(campaign, templateName, locale);
    template = html(campaign, templateName, locale);
  }

  const tokens = getTokens(template);
  if (argv.verbose) console.log("We need variables for each of these", tokens);
  if (!s) {
    console.error(color.red("Subject not found:", target.name));
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

  delete variables.top;
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

  if (argv["dry-run"]) return info;

  const { error } = await supabase.from("digest").insert([info]);

  if (error) {
    console.error(color.red("error saving digest"), error, target);
    throw error;
  }
  return info;
};

const main = async () => {
  const pending = await getDigests(campaign, "pending");
  const stats = await getStats(campaign);
  if (pending.length > 0) {
    console.log("targetted already", pending.length, "from", sourceName);
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
  if (argv.preview !== undefined) {
    await initPreview(argv.preview);
    csv + ",preview";
  }

  for (const i in targets) {
    const target = targets[i];
    // todo: if template not set, supabase.select email,target_id from digests where campaign=campaign and status='sent' group by email
    // if in that list -> template= default, else -> initial
    csv += `\n${target.name},${target.email},${target.salutation},${target.gender},${target.locale},${target.area},${target.externalId}`;
    const last =
      templateName === "initial"
        ? { lastTotal: 0, lastCountryTotal: 0 }
        : await getLastCount(campaign, target.email);

    const r = await prepare(
      { ...targets[i] },
      templateName,
      campaign,
      stats,
      last
    );
    if (argv.preview && r) {
      const b = insertVariables(r.body, r.variables);
      if (argv.preview !== undefined) {
        const info = await preview(r.email, r.subject, b, sender);
        info.url && console.log(color.green(info.url));
        csv += "," + info.url;
      }
    }
  }
  writeCsv();
};

main().catch(console.error);
