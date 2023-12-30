const Base64 = require('crypto-js/enc-base64');
const SHA1 = require('crypto-js/sha1');
const Utf8 = require('crypto-js/enc-utf8');
const { v4: uuidv4 } = require('uuid');
const {User} = require('../models/user');
const {Payment} = require('../models/payment');
const {HttpError, ctrlWrapper} = require('../helpers');
const levelSupport = require('../helpers/levelSupport');
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
      action: 'pay',
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

    res.json({
      data,
      signature,
    })
};

const distributesBonuses = async (id, amount) => {
  const MAIN_ID = process.env.MAIN_ID; 
  let bonus = amount * 0.45;
  let inviterId = id;
  let userId;
  let bonusAccount;
  let level;

  for (let i = 1; i <= 8; i += 1) {       
      do {
          const user = await User.findById(inviterId);
          userId = user._id.toString();

          if (userId === MAIN_ID) {
              bonusAccount = user.bonusAccount + bonus;
              await User.findByIdAndUpdate(userId, {bonusAccount});
              break;
          }

          inviterId = user.inviter;
          bonusAccount = user.bonusAccount;
          level = parseFloat(levelSupport(user));
      } while (level < i);

      if (userId === MAIN_ID) {
          return { success: true, message: 'Main user reached' };
      }

      bonusAccount = i === 1 
          ? bonusAccount + amount * 0.1
          : bonusAccount + amount * 0.05;
          
      await User.findByIdAndUpdate(userId, {bonusAccount});
      bonus = bonus - bonusAccount;

      if (bonus <= 0) {
          return { success: true, message: 'Bonus distribution completed' };
      }
  };
  return { success: false, message: 'Bonus distribution not completed' };
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

    const {order_id, status, amount, customer} = result;
    const payment = await Payment.findOne({'data.order_id': order_id});

    if (payment) {
      throw HttpError(409, "Платіж вже існує");
    } 
    
    const newPayment = await Payment.create({data: result});

    if (status === 'success') {
      const user = await User.findByIdAndUpdate(
        customer, 
        { $push: { donats: newPayment._id } },
        { new: true }
      );

      await distributesBonuses (user.inviter, amount);
    }

    res.status(200).json({
      message: 'success',
  })
};

module.exports = {
    createPayment: ctrlWrapper(createPayment),
    processesPayment: ctrlWrapper(processesPayment),
};