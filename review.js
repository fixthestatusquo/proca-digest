const readline = require("readline");
require("dotenv").config();
const color = require("cli-color");
const { getDigests, getDigestsSummary, setStatus } = require("./api");
const { filter } = require("./targets");
const { getSender } = require("./template");
const { sendDigest, init } = require("./mailer");

const help = (status = 0) => {
  console.log(
    [
      "--help (this command)",
      "--dry-run",
      "--to substitute recipient to handle the emails",
      "--verbose",
      "--date= date of the digest to review",
      "--target= email@example.org or number of targets to process",
      "{campaign_name}",
    ].join("\n")
  );
  process.exit(status);
};

const argv = require("minimist")(process.argv.slice(2), {
  boolean: ["help", "dry-run", "verbose"],
  string: ["to","date"],
  unknown: (d) => {
    const allowed = ["target"]; //merge with boolean and string?
    if (d[0] !== "-") return true;
    if (allowed.includes(d.split("=")[0].slice(2))) return true;
    console.log(color.red("unknown param", d));
    help(1);
  },
});
if (argv._.length !== 1) {
  console.log(color.red("only one campaign param allowed"), argv._);
  help();
}
const campaign = argv._[0];

if (require.main === module) {
  if (argv.help || !campaign) return help();
  const main = async () => {
    if (!argv.date) {
    let digests= await getDigestsSummary(campaign);
      console.log("digests",digests); 
      console.log(color.blue("add --date=  one of the dates of the digest"));
      return;
    }
    let targets = await getDigests(campaign, "sent",argv.date);
    if (targets.length === 0) {
      console.error(color.red("no email sent at ",argv.date,", run prepare+mailer"));
      process.exit(1);
    }
    console.log("sent to", targets.length, "from", campaign);
    targets = filter(targets, argv.target);
    const sender = getSender(campaign);
    //  const sender = {email:"xavier@fixthestatusquo.org","name":"restore nature"};
    await init({
      host: process.env.SMTP_SERVER,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    });

    if (!argv.to) {
      console.log("we do not resend, only send copy to --to param");
      process.exit(1);
    }
    for (const i in targets) {
      const target = targets[i];
      let recipient = target.email;
      // todo: if template not set, supabase.select email,target_id from digests where campaign=campaign and status='sent' group by email
      // if in that list -> template= default, else -> initial
      if (argv.to) {
        recipient = argv.to;
        if (!argv.target) {
          console.log(
            color.yellow("set target=n when to is defined, we defaulted to 1 ")
          );
          argv.target = 1;
        }
      }

    if (argv["dry-run"]) {
      console.log("sent", target.email, target.subject);
      return;
    }
      const info = await sendDigest(
        recipient,
        target.subject,
        target.body,
        sender
      );
      if (info.accepted.length >= 1) {
        console.log("sent", target.email, argv.to && "replaced by " + argv.to);
        if (!argv.to && !argv['dry-run']) {
          await setStatus(target.id, "sent");
        }
      }
    }
  };

  main().catch(console.error);
} else {
  //export a bunch
  module.exports = {};
}
