const nodemailer = require("nodemailer");
require('dotenv').config()
const { subject, html, insertVariables } = require("./template");
const { supabase } = require("./api");
const argv = require("minimist")(process.argv.slice(2), {
  boolean: ["help","dry-run"],
  default: {"template":"default"}
});

const { supabase } = require("./api");

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

console.log("targetting ", targets.length, " from ", sourceName);
// it is set to send emails with gmail
// usual pasword not working, use app password https://support.google.com/accounts/answer/18583


const transporter = nodemailer.createTransport({
    // todo: put service  and host in .env ...or config on proca?
//    service: "gmail",
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });


const sendDigest = async (digest) => {

  let info = await transporter.sendMail({
    from: '"Bruce Wayne 🦇" <bruce.wayne@gmail.com>', // sender address TODO: take from campaign.config
    to: "xavierqq@fixthestatusquo.org", // list of receivers
    // to: email,
    subject: digest.subject,
    //TO DO: add plain
    text: "Proca digest", // plain text body
    html: digest.html,
  });

  if (transporter.getTestMessageUrl) {
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", transporter.getTestMessageUrl(info));
  }
  // Preview only available when sending through an Ethereal account!!
  //console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

  if (argv.dry-run) {
    return;
  }
    const { data, error } = await supabase
  .update('digest')
  .set('status','sent')
  .where(id,digest.id)

}

const main = async () => {

  const { data: digests, error } = await supabase.select('*').from('digest').eq('status','pending').eq('campaign',campaign);

  for (const i in digests) {
    const digest = digests[i];
      await sendDigest(digest);

process.exit(1);
    }
  }
}

main().catch(console.error);
