require("dotenv").config();
const color = require("cli-color");
const { getDigests } = require("./api");
const { filter } = require("./targets");
const { getSender } = require("./template");
const {preview, initPreview } = require("./mailer");



const argv = require("minimist")(process.argv.slice(2), {
  boolean: ["help", "dry-run", "verbose", "mailhog", "etheralmail"],
});
const campaign = argv._[0];

const help = () => {
  console.log(
    [
      "--help (this command)",
      "--dry-run",
      "--verbose",
      "--mailhog",
      "--etheralmail",
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
if (targets.length ===0) {
  console.error(color.red("no email to send, run prepare"));
  process.exit(1);
}
  console.log("targetting", targets.length, "from", campaign);
  targets=filter(targets,argv.target);
  const sender = getSender(campaign);
  if (argv.mailhog) {
    await initPreview("mailhog");
  } else {
    await initPreview("etheralmail");
  }
  for (const i in targets) {
    const target = targets[i];
    // todo: if template not set, supabase.select email,target_id from digests where campaign=campaign and status='sent' group by email
    // if in that list -> template= default, else -> initial
      const info= await preview (target.email,target.subject,target.body,sender);
    if (info.url) 
      console.log(color.green(info.url));
    
  }
};

main().catch(console.error);
} else {
  //export a bunch
  module.exports = {
  };
}


