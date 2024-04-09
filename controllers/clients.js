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

const addServant = async (req, res) => {
  const {fio, mail, phone} = req.body;

  const newClient = await Client.create({
    name: fio, 
    email: mail,
    phone,
    product: "Курс для держслужбовців",
  });

  const orderId = uuidv4();

    const dataObj = {
      public_key: PUBLIC_KEY, 
      version: '3',
      action: 'pay',
      amount: 900,
      currency: 'UAH',
      description: `${newClient.name} Донат за Курс для держслужбовців`,
      order_id: orderId,
      result_url: `https://yedyni.org/testpayment?servant_id=${newClient._id}`,
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

  if (status === 'success') {
    const client = await Client.findByIdAndUpdate(
      customer, 
      { payment: result },
      { new: true }
    );

    // const obj = {
    //   name: client.name,
    //   email: client.email,
    // }

    // try {
    //   const result = await axios.post("https://script.google.com/macros/s/AKfycbwCCdeuGmMgOo86s_0ybq93uqP0e3bOT_hy0CVzepc5qxdjGr9KYUErPk1nfbfT13oCtw/exec", obj);
    //   console.log(result.data);
    // } 
    // catch (error) {
    //   console.error(error.message);
    // }

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
};

const getByIdServant = async (req, res) => {
  const {servantId} = req.params;
  const servant = await Client.findById(servantId);

  if (!servant) {
    throw HttpError (404, 'Не має даних')
  }

  if(!servant.payment) {
    throw HttpError (404, 'Очікування проведення платежу')
  }

  const {status} = servant.payment;

  if (status === "success") {
    res.json({ success: true, message: 'Платіж успішно проведено', servantId });
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

module.exports = {
    addServant: ctrlWrapper(addServant),
    processesClient: ctrlWrapper(processesClient),
    getByIdServant: ctrlWrapper(getByIdServant),
    getServants: ctrlWrapper(getServants),
};

// res.status(201).json({
//   message: 'Дані збережено',
// });