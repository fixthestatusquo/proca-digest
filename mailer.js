const nodemailer = require("nodemailer");
const color = require("cli-color");
//should be for the preview

let transporter = undefined;

const previewUrl = (info) => {
  if (nodemailer.getTestMessageUrl) {
    return nodemailer.getTestMessageUrl(info);
  }
};

const initPreview = async mode => {
  if (mode === "mailhog") 
    return initMailhog();
  if (mode === "etheralmail") {
    return initEthermail();
  }
  console.error (color.red("specify if you want mailhog or etheralmail for the preview"));
}

const initMailhog = async () => {
  transporter = nodemailer.createTransport({
    // todo: put service  and host in .env ...or config on proca?
    //    service: "gmail",
    host: "localhost",
    port: 1025
  });
  console.log(color.blue("preview them mail on http://localhost:8025 - needs to run ~/go/bin/MailHog"));
  return transporter;
}

const initEthermail = async () => {
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
    host: config.host,
   port: 587,
    secureConnection: false, 
        tls: {
        ciphers:'SSLv3'
    },
    //secure: true, // true for 465, false for other ports
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
  return transporter;
};

const sendDigest = async (email, subject, body, sender) => {
  if (!transporter) {
    console.error("sender not configured");
    process.exit(1);
  }
  return new Promise((resolve, reject) => {
    transporter.sendMail(
      {
        from: '"' + sender.name + '" <' + sender.email + ">",
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
    await initPreview('etheralmail');
  }
  if (!(transporter.options.host === "smtp.ethereal.email" || transporter.options.host==="localhost")) {
    //extra security
    console.error(color.red("invalid preview host", transporter.options.host));
    throw new Error("invalid transporter for preview");
  }
  const info = await sendDigest(email, subject, body, sender);
  return { url: previewUrl(info), ...info };
};

module.exports = { sendDigest, init, preview, initPreview, previewUrl };
