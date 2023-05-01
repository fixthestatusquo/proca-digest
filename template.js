const fs = require("fs");
const path = require("path");
const i18next = require("i18next");
require("dotenv").config();
const color = require("cli-color");
const _snarkdown = require("snarkdown");

const snarkdown = (md) => {
  if (md) {
    const htmls = md
      .split(/(?:\r?\n){2,}/)
      .map((l) =>
        [" ", "\t", "#", "-", "*"].some((ch) => l.startsWith(ch))
          ? _snarkdown(l)
          : `<p>${_snarkdown(l)}</p>`
      );

    return htmls.join("\n\n");
  }
};

const from =
  process.env.REACT_APP_TEMPLATES_FOLDER ||
  process.env.REACT_APP_CONFIG_FOLDER + "email/digest/";

const configFolder = process.env.REACT_APP_CONFIG_FOLDER;

i18next.init({
  lng: "en", // if you're using a language detector, do not define the lng option
  debug: false,
  resources: {
    en: {},
  },
});

const getCampaign = (campaign) => {
  const p = path.resolve(
    __dirname,
    configFolder + `/campaign/${campaign}.json`
  );
  if (!fs.existsSync(p)) {
    console.error(color.red("no campaign config file for", campaign));
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const getSender = campaignName => {
  const campaign = getCampaign(campaignName);
  return campaign.config.component.email.sender;
}

const resolve = (campaign, name, lang, ext) => {
  const p = path.resolve(
    __dirname,
    from + `${campaign}/${name}/${lang}.${ext}`
  );
  if (!fs.existsSync(p)) {
    console.warn(
      color.red("no template for ", campaign, name, lang),
      ", trying in en"
    );
    return path.resolve(__dirname, from + `${campaign}/${name}/en.${ext}`);
  }
  return p;
};

const subject = (campaign, name, lang) => {
  let p = resolve(campaign, name, lang, "json");
  if (!fs.existsSync(p)) {
    console.error("Subject does not exist:", p);
    return;
  }
  return JSON.parse(fs.readFileSync(p, "utf8")).meta.subject;
};

const insertVariables = (template, variables) => {

  // insert variables in templates code here
  return i18next.t(template, {
    ...variables,
    interpolation: { escapeValue: false },
  });
};

const html = (campaign, name, lang) => {
  let p = resolve(campaign, name, lang, "html");
  if (!fs.existsSync(p)) {
    console.error("HTML does not exist:", p);
    return;
  }
  return fs.readFileSync(p, "utf8");
};

const getTokens = (html) => {
  const tokens = [];

  html.replace(/\{\{(.*?)}}/g, function (a, b) {
    tokens.push(b);
  });

  return tokens;
};

const getLetter = (campaignName, locale = "en") => {
  const campaign=getCampaign(campaignName);
  const locales = campaign.config.locales;

  let texts = locales[locale] || null;

  if (!texts || !texts["server:"] || !texts["server:"].letter) {
    console.warn(color.yellow("  no letter for", locale), "defaulting to en");
    locale = "en";
    texts = locales[locale];
  }

  return `<div style="border: solid #d3d3d3 10px; padding: 2%">${snarkdown(
    texts["server:"].letter)}</div>`;
};

const getFallback = (fallbackFile) => {
  const p = path.resolve(
    __dirname,
    from + `${fallbackFile}`
  );
  if (!fs.existsSync(p)) {
    console.warn(color.red("no fallback for ", fallbackFile));
  }
  return fs.readFileSync(p, "utf8");
}

module.exports = { subject, html, insertVariables, getTokens, getLetter, getFallback, getCampaign, getSender };
