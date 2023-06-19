const fs = require("fs");
const path = require("path");
require("dotenv").config();
const color = require("cli-color");

const source =
  process.env.REACT_APP_TARGETS_FOLDER ||
  process.env.REACT_APP_CONFIG_FOLDER + "target/digest/";

// import from proca instead of duplicating
const languages = {
  be: ["fr", "nl"],
  gr: "el",
  el: "el",
  lt: "lt",
  pt: "pt",
  bg: "bg",
  es: "es",
  lu: ["de", "fr"],
  ro: "ro",
  cz: "cs",
  fr: "fr",
  hu: "hu",
  si: "sl",
  sk: "sk",
  dk: "da",
  hr: "hr",
  mt: "en",
  de: "de",
  it: "it",
  nl: "nl",
  fi: "fi",
  ee: "et",
  cy: "el",
  at: "de",
  se: "sv",
  ie: "en",
  lv: "lv",
  pl: "pl",
  no: "nb_NO",
};

const getTargets = (fileName, campaign) => {
  const p = path.resolve(__dirname, source + `${fileName}.json`);
  if (!fs.existsSync(p)) {
     console.error (color.red("missing file", p), "\ntry running yarn target --digest on proca");
     process.exit(1);
  }
  const targets = JSON.parse(fs.readFileSync(p, "utf8"));
  targets.forEach((d) => {
    if (!d.locale) {
      d.locale =
        typeof languages[d.area.toLowerCase()] === "string" ? languages[d.area.toLowerCase()] : null;
    }
  });
  return targets;
};

// filter can be a number (take first only n) or an email (take only the target with this email
const filter = (targets, criteria) => {
  if (!criteria)
    return targets;
  if (parseInt(criteria,10) > 0) {
    console.log("...but processing only", criteria);
     return targets.slice(0,criteria);
  } else {
    console.log("...but processing only", criteria);
    const d = targets.find( d => d.email === criteria);
    if (!d) {
      console.error(color.red("no target with email=",criteria));
      process.exit(1);
    }
    return [d];
  }
  console.error("don't know how to filter",criteria);
  throw new Error ("don't know how to filter ",criteria);
}

module.exports = {getTargets, filter };
