const { MailtrapClient } = require('mailtrap');
require('dotenv').config();

const {MAILTRAP_ENDPOINT, MAILTRAP_API_TOKEN, SENDER_NAME, SENDER_EMAIL} = process.env;

const client = new MailtrapClient({ endpoint: MAILTRAP_ENDPOINT, token: MAILTRAP_API_TOKEN });
const sender = { name: SENDER_NAME, email: SENDER_EMAIL };

const sendEmail = async (data) => {
  const email = {...data, from: sender};
  try {
      await client.send(email);
      console.log('success email');
      return true;
  } catch (error) {
      console.log(error.message);
      return false;
  }
};

module.exports = sendEmail; 