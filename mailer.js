const nodemailer = require("nodemailer");
//should be for the preview

let transporter = undefined;

const export initPreview = () => {
  const [user,password]=process.env.ETHEREAL_ACCOUNT.split(":");
  
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    secure: true, 
    auth: {
      user: user,
      pass: password,
    },
  });
  return transporter;
}


const export init =config => {
  transporter = nodemailer.createTransport({
    // todo: put service  and host in .env ...or config on proca?
//    service: "gmail",
    host: config.transport.host,
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.transport.user,
      pass: config.transport.password,
    },
  });
  return transporter;
}

const export sendDigest = async (s, h, email) => {

  let info = await transporter.sendMail({
    from: '"Bruce Wayne 🦇" <bruce.wayne@gmail.com>', // sender address TODO: take from campaign.config
    to: "xavierqq@fixthestatusquo.org", // list of receivers
    // to: email,
    subject: s,
    //TO DO: add plain
    text: "Proca digest", // plain text body
    html: h,
  });

  if (transporter.getTestMessageUrl) {
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", transporter.getTestMessageUrl(info));
  }

