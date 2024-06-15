const axios = require('axios');
const querystring = require('querystring');
const Base64 = require('crypto-js/enc-base64');
const SHA1 = require('crypto-js/sha1');
const Utf8 = require('crypto-js/enc-utf8');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const { Client } = require('../models/client');
const {ctrlWrapper, HttpError, sendEmail} = require('../helpers');

const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BASE_SERVER_URL = process.env.BASE_SERVER_URL;
const {USPACY_LOGIN, USPACY_PASS} = process.env;

const addServant = async (req, res) => {
  const {fio, email, phone} = req.body;

  try {
    const newClient = await Client.create({
      name: fio, 
      email,
      phone,
      product: "Курс з підготовки до держіспиту",
    });

    const orderId = uuidv4();

      const dataObj = {
        public_key: PUBLIC_KEY, 
        version: '3',
        action: 'pay',
        amount: 950,
        currency: 'UAH',
        description: `${newClient.name} Донат за Курс з підготовки до держіспиту`,
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
        title: fio,
        first_name: fio,
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
        amount_of_the_deal: {currency: "UAH", value: "950"},
        contacts: [contactUspacyId]
      }
    };

    const createDealResponse = await axios(createDealOptions);
    const dealUspacyId = createDealResponse.data.id;

    // Збереження в локальній базі id контакту та угоди
    await Client.findByIdAndUpdate(newClient._id, {contactUspacyId, dealUspacyId});
    console.log('Створено угоду "Курс з підготовки до держіспиту"', fio);

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
  const {fio, email, phone} = req.body;

  try {
    const newClient = await Client.create({
      name: fio, 
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
        description: `${newClient.name} Донат за Курс "Видноколо"`,
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
        title: fio,
        first_name: fio,
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
        amount_of_the_deal: {currency: "UAH", value: "750"},
        contacts: [contactUspacyId]
      }
    };

    const createDealResponse = await axios(createDealOptions);
    const dealUspacyId = createDealResponse.data.id;

    // Збереження в локальній базі id контакту та угоди
    await Client.findByIdAndUpdate(newClient._id, {contactUspacyId, dealUspacyId});
    console.log('Створено угоду "Видноколо"', fio);

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

  const {order_id, action, status, customer, amount, end_date} = result;

  try {
    if (status === 'success') {
      const client = await Client.findByIdAndUpdate(
        customer, 
        { payment: result },
        { new: true }
      );

      // const welcomeEmail = {
      //   to: client.email,
      //   subject: 'Реєстрація на курс руху "Єдині"',
      //   html: `
      //   <h1>Дякуємо за реєстрацію на курс і фінансову підтримку Руху "Єдині"!</h1>
      //   <p>Внесена Вами грошова пожертва в розмірі 900 грн піде на розвиток проєкту і створення масових безоплатних курсів з освітньої та психологічної підтримки в переході на українську мову.</p>
      //   <p>Наступний крок: приєднатися до нашого Telegram!</p>
      //   <p>Просимо не поширювати це посилання серед осіб, незареєстрованих на курс.</p>
      //   <a target="_blank" href="https://t.me/+s_ebd987jWA1MTQy">Приєднатися до курсу</a>
      //   `
      // };

      // await sendEmail(welcomeEmail);
    }

    res.status(200).json({
      message: 'success',
    })

    // Отримання JWT токена від Uspacy
    const authOptions = {
      method: 'POST',
      url: 'https://yedyni.uspacy.ua/auth/v1/auth/sign_in',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      data: { email: USPACY_LOGIN, password: USPACY_PASS }
    };

    const authResponse = await axios(authOptions);
    const jwt = authResponse.data.jwt;

    // Редагування угоди в Uspacy
    const editDealOptions = {
      method: 'PATCH',
      url: `https://yedyni.uspacy.ua/crm/v1/entities/deals/${client.dealUspacyId}`,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${jwt}`
      },
      data: {
        kanban_status: ["SUCCESS"]
      }
    };

    const editDealResponse = await axios(editDealOptions);
    const dealStatus = editDealResponse.data.kanban_status;

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
    processesClient: ctrlWrapper(processesClient),
    getByIdClient: ctrlWrapper(getByIdClient),
    getServants: ctrlWrapper(getServants),
    getCreatives: ctrlWrapper(getCreatives),
};

// res.status(201).json({
//   message: 'Дані збережено',
// });