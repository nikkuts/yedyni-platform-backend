const nodemailer = require('nodemailer');

require('dotenv').config();

const nodemailerСonfig = {
  host: 'smtp.meta.ua',
  port: 465,
  secure: true,
  auth: {
    user: 'mykolakuts@meta.ua',
    pass: process.env.PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
};

const transporter = nodemailer.createTransport(nodemailerСonfig);

const sendEmail = async (data) => {
    const email = {...data, from: 'mykolakuts@meta.ua'};
    await transporter.sendMail(email);
    return true;
};

module.exports = sendEmail; 