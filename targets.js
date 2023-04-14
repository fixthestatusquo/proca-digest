const fs = require("fs");
const path = require("path");
require("dotenv").config();

const source =
  process.env.REACT_APP_TARGETS_FOLDER ||
  process.env.REACT_APP_CONFIG_FOLDER + "target/source/";

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

const getTargets = (fileName) => {
  const p = path.resolve(__dirname, source + `${fileName}.json`);
  const targets = JSON.parse(fs.readFileSync(p, "utf8")).filter((d) => d.email);
  targets.forEach((d) => {
    if (!d.locale) {
      d.locale =
        typeof languages[d.area.toLowerCase()] === "string" ? languages[d.area.toLowerCase()] : null;
    }
  });
  return targets;
};

module.exports = { getTargets };
