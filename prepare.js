require('dotenv').config()
const { subject, html, insertVariables } = require("./template");
const { supabase } = require("./api");
const getTargets = require("./targets").getTargets;
const argv = require("minimist")(process.argv.slice(2), {
const argv = require("minimist")(process.argv.slice(2), {
  boolean: ["help","dry-run"],
  default: {"template":"default"}
});


const help = () => {
  console.log(
    [
      "--help (this command)",
      "--template (template folder in config/email/digest/campaigName), by default default.xx.html",
      "--source (source file in config/targets/source/)",
      "--dry-run",
      "{campaign_name}",
    ].join("\n")
  );
  process.exit(0);
};

const campaign = argv._[0];

if (argv.help || !campaign) return help();

if (!argv.source) argv.source = campaign;
const templateName = argv["template"] || "initialDigest"; // TODO: for each target, check if the target has received an email, "initial", otherwise, "default"
const sourceName = argv["source"];

const targets = getTargets(sourceName);
console.log("targetting ", targets.length, " from ", sourceName);
// it is set to send emails with gmail
// usual pasword not working, use app password https://support.google.com/accounts/answer/18583


  // Preview only available when sending through an Ethereal account!!
  //console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

  // add lang to template record?
  //we dont have target_id on source, use email instead???

const prepare = (target, templateName,campaign) => {
    const s = subject(campaign, templateName, target.lang)
    const h = html(campaign, templateName, target.lang)

  const { data, error } = await supabase
  .from('digest')
  .insert([
    { subject: s, body: h, status: "sent", template: templateName, email: "someEmail@mail.com", target_id: "123e4567-e89b-12d3-a456-426614174000", variables: {},status:'pending' }// , template: `${campaign}/${name}` },
  ])

  if (error) console.log('error saving template', error)
}

const main = async () => {
  for (const i in targets) {
    const target = targets[i];
    // todo: if template not set, fetch email,target_id from digests where campaign=campaign and status='sent' group by email
    // if in that list -> template= default, else -> initial
    prepare (targets[i], "initial");
    if (!s) {
      console.error("Subject or HTML not found:", target);
      // return;
    } else if (!h) {
      console.error("Subject or HTML not found:", target);
      // return;
    } else {

      // fetch variables
      // insert variables in template
      insertVariables(h, variables = "");

      await sendDigest(s, h, target.email);

process.exit(1);
    }
  }
}

main().catch(console.error);
