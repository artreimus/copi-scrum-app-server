const nodemailer = require('nodemailer');
const nodemailerConfig = require('./nodemailerConfig');

const sendEmail = async ({ to, subject, html }) => {
  let testAccount = await nodemailer.createTestAccount();
  let transporter = nodemailer.createTransport(nodemailerConfig);
  return transporter.sendMail({
    from: '"Arthur Reimus 👻" <artrei.dev@gmail.com>',
    to,
    subject,
    html,
  }); // we dont have to use await because async returns a promise by default
};

module.exports = sendEmail;
