const axios = require('axios');
const querystring = require('querystring');
const Base64 = require('crypto-js/enc-base64');
const SHA1 = require('crypto-js/sha1');
const Utf8 = require('crypto-js/enc-utf8');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const { Client } = require('../models/client');
const {ctrlWrapper, HttpError, sendEmail} = require('../helpers');
const courses = require('../utils/courses.json');

const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BASE_SERVER_URL = process.env.BASE_SERVER_URL;
const {USPACY_LOGIN, USPACY_PASS} = process.env;

const addServant = async (req, res) => {
  const {first_name, last_name, email, phone} = req.body;
  const course = courses.find(elem => elem.title === 'Курс для держслужбовців');

  try {
    const newClient = await Client.create({
      first_name,
      last_name, 
      email,
      phone,
      product: "Курс для держслужбовців",
    });

    const orderId = uuidv4();

      const dataObj = {
        public_key: PUBLIC_KEY, 
        version: '3',
        action: 'pay',
        amount: 950,
        currency: 'UAH',
        description: `${last_name} ${first_name} Донат за Курс з підготовки до держіспиту`,
        order_id: orderId,
        result_url: `https://yedyni.org/testpayment?client_id=${newClient._id}`,
        server_url: `${BASE_SERVER_URL}/api/clients/process`,
        customer: newClient._id,
      };

    // Кодуємо дані JSON у рядок та потім у Base64
    const dataString = JSON.stringify(dataObj);
    const data = Base64.stringify(Utf8.parse(dataString));

    // Створюємо підпис
    const hash = SHA1(PRIVATE_KEY + data + PRIVATE_KEY);
    const signature = Base64.stringify(hash);

    const paymentForm = `
      <form id="paymentForm" method="POST" action="https://www.liqpay.ua/api/3/checkout" accept-charset="utf-8">
        <input type="hidden" name="data" value='${data}' />
        <input type="hidden" name="signature" value='${signature}' />
        <input type="image" src="//static.liqpay.ua/buttons/payUk.png"/>
      </form>
      <script>
        document.addEventListener("DOMContentLoaded", function() {
        const paymentForm = document.getElementById("paymentForm");
            try {
              paymentForm.submit();
            }
            catch (error) {
              console.error('Помилка під час відправлення форми:', error);
              alert('Помилка відправки форми. Будь ласка, спробуйте повторити.');
            }
            finally {
              paymentForm.reset();
            }   
        });
      </script>
    `;

    res.send(paymentForm);

    // Отримання JWT токена від Uspacy
    const authOptions = {
      method: 'POST',
      url: 'https://yedyni.uspacy.ua/auth/v1/auth/sign_in',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      data: { email: USPACY_LOGIN, password: USPACY_PASS }
    };

    const authResponse = await axios(authOptions);
    const jwt = authResponse.data.jwt;

    // Створення контакту в Uspacy
    const createContactOptions = {
      method: 'POST',
      url: 'https://yedyni.uspacy.ua/crm/v1/entities/contacts',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${jwt}`
      },
      data: {
        title: `${last_name} ${first_name}`,
        first_name,
        last_name,
        email: [{ value: email }],
        phone: [{ value: phone }],
        registration: ["kurs_z_pidgotovki_do_derzhispitu"]
      }
    };

    const createContactResponse = await axios(createContactOptions);
    const contactUspacyId = createContactResponse.data.id;

    // Створення угоди для контакту в Uspacy
    const createDealOptions = {
      method: 'POST',
      url: 'https://yedyni.uspacy.ua/crm/v1/entities/deals',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${jwt}`
      },
      data: {
        title: "Курс з підготовки до держіспиту",
        funnel_id: 5,
        amount_of_the_deal: {currency: "UAH", value: course.amount},
        contacts: [contactUspacyId],
        hvilya: course.wave
      }
    };

    const createDealResponse = await axios(createDealOptions);
    const dealUspacyId = createDealResponse.data.id;

    // Збереження в локальній базі id контакту та угоди
    await Client.findByIdAndUpdate(newClient._id, {contactUspacyId, dealUspacyId});
    console.log('Створено угоду "Курс з підготовки до держіспиту"', `${last_name} ${first_name}`);

  } catch (error) {
    if (error.response) {
        // Логування повної відповіді помилки, якщо вона є
        console.error('Error during the process:', error.message, error.response.data);
        res.status(error.response.status).json({ success: false, message: error.response.data.message || 'Помилка при обробці запиту' });
      } else {
        // Логування помилки без відповіді
        console.error('Error during the process:', error.message);
        res.status(500).json({ success: false, message: 'Помилка при обробці запиту' });
      }
  }
};

const addCreative = async (req, res) => {
  const {first_name, last_name, email, phone} = req.body;
  const course = courses.find(elem => elem.title === 'Видноколо');

  try {
    const newClient = await Client.create({
      first_name,
      last_name, 
      email,
      phone,
      product: "Видноколо",
    });

    const orderId = uuidv4();

      const dataObj = {
        public_key: PUBLIC_KEY, 
        version: '3',
        action: 'pay',
        amount: 750,
        currency: 'UAH',
        description: `${last_name} ${first_name} Донат за Курс "Видноколо"`,
        order_id: orderId,
        result_url: `https://yedyni.org/testpayment?client_id=${newClient._id}`,
        server_url: `${BASE_SERVER_URL}/api/clients/process`,
        customer: newClient._id,
      };

    // Кодуємо дані JSON у рядок та потім у Base64
    const dataString = JSON.stringify(dataObj);
    const data = Base64.stringify(Utf8.parse(dataString));

    // Створюємо підпис
    const hash = SHA1(PRIVATE_KEY + data + PRIVATE_KEY);
    const signature = Base64.stringify(hash);

    const paymentForm = `
      <form id="paymentForm" method="POST" action="https://www.liqpay.ua/api/3/checkout" accept-charset="utf-8">
        <input type="hidden" name="data" value='${data}' />
        <input type="hidden" name="signature" value='${signature}' />
        <input type="image" src="//static.liqpay.ua/buttons/payUk.png"/>
      </form>
      <script>
        document.addEventListener("DOMContentLoaded", function() {
        const paymentForm = document.getElementById("paymentForm");
            try {
              paymentForm.submit();
            }
            catch (error) {
              console.error('Помилка під час відправлення форми:', error);
              alert('Помилка відправки форми. Будь ласка, спробуйте повторити.');
            }
            finally {
              paymentForm.reset();
            }   
        });
      </script>
    `;

    res.send(paymentForm);

    // Отримання JWT токена від Uspacy
    const authOptions = {
      method: 'POST',
      url: 'https://yedyni.uspacy.ua/auth/v1/auth/sign_in',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      data: { email: USPACY_LOGIN, password: USPACY_PASS }
    };

    const authResponse = await axios(authOptions);
    const jwt = authResponse.data.jwt;

    // Створення контакту в Uspacy
    const createContactOptions = {
      method: 'POST',
      url: 'https://yedyni.uspacy.ua/crm/v1/entities/contacts',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${jwt}`
      },
      data: {
        title: `${last_name} ${first_name}`,
        first_name,
        last_name,
        email: [{ value: email }],
        phone: [{ value: phone }],
        registration: ["kurs_vidnokolo"]
      }
    };

    const createContactResponse = await axios(createContactOptions);
    const contactUspacyId = createContactResponse.data.id;

    // Створення угоди для контакту в Uspacy
    const createDealOptions = {
      method: 'POST',
      url: 'https://yedyni.uspacy.ua/crm/v1/entities/deals',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${jwt}`
      },
      data: {
        title: "Видноколо",
        funnel_id: 6,
        amount_of_the_deal: {currency: "UAH", value: course.amount},
        contacts: [contactUspacyId],
        hvilya: course.wave
      }
    };

    const createDealResponse = await axios(createDealOptions);
    const dealUspacyId = createDealResponse.data.id;

    // Збереження в локальній базі id контакту та угоди
    await Client.findByIdAndUpdate(newClient._id, {contactUspacyId, dealUspacyId});
    console.log('Створено угоду "Видноколо"', `${last_name} ${first_name}`);

  } catch (error) {
    if (error.response) {
        // Логування повної відповіді помилки, якщо вона є
        console.error('Error during the process:', error.message, error.response.data);
        res.status(error.response.status).json({ success: false, message: error.response.data.message || 'Помилка при обробці запиту' });
      } else {
        // Логування помилки без відповіді
        console.error('Error during the process:', error.message);
        res.status(500).json({ success: false, message: 'Помилка при обробці запиту' });
      }
  }
};

const addProukrainian = async (req, res) => {
  const {first_name, last_name, email, phone} = req.body;
  const course = courses.find(elem => elem.title === 'Проукраїнська');

  try {
    const newClient = await Client.create({
      first_name,
      last_name, 
      email,
      phone,
      product: "Проукраїнська",
    });

    const orderId = uuidv4();

      const dataObj = {
        public_key: PUBLIC_KEY, 
        version: '3',
        action: 'pay',
        amount: 1100,
        currency: 'UAH',
        description: `${last_name} ${first_name} Донат за Курс "Проукраїнська"`,
        order_id: orderId,
        result_url: `https://yedyni.org/testpayment?client_id=${newClient._id}`,
        server_url: `${BASE_SERVER_URL}/api/clients/process`,
        customer: newClient._id,
      };

    // Кодуємо дані JSON у рядок та потім у Base64
    const dataString = JSON.stringify(dataObj);
    const data = Base64.stringify(Utf8.parse(dataString));

    // Створюємо підпис
    const hash = SHA1(PRIVATE_KEY + data + PRIVATE_KEY);
    const signature = Base64.stringify(hash);

    const paymentForm = `
      <form id="paymentForm" method="POST" action="https://www.liqpay.ua/api/3/checkout" accept-charset="utf-8">
        <input type="hidden" name="data" value='${data}' />
        <input type="hidden" name="signature" value='${signature}' />
        <input type="image" src="//static.liqpay.ua/buttons/payUk.png"/>
      </form>
      <script>
        document.addEventListener("DOMContentLoaded", function() {
        const paymentForm = document.getElementById("paymentForm");
            try {
              paymentForm.submit();
            }
            catch (error) {
              console.error('Помилка під час відправлення форми:', error);
              alert('Помилка відправки форми. Будь ласка, спробуйте повторити.');
            }
            finally {
              paymentForm.reset();
            }   
        });
      </script>
    `;

    res.send(paymentForm);

    // Отримання JWT токена від Uspacy
    const authOptions = {
      method: 'POST',
      url: 'https://yedyni.uspacy.ua/auth/v1/auth/sign_in',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      data: { email: USPACY_LOGIN, password: USPACY_PASS }
    };

    const authResponse = await axios(authOptions);
    const jwt = authResponse.data.jwt;

    // Створення контакту в Uspacy
    const createContactOptions = {
      method: 'POST',
      url: 'https://yedyni.uspacy.ua/crm/v1/entities/contacts',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${jwt}`
      },
      data: {
        title: `${last_name} ${first_name}`,
        first_name,
        last_name,
        email: [{ value: email }],
        phone: [{ value: phone }],
        registration: ["kurs_proukrayinska_new"]
      }
    };

    const createContactResponse = await axios(createContactOptions);
    const contactUspacyId = createContactResponse.data.id;

    // Створення угоди для контакту в Uspacy
    const createDealOptions = {
      method: 'POST',
      url: 'https://yedyni.uspacy.ua/crm/v1/entities/deals',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${jwt}`
      },
      data: {
        title: "Проукраїнська",
        funnel_id: 7,
        amount_of_the_deal: {currency: "UAH", value: course.amount},
        contacts: [contactUspacyId],
        hvilya: course.wave
      }
    };

    const createDealResponse = await axios(createDealOptions);
    const dealUspacyId = createDealResponse.data.id;

    // Збереження в локальній базі id контакту та угоди
    await Client.findByIdAndUpdate(newClient._id, {contactUspacyId, dealUspacyId});
    console.log('Створено угоду "Проукраїнська"', `${last_name} ${first_name}`);

  } catch (error) {
    if (error.response) {
        // Логування повної відповіді помилки, якщо вона є
        console.error('Error during the process:', error.message, error.response.data);
        res.status(error.response.status).json({ success: false, message: error.response.data.message || 'Помилка при обробці запиту' });
      } else {
        // Логування помилки без відповіді
        console.error('Error during the process:', error.message);
        res.status(500).json({ success: false, message: 'Помилка при обробці запиту' });
      }
  }
};

const processesClient = async (req, res) => {
  const {data, signature} = req.body;
  const hash = SHA1(PRIVATE_KEY + data + PRIVATE_KEY);
  const sign = Base64.stringify(hash);

  if (sign !== signature) {
    throw HttpError(400, "Несправжня відповідь LiqPay");
  }

  const dataString = Utf8.stringify(Base64.parse(data));
  const result = JSON.parse(dataString);

  const { status, customer } = result;

  if (status === 'success') {

    try {
      const client = await Client.findByIdAndUpdate(
        customer, 
        { payment: result },
        { new: true }
      );

      const course = courses.find(elem => elem.title === client.product);

      // Отримання JWT токена від Uspacy
      const authOptions = {
        method: 'POST',
        url: 'https://yedyni.uspacy.ua/auth/v1/auth/sign_in',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        data: { email: USPACY_LOGIN, password: USPACY_PASS }
      };

      const authResponse = await axios(authOptions);
      const jwt = authResponse.data.jwt;

      // Відправка привітального листа
      const welcomeEmail = {
        to: [{ email: client.email }],
        subject: "Вітаємо на курсі!",
        html: `
          <p>${client.first_name}, дякуємо за реєстрацію на курс і фінансову підтримку Руху "Єдині"!</p> 
          <p>Внесена Вами грошова пожертва в розмірі ${course.amount} грн піде на розвиток проєкту і створення масових безоплатних курсів з освітньої та психологічної підтримки в переході на українську мову.</p>
          <p>Наступний крок: приєднатися до нашого Telegram!</p> 
          <p>Просимо не поширювати це посилання серед осіб, не зареєстрованих на курс.</p>
          <p><a target="_blank" href="${course.canal}">Приєднатися до курсу</a></p>
          `
      };

      const isSendingEmail = await sendEmail(welcomeEmail);

       // Встановлення етапу в угоді Uspacy
      const stageId = isSendingEmail ? course.welcomeStageId : course.paymentStageId;

      // Встановлення етапу успішного завершення угоди в Uspacy
      // switch (client.product) {
      //   case "Курс для держслужбовців":
      //     stageId = 19;
      //     break;
      
      //   case "Видноколо":
      //     stageId = 22;
      //     break;

      //   case "Проукраїнська":
      //     stageId = 25;
      //     break;
      // }

      // const moveStageDealOptions = {
      //   method: 'POST',
      //   url: `https://yedyni.uspacy.ua/crm/v1/entities/deals/${dealUspacyId}/move/stage/${stageId}`,
      //   headers: {
      //     accept: 'application/json',
      //     'content-type': 'application/json',
      //     authorization: `Bearer ${jwt}`
      //   }
      // };

      const moveStageDealOptions = {
        method: 'POST',
        url: `https://yedyni.uspacy.ua/crm/v1/entities/deals/${client.dealUspacyId}/move/stage/${stageId}`,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${jwt}`
        }
      };

      await axios(moveStageDealOptions);

      // Отримання угоди з Uspacy
      const getDealOptions = {
        method: 'GET',
        url: `https://yedyni.uspacy.ua/crm/v1/entities/deals/${client.dealUspacyId}`,
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${jwt}`
        }
      };

      const getDealResponse = await axios(getDealOptions);
      const dealStatus = getDealResponse.data.kanban_status;

      console.log('Встановлено статус угоди', dealStatus);

    } catch (error) {
      if (error.response) {
        // Логування повної відповіді помилки, якщо вона є
        console.error('Error during the process:', error.message, error.response.data);
        res.status(error.response.status).json({ success: false, message: error.response.data.message || 'Помилка при обробці запиту' });
      } else {
        // Логування помилки без відповіді
        console.error('Error during the process:', error.message);
        res.status(500).json({ success: false, message: 'Помилка при обробці запиту' });
      }
    }
  }

  res.status(200).json({message: 'success'})
};

const getByIdClient = async (req, res) => {
  const {clientId} = req.params;
  const client = await Client.findById(clientId);

  if (!client) {
    throw HttpError (404, 'Не має даних')
  }

  if(!client.payment) {
    throw HttpError (404, 'Очікування проведення платежу')
  }

  const {status} = client.payment;

  if (status === "success") {
    res.json({ success: true, message: 'Платіж успішно проведено', product: client.product });
  } else {
    res.status(500).json({ success: false, message: 'Помилка при проведенні платежу' });
  }
};

const getServants = async (req, res) => {
  const result = await Client.find(
    { product: "Курс для держслужбовців" }, 
    "-_id -updatedAt"
  );
  
  if (!result || result.length === 0) {
    throw HttpError(404, 'Не знайдено даних');
  }

  res.json(result);
};

const getCreatives = async (req, res) => {
  const result = await Client.find(
    { product: "Видноколо" }, 
    "-_id -updatedAt"
  );
  
  if (!result || result.length === 0) {
    throw HttpError(404, 'Не знайдено даних');
  }

  res.json(result);
};

module.exports = {
    addServant: ctrlWrapper(addServant),
    addCreative: ctrlWrapper(addCreative),
    addProukrainian: ctrlWrapper(addProukrainian),
    processesClient: ctrlWrapper(processesClient),
    getByIdClient: ctrlWrapper(getByIdClient),
    getServants: ctrlWrapper(getServants),
    getCreatives: ctrlWrapper(getCreatives),
};