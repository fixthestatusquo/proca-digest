const nodemailer = require("nodemailer");
const color = require("cli-color");
//should be for the preview

let transporter = undefined;

const previewUrl = (info) => {
  if (nodemailer.getTestMessageUrl) {
    return nodemailer.getTestMessageUrl(info);
  }
};

const initPreview = async () => {
  return new Promise((resolve, reject) => {
    nodemailer.createTestAccount((err, account) => {
      if (err) {
        console.error("Failed to create a testing account. " + err.message);
        reject("Failed to create a testing account. " + err.message);
      }
      //      console.log(account, "test credentials obtained");

      // Create a SMTP transporter object
      transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.user,
          pass: account.pass,
        },
      });
      resolve(transporter);
    });
  });
};

const init = (config) => {
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
};

const sendDigest = async (email, subject, body, sender) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(
      {
        from: '"' + sender.name + '" <' + sender.email + ">",
        to: transporter.transporter.auth.user, // list of receivers
        to: email,
        subject: subject,
        //TO DO: add plain
        html: body,
      },
      (err, info) => {
        if (err) {
          console.log("Error occurred. " + err.message);
          reject("Error occurred. " + err.message);
        }
        return resolve(info);
      }
    );
  });
};

const preview = async (email, subject, body, sender) => {
  if (!transporter) {
    await initPreview();
  }
  if (transporter.options.host !== "smtp.ethereal.email") {
    //extra security
    console.error(color.red("invalid preview host", transporter.options.host));
    throw new Error("invalid transporter for preview");
  }
  const info = await sendDigest(email, subject, body, sender);
  return { url: previewUrl(info), ...info };
};

module.exports = { sendDigest, init, preview, initPreview, previewUrl };
