const { MailtrapClient } = require('mailtrap');
require('dotenv').config();

const {
  MAILTRAP_ENDPOINT,
  MAILTRAP_API_TOKEN,
  SENDER_NAME,
  SENDER_EMAIL,
} = process.env;

// Ініціалізація Mailtrap клієнта
const client = new MailtrapClient({
  endpoint: MAILTRAP_ENDPOINT,
  token: MAILTRAP_API_TOKEN,
});

// Відправник із доменом, що має SPF/DKIM
const sender = {
  name: SENDER_NAME,
  email: SENDER_EMAIL,
};

/**
 * Універсальна функція для надсилання листів
 * @param {Object} data - дані листа
 * @param {string} data.to - email отримувача
 * @param {string} data.subject - тема листа
 * @param {string} data.html - HTML контент листа
 * @param {string} [data.text] - plain text версія
 */
const sendEmail = async (data) => {
  const email = {
    from: sender,
    to: [{ email: data.to }],
    subject: data.subject,
    html: data.html,
    text: data.text || '',

    // Безпечні опції для уникнення спаму
    category: 'notification', 
    custom_variables: {
      project: 'Rukh-Yedyni',
    },
  };

  try {
    await client.send(email);
    console.log(`✅ Email sent successfully to ${data.to}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error.message || error);
    return false;
  }
};

module.exports = sendEmail;
