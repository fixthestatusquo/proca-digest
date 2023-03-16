const fs = require("fs");
const path = require("path");

const subject = (campaign, name, lang) => {
  const p = path.resolve(__dirname, `../proca/config/email/digest/${campaign}/${name}.${lang}.json`);
  return JSON.parse(fs.readFileSync(p, "utf8")).meta.subject;
};

const html = (campaign, name, lang) => {
  const p = path.resolve(__dirname, `../proca/config/email/digest/${campaign}/${name}.${lang}.html`);
  return fs.readFileSync(p, "utf8");
};

module.exports = { subject, html };

// config/email/digest/demo/initialDigest.en.json