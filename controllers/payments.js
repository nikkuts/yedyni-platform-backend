const axios = require('axios');
const querystring = require('querystring');
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
const {BASE_CLIENT_URL, BASE_SERVER_URL, API_LIQPAY_ENDPOINT} = process.env;

const createPayment = async (req, res) => {
    const {_id} = req.user;
    const {amount, comment, subscribe} = req.body;
    const orderId = uuidv4();

    const dataObj = {
      public_key: PUBLIC_KEY, 
      version: '3',
      action: 'pay',
      amount: amount,
      currency: 'UAH',
      description: 'Підтримка проєкту "Єдині": безповоротний благодійний внесок',
      order_id: orderId,
      result_url: `${BASE_CLIENT_URL}/uk`,
      server_url: `${BASE_SERVER_URL}/api/payments/process`,
      customer: _id,
    };

    if (comment) {
      dataObj.info = comment;
    }

    if (subscribe) {
      const currentTimeUtc = new Date().toISOString();
      const formattedTimeUtc = currentTimeUtc.replace('T', ' ').substring(0, 19);
      dataObj.action = 'subscribe';
      dataObj.subscribe = subscribe;
      dataObj.subscribe_date_start = formattedTimeUtc;
      dataObj.subscribe_periodicity = 'month';
    }

    // Кодуємо дані JSON у рядок та потім у Base64
    const dataString = JSON.stringify(dataObj);
    const data = Base64.stringify(Utf8.parse(dataString));

    // Створюємо підпис
    const hash = SHA1(PRIVATE_KEY + data + PRIVATE_KEY);
    const signature = Base64.stringify(hash);

    res.json({
      data,
      signature,
    })
};

const cancelSubscribe = async (req, res) => {
    const {orderId} = req.body;

    const subscription = await Payment.findOne({
      'data.order_id': orderId,
      'data.status': 'subscribed',
    });

    if (!subscription) {
      throw HttpError(404, "Відсутні дані");
    }

    const unsubscribed = await Payment.findOne({
      'data.order_id': orderId,
      'data.status': 'unsubscribed',
    });
    
    if (unsubscribed) {
      throw HttpError(409, "Підписку вже скасовано");
    } 

    const dataObj = {
      public_key: PUBLIC_KEY, 
      version: '3',
      action: 'unsubscribe',
      order_id: orderId,
    };

    // Кодуємо дані JSON у рядок та потім у Base64
    const dataString = JSON.stringify(dataObj);
    const data = Base64.stringify(Utf8.parse(dataString));

    // Створюємо підпис
    const hash = SHA1(PRIVATE_KEY + data + PRIVATE_KEY);
    const signature = Base64.stringify(hash);

    // Встановлюємо для даних очікуваний формат
    const params = querystring.stringify({ data, signature });

    try {
      await axios.post(API_LIQPAY_ENDPOINT, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      res.json({ success: true, message: 'Підписку успішно скасовано', orderId });
    } 
    catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Помилка при скасуванні підписки' });
    }
};

const processesPayment = async (req, res) => {
    let subscribedUserId = '';
    const {data, signature} = req.body;
    const hash = SHA1(PRIVATE_KEY + data + PRIVATE_KEY);
    const sign = Base64.stringify(hash);

    if (sign !== signature) {
      throw HttpError(400, "Несправжня відповідь LiqPay");
    }

    const dataString = Utf8.stringify(Base64.parse(data));
    const result = JSON.parse(dataString);

    const {order_id, action, status, customer, amount, end_date} = result;
    const payment = await Payment.findOne({
      'data.order_id': order_id,
      'data.action': action,
      'data.status': status,
    });

    if (payment) {
      throw HttpError(301, "Платіж вже існує");
    }

    const newPayment = await Payment.create({data: result});
    
    if (action === 'regular' && status === 'success') {     
      const payment = await Payment.findOneAndUpdate({
        'data.order_id': order_id,
        'data.action': 'subscribe',
        'data.status': 'subscribed',
      },
      { $set: { 'objSub.lastPaymentDate': end_date } },
      { new: true }
      );

      subscribedUserId = payment.data.customer;
    }

    if (status === 'unsubscribed') {
      await Payment.findOneAndUpdate({
        'data.order_id': order_id,
        'data.action': 'subscribe',
        'data.status': 'subscribed',
      }, 
      { $set: { 'objSub.isUnsubscribe': true } }
      );
    }

    const userId = customer || subscribedUserId;

    if (status === 'success') {
      const user = await User.findByIdAndUpdate(userId, {
        $push: { donats: newPayment._id } 
      },
        { new: true }
      );

      const ukrainianMark = user.ukrainianMark += amount;

      await User.findByIdAndUpdate(userId, {
        $set: { ukrainianMark },  
          $push: {
            historyUkrainianMark: {
              points: amount,
              comment: "донат",
              finalValue: ukrainianMark,
            }
          }
      });
    }

    res.status(200).json({
      message: 'success',
  })
};

module.exports = {
    createPayment: ctrlWrapper(createPayment),
    cancelSubscribe: ctrlWrapper(cancelSubscribe),
    processesPayment: ctrlWrapper(processesPayment),
};