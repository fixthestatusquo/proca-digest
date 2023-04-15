require("dotenv").config();
const color = require("cli-color");
const { getTargets } = require("./api");

const argv = require("minimist")(process.argv.slice(2), {
  boolean: ["help", "dry-run", "verbose"],
});
const campaign = arvg._[0];

const help = () => {
  console.log(
    [
      "--help (this command)",
      "--dry-run",
      "--verbose",
      "--target= email@example.org or number of targets to process",
      "{campaign_name}",
    ].join("\n")
  );
  process.exit(0);
};

if (argv.help || !campaign) return help();

let targets = getTargets(campaign);
console.log("targetting ", targets.length, " from ", campaign);

