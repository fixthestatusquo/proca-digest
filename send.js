#!/usr/bin/env node
const readline = require("readline");
require("dotenv").config();
const color = require("cli-color");
const { getDigests, setStatus } = require("./api");
const { filter } = require("./targets");
const { getSender } = require("./template");
const { sendDigest, init } = require("./mailer");


const pause = (time) => {
    if (!time) { 
      const min = 19; max = 93; // wait between 19 second and 1.5min
      time = Math.floor(Math.random() * (max - min + 1) + min) *1000;
      console.log("waiting",time/1000);
    }
    return new Promise(resolve => setTimeout(resolve, time));
}

const confirm = async (query = "Press [Y] to continue:") => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (answser) => {
      const input =answser.trim().toLowerCase();
      if (input === "y") {
        resolve();
        return;
      }
      if (input !== "n") {
        console.log(color.yellow(query));
      }
        rl.close();
        process.exit(1);
    })
  );
};

const help = (status = 0) => {
  console.log(
    [
      "--help (this command)",
      "--dry-run",
      "--to substitute recipient to handle the emails",
      "--verbose",
      "--pause|no-pause (by default wait a min or 3 between sending emails)",
      "--target= email@example.org or number of targets to process",
      "{campaign_name}",
    ].join("\n")
  );
  process.exit(status);
};

const argv = require("minimist")(process.argv.slice(2), {
  boolean: ["help", "dry-run", "verbose","pause"],
  default: {pause:true},
  string: ["to"],
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
    let targets = await getDigests(campaign, "pending");
    if (targets.length === 0) {
      console.error(color.red("no email to send, run prepare"));
      process.exit(1);
    }
    console.log("targetted", targets.length, "from", campaign);
    targets = filter(targets, argv.target);
    const sender = getSender(campaign);
    //  const sender = {email:"xavier@fixthestatusquo.org","name":"restore nature"};
    await init({
      host: process.env.SMTP_SERVER,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    });

    if (argv["dry-run"]) {
      console.log("dry run, you might want to set the 'to' param instead");
      process.exit(1);
    }

    if (!argv.to && !argv['dry-run']) {
      await confirm();
    }
console.log(color.blue ("start ",new Date().toString()));

    for (const i in targets) {
      const target = targets[i];
      // todo: if template not set, supabase.select email,target_id from digests where campaign=campaign and status='sent' group by email
      // if in that list -> template= default, else -> initial
        recipient = argv.to ? argv.to : target.email ;
        if (argv.to && !argv.target) {
          console.log(
            color.yellow("set target=n when to is defined, we defaulted to 1 ")
          );
          argv.target = 1;
        }

      const info = await sendDigest(
        recipient,
        target.subject,
        target.body,
        sender
      );
      if (info.accepted.length >= 1) {
        if (!argv.to && !argv['dry-run']) {
          console.log("sent", target.email);
          await setStatus(target.id, "sent");
        } else {
          console.log("sent", target.email, argv.to && "replaced by " + argv.to);
        }
      }
      if (argv.pause) {
        await pause();
      }
    }
  console.log(color.blue ("end ",new Date().toString()));
  };

  main().then ( () => process.exit(0)).catch(console.error);
} else {
  //export a bunch
  module.exports = {};
}
