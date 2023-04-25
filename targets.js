const fs = require("fs");
const path = require("path");
require("dotenv").config();

const source =
  process.env.REACT_APP_TARGETS_FOLDER ||
  process.env.REACT_APP_CONFIG_FOLDER + "target/source/";

const server =
  process.env.REACT_APP_CONFIG_FOLDER + "target/server/";

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
  cy: "cy",
  at: "de",
  se: "sv",
  ie: "en",
  lv: "lv",
  pl: "pl",
  no: "nb_NO",
};

const getServerTargets = (fileName) => {
  const p = path.resolve(__dirname, server + `${fileName}.json`);
  const targets = JSON.parse(fs.readFileSync(p, "utf8")) || [];
  return targets;
}

const getTargets = (fileName) => {
  const p = path.resolve(__dirname, source + `${fileName}.json`);
  const targets = JSON.parse(fs.readFileSync(p, "utf8")).filter((d) => d.email);
  const sources = getServerTargets (fileName);

  const getSalutation = externalId => {
    const source = sources.find(d => d.externalId === externalId);
    if (!source) return "";
    return source.fields.salutation; 
  };

  targets.forEach((d) => {
    if (!d.salutation) {
      const salutation = getSalutation (d.externalId);
       if (salutation) d.salutation = salutation;
    }
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
    console.log("...but processing only ", criteria);
     return targets.slice(0,criteria);
  } else {
    console.log("...but processing only ", criteria);
    const d = targets.find( d => d.email === criteria);
    return [d];
  }
  console.error("don't know how to filter ",criteria);
  throw new Error ("don't know how to filter ",criteria);
}

module.exports = { getTargets, filter };
