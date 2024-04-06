const axios = require('axios');
const querystring = require('querystring');
const Base64 = require('crypto-js/enc-base64');
const SHA1 = require('crypto-js/sha1');
const Utf8 = require('crypto-js/enc-utf8');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const { Servants } = require('../models/servant');
const {ctrlWrapper} = require('../helpers');

const PUBLIC_KEY = process.env.PUBLIC_KEY_TEST;
const PRIVATE_KEY = process.env.PRIVATE_KEY_TEST;
const BASE_SERVER_URL = process.env.BASE_SERVER_URL;

const addServant = async (req, res) => {
  const {firstname, lastname, email, phone, exam} = req.body;
  console.log(firstname, lastname, email, phone, exam);

  const newServant = await Servants.create({
    firstname, lastname, email, phone, exam
  });

  const orderId = uuidv4();

    const dataObj = {
      public_key: PUBLIC_KEY, 
      version: '3',
      action: 'pay',
      amount: 900,
      currency: 'UAH',
      description: 'Донат за курс для держслужбовців',
      order_id: orderId,
      result_url: "https://yedyni.org/",
      server_url: `${BASE_SERVER_URL}/api/servants/process`,
      customer: newServant._id,
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

const getServants = async (req, res) => {
  
};

module.exports = {
    getServants: ctrlWrapper(getServants),
    addServant: ctrlWrapper(addServant),
};

// res.status(201).json({
//   message: 'Дані збережено',
// });