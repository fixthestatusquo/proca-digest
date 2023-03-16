const nodemailer = require("nodemailer");
require('dotenv').config()
const subject = require("./template").subject;
const html = require("./template").html;
const { supabase }  = require("./api");


const s = subject("restorenaturepics", "initialDigest", "en")
const h = html("restorenaturepics", "initialDigest", "en")

const main = async () => {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
 // let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL, // generated ethereal user
      pass: process.env.PASS, // generated ethereal password
    },
  });


  let info = await transporter.sendMail({
    from: '"Bruce Wayne 🦇" <bruce.wayne@gmail.com>', // sender address
    to: "ivana@fixthestatusquo.org", // list of receivers
    subject: s, // Subject line
    text: "Proca digest", // plain text body
    html: h, // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...



  const { data, error } = await supabase
  .from('digest')
  .insert([
    { subject: s, body: h, status: "sent", template: "templateName", email: "someEmail@mail.com", target_id: "123e4567-e89b-12d3-a456-426614174000", variables: {} }// , template: `${campaign}/${name}` },
  ])

  if (error) console.log('error saving template', error)
}
console.log(subject("restorenaturepics", "initialDigest", "en"));
main().catch(console.error);