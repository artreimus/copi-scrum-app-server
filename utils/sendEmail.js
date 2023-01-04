const nodemailer = require('nodemailer');
const nodemailerConfig = require('./nodemailerConfig');
const sgMail = require('@sendgrid/mail');

// developlment email service
const sendEmailNodeMailer = async ({ to, subject, html }) => {
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport(nodemailerConfig);
  return transporter.sendMail({
    from: '"Arthur Reimus 👻" <artrei.dev@gmail.com>',
    to,
    subject,
    html,
  }); // we dont have to use await because async returns a promise by default
};

// production email service
const sendEmailSendGrid = async ({ to, subject, html }) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to,
    from: 'artrei.dev@gmail.com',
    subject,
    html,
  };

  return sgMail.send(msg);
};

module.exports = sendEmailSendGrid;
