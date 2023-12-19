const Base64 = require('crypto-js/enc-base64');
const SHA1 = require('crypto-js/sha1');
const enc = require('crypto-js/enc-utf8');
const { v4: uuidv4 } = require('uuid');
const {HttpError, ctrlWrapper} = require('../helpers');
require('dotenv').config();

const PUBLIC_KEY = process.env.PUBLIC_KEY_TEST;
const PRIVATE_KEY = process.env.PRIVATE_KEY_TEST;

const createPayment = async (req, res) => {
    const {_id} = req.user;
    const {amount} = req.body;
    const orderId = uuidv4();

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
      customer: _id,
    });
    const data = Base64.stringify(enc.parse(dataString));

    // Створюємо підпис
    const hash = SHA1(PRIVATE_KEY + data + PRIVATE_KEY);
    const signature = Base64.stringify(hash);

    res.json({
      data,
      signature,
    })
};

const processesPayment = async (req, res) => {
 
    // const {customer} = req.body;

    await User.findByIdAndUpdate(
      '658195c33c93a3e6b1952e8b', 
      { $push: { donats: req.body } },
      { new: true }
    );
};

module.exports = {
    createPayment: ctrlWrapper(createPayment),
    processesPayment: ctrlWrapper(processesPayment),
};