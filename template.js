const fs = require("fs");
const path = require("path");
require("dotenv").config();

const from = process.env.REACT_APP_TEMPLATES_FOLDER;

const subject = (campaign, name, lang) => {
  const p = path.resolve(__dirname, from +`${campaign}/${name}/${lang}.json`);
  return JSON.parse(fs.readFileSync(p, "utf8")).meta.subject;
};

const html = (campaign, name, lang) => {
  const p = path.resolve(__dirname, from + `${campaign}/${name}/${lang}.html`);
  return fs.readFileSync(p, "utf8");
};

console.log(subject("restorenaturepics", "initialDigest", "en"), html("restorenaturepics", "initialDigest", "en"));

module.exports = { subject, html };
