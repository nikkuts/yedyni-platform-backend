const sendEmail = require('../helpers/sendEmail');
const courseUkrainian = require('./emailData/courseUkranian');
const courseServant = require('./emailData/courseServant');

const templates = {
  'kurs_perehodu': courseUkrainian,
  'gramatichniy_kurs': courseUkrainian,
  'kurs_z_pidgotovki_do_derzhispitu': courseServant,
};

/**
 * Надсилає лист із заданого шаблону
 * @param {string} course - ключ курсу (наприклад, 'kurs_perehodu')
 * @param {string} type - тип листа (наприклад, 'access' або 'payment')
 * @param {string} to - email отримувача
 * @param {object} [data={}] - змінні для підстановки у шаблон
 */
async function sendCourseEmail(course, type, to, data) {
  const courseData = templates[course]?.[type];
  if (!courseData) {
    throw new Error(`Template not found: ${course}/${type}`);
  }

  // Замінюємо плейсхолдери типу {{email}} або {{first_name}}
  let html = courseData.html;
  let text = courseData.text;

  if (data) {
    for (const [key, value] of Object.entries(data)) {
      const safeValue = value != null ? value.toString() : '';
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(regex, safeValue);
      text = text.replace(regex, safeValue);
    }
  }

  return await sendEmail({
    to,
    subject: courseData.subject,
    html,
    text,
  });
};

module.exports = sendCourseEmail;
