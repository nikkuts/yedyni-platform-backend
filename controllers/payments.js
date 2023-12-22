const Base64 = require('crypto-js/enc-base64');
const SHA1 = require('crypto-js/sha1');
const Utf8 = require('crypto-js/enc-utf8');
const { v4: uuidv4 } = require('uuid');
const {User} = require('../models/user');
const {Payment} = require('../models/payment');
const {HttpError, ctrlWrapper} = require('../helpers');
require('dotenv').config();

const PUBLIC_KEY = process.env.PUBLIC_KEY_TEST;
const PRIVATE_KEY = process.env.PRIVATE_KEY_TEST;
const {BASE_CLIENT_URL, BASE_SERVER_URL} = process.env;

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
      result_url: BASE_CLIENT_URL,
      server_url: `${BASE_SERVER_URL}/api/payments/process`,
      customer: _id,
    });
    const data = Base64.stringify(Utf8.parse(dataString));

    // Створюємо підпис
    const hash = SHA1(PRIVATE_KEY + data + PRIVATE_KEY);
    const signature = Base64.stringify(hash);
console.log(data);
    res.json({
      data,
      signature,
    })
};

const processesPayment = async (req, res) => {
    const {data, signature} = req.body;
    const hash = SHA1(PRIVATE_KEY + data + PRIVATE_KEY);
    const sign = Base64.stringify(hash);

    if (sign !== signature) {
      throw HttpError(400, "Несправжня відповідь LiqPay");
    }

    const dataString = Utf8.stringify(Base64.parse(data));
    const result = JSON.parse(dataString);

    const {order_id, status, customer} = result;
    const payment = await Payment.findOne({'data.order_id': order_id});

    if (payment) {
      throw HttpError(409, "Платіж вже існує");
    } 
    
    const newPayment = await Payment.create({data: result});

    if (status === 'success') {
      await User.findByIdAndUpdate(
        customer, 
        { $push: { donats: newPayment._id } },
        { new: true }
      );
    }

    res.status(200).json({
      message: 'success',
  })
};

module.exports = {
    createPayment: ctrlWrapper(createPayment),
    processesPayment: ctrlWrapper(processesPayment),
};