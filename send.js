const nodemailer = require("nodemailer");
require('dotenv').config()
const { supabase } = require("./api");
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
  console.log("sending digest", digest.id)

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
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

  if (argv["dry-run"]) {
    return;
  }

  const id = digest.id;
  const { data, error } = await supabase
      .from('digest')
    .update({ 'status': 'sent' })
    .match({ id: id })

  if (error) console.log("error updating digest", id, error)

}

const main = async () => {
console.log("sending digests for campaign", campaign)
  const { data: digests, error } = await supabase.from('digest').select('*').eq('status','pending').eq('campaign',campaign);
console.log("found ", digests.length, " digests to send")
  for (const i in digests) {
    const digest = digests[i];
      await sendDigest(digest);
  }
  process.exit(1);
  }


main().catch(console.error);
