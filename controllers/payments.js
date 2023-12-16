const Base64 = require('crypto-js/enc-base64');
const SHA1 = require('crypto-js/sha1');
const enc = require('crypto-js/enc-utf8');
const { v4: uuidv4 } = require('uuid');
const {HttpError, ctrlWrapper} = require('../helpers');
require('dotenv').config();

const {PUBLIC_KEY, PRIVATE_KEY} = process.env;

const createPayment = async (req, res) => {
    const {amount, userId} = req.body;
    const orderId = uuidv4();
    const apiEndpoint = 'https://www.liqpay.ua/api/request';

    // Кодуємо дані JSON у рядок та потім у Base64
    const dataString = JSON.stringify({ 
      public_key: PUBLIC_KEY, 
      version: '3',
      action: 'paydonate',
      amount: amount,
      currency: 'UAH',
      description: 'Підтримка проєкту',
      order_id: orderId,
      result_url: 'https://nikkuts.github.io/bonus-programm-react/',
      server_url: 'https://bonus-programm-backend.onrender.com/api/payments/callback',
      customer: userId,
    });
    const data = Base64.stringify(enc.parse(dataString));

    // Створюємо підпис
    const hash = SHA1(PRIVATE_KEY + data + PRIVATE_KEY);
    const signature = Base64.stringify(hash);
    
    try {
        const liqpayResponse = await axios.post(apiEndpoint, {
          data: data,
          signature: signature,
        });
    console.log(liqpayResponse.data);
        // Надсилаємо відповідь клієнту
        res.json(liqpayResponse.data);
      } 
      catch (error) {
        console.error('Error sending request to LiqPay:', error.message);
        res.status(500).send('Internal Server Error');
      }
};

const processesPayment = async (req, res) => {
    console.log('processesPayment');
};

module.exports = {
    createPayment: ctrlWrapper(createPayment),
    processesPayment: ctrlWrapper(processesPayment),
};