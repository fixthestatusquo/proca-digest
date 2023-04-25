require("dotenv").config();
const color = require("cli-color");
const { getDigests } = require("./api");
const { filter } = require("./targets");
const {preview } = require("./mailer");



const argv = require("minimist")(process.argv.slice(2), {
  boolean: ["help", "dry-run", "verbose"],
});
const campaign = argv._[0];

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


if (require.main === module) {

if (argv.help || !campaign) return help();
const main = async () => {
  let targets = await getDigests(campaign, "pending");
  console.log("targetting ", targets.length, " from ", campaign);
  targets=filter(targets,argv.target);

  for (const i in targets) {
    const target = targets[i];
    // todo: if template not set, supabase.select email,target_id from digests where campaign=campaign and status='sent' group by email
    // if in that list -> template= default, else -> initial
    const r = await prepare(target, templateName, campaign);
      const info= await preview (target.email,target.subject,target.body);

    console.log(color.green(info.url));
  }
};

main().catch(console.error);
} else {
  //export a bunch
  module.exports = {
  };
}


