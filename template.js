const fs = require("fs");
const path = require("path");
require("dotenv").config();

const from = process.env.REACT_APP_TEMPLATES_FOLDER || process.env.REACT_APP_CONFIG_FOLDER + 'email/digest/';

const subject = (campaign, name, lang) => {
  const p = path.resolve(__dirname, from + `${campaign}/${name}/${lang}.json`);
  if (!fs.existsSync(p)) {
    console.error("Subject does not exist:", p);
    return;
  }
  return JSON.parse(fs.readFileSync(p, "utf8")).meta.subject;
};

const insertVariables = (template, variables) => {

  // insert variables in templates code here

  return template;
};

const html = (campaign, name, lang) => {
  const p = path.resolve(__dirname, from + `${campaign}/${name}/${lang}.html`);
  if (!fs.existsSync(p)) {
    console.error("HTML does not exist:", p);
    return;
  }
  return fs.readFileSync(p, "utf8");
};


module.exports = { subject, html, insertVariables };
