const fs = require("fs");
const path = require("path");
const i18next = require("i18next");
require("dotenv").config();
const color = require("cli-color");

const from = process.env.REACT_APP_TEMPLATES_FOLDER || process.env.REACT_APP_CONFIG_FOLDER + 'email/digest/';

i18next.init({
  lng: 'en', // if you're using a language detector, do not define the lng option
  debug: false,
  resources: {
    en: {
    }
  }
});

const resolve = (campaign,name,lang,ext) => {
  const p = path.resolve(__dirname, from + `${campaign}/${name}/${lang}.${ext}`);
  if (!fs.existsSync(p)) {
    console.warn (color.red("no template for ",campaign,name,lang), ", trying in en");
    return path.resolve(__dirname, from + `${campaign}/${name}/en.${ext}`);
  }
  return p;
}

const subject = (campaign, name, lang) => {
  let p = resolve(campaign, name, lang,'json');
  if (!fs.existsSync(p)) {
    console.error("Subject does not exist:", p);
    return;
  }
  return JSON.parse(fs.readFileSync(p, "utf8")).meta.subject;
};

const insertVariables = (template, variables) => {
//console.log(variables);
  // insert variables in templates code here
  return i18next.t(template,variables);
};

const html = (campaign, name, lang) => {
  let p = resolve(campaign, name, lang,'html');
  if (!fs.existsSync(p)) {
    console.error("HTML does not exist:", p);
    return;
  }
  return fs.readFileSync(p, "utf8");
};


const getTokens = html => {
  const tokens = [];

  html.replace(/\{\{(.*?)}}/g, function(a, b) {
  tokens.push(b);
});

  return tokens;
}

module.exports = { subject, html, insertVariables, getTokens };
