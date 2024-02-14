const axios = require('axios');
const querystring = require('querystring');
const Base64 = require('crypto-js/enc-base64');
const SHA1 = require('crypto-js/sha1');
const Utf8 = require('crypto-js/enc-utf8');
const { v4: uuidv4 } = require('uuid');
const {User} = require('../models/user');
const {Payment} = require('../models/payment');
const {HttpError, ctrlWrapper, handleIndicators} = require('../helpers');
require('dotenv').config();

const PUBLIC_KEY = process.env.PUBLIC_KEY_TEST;
const PRIVATE_KEY = process.env.PRIVATE_KEY_TEST;
const {BASE_CLIENT_URL, BASE_SERVER_URL, API_LIQPAY_ENDPOINT} = process.env;
const MAIN_ID = process.env.MAIN_ID;

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
      result_url: BASE_CLIENT_URL,
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

      res.json({ success: true, message: 'Підписку успішно скасовано' });
    } 
    catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Помилка при скасуванні підписки' });
    }
};

const distributesBonuses = async ({id, email, amount, paymentId}) => {
  let inviterId = id;
  let bonus = amount * 0.45;
  let bonusAccount;
  let historyBonusAccount;
  let userId;
  let levelPartner = 0;
  let levelBonus;
  let levelSupport;
  let fee;

  for (let i = 1; i <= 8; i += 1) {
    levelBonus = i;       
      do {
          const user = await User.findById(inviterId)
          .populate('donats', 'data.amount');
        
          userId = user._id.toString();
          bonusAccount = user.bonusAccount;
          historyBonusAccount = {
            initialBalance: user.bonusAccount,
            comment: "бонус",
            levelBonus,
            emailPartner: email,
          };

          inviterId = user.inviter;
          levelPartner += 1;
          levelSupport = handleIndicators(user).levelSupport;

          if (userId === MAIN_ID) {
              bonusAccount += bonus;

              await User.findByIdAndUpdate(MAIN_ID, {
                $set: {bonusAccount}, 
                $push: {
                  historyBonusAccount: {
                    ...historyBonusAccount,
                  finalBalance: bonusAccount,
                  amountTransaction: bonus,
                  }
                }
              });
              
              await Payment.findByIdAndUpdate(paymentId, { 
                $push: { 
                  fees: {
                    userId,
                    levelPartner,
                    levelBonus,
                    levelSupport,
                    fee: bonus,
                  } 
                } 
              });
              return console.log({ success: true, message: 'Головний акаунт досягнуто' });
          }
      } while (levelSupport < i);

      fee = i === 1 
          ? amount * 0.1
          : amount * 0.05;

      bonusAccount += fee;
          
      await User.findByIdAndUpdate(userId, {
        $set: {bonusAccount}, 
          $push: {
            historyBonusAccount: {
              ...historyBonusAccount,
              finalBalance: bonusAccount,
              amountTransaction: fee,
            }
          }
        });

      bonus = bonus - fee;

      await Payment.findByIdAndUpdate(paymentId, { 
        $push: { 
          fees: {
            userId,
            levelPartner,
            levelBonus,
            levelSupport,
            fee,
          } 
        } 
      });

      if (bonus === 0) {
          return console.log({ success: true, message: 'Бонус повністю розподілено' });
      }
      if (bonus < 0) {
        return console.log({ success: false, message: 'Розподілено більше допустимої суми бонусу' });
      }
  };
  console.log({ success: false, message: 'Бонус не було розподілено' });
  throw HttpError(409, "Бонус не було розподілено");
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
    
    // if (action === 'regular') {
    //   const filter = {
    //     'data.order_id': order_id,
    //     'data.action': 'subscribe',
    //     'data.status': 'subscribed',
    //   };

    //   const update = { 
    //     $push: { 'subscription.regular': newPayment._id },
    //     $set: { 'subscription.dateLastPayment': end_date }, 
    //   };

    //   const options = {
    //     new: true, 
    //   };
      
    //   const payment = await Payment.findOneAndUpdate(filter, update, options);
    //   subscribedUserId = payment.data.customer;
    // }

    // if (status === 'unsubscribed') {
    //   await Payment.findOneAndUpdate({
    //     'data.order_id': order_id,
    //     'data.action': 'subscribe',
    //     'data.status': 'subscribed',
    //   }, 
    //   { $set: { 'subscription.status': "cancelled" } }
    //   );
    // }

    // const userId = customer || subscribedUserId;
    
    // if (status === 'subscribed') {
    //   await User.findByIdAndUpdate(
    //     userId, 
    //     { $push: { subscriptions: newPayment._id } }
    //   );
    // }

    if (action === 'regular') {
      const filter = {
        subscriptions: { // Фільтр для підмасиву subscriptions
          $elemMatch: { // Пошук об'єкта, що містить вказаний order_id
              'objSub.data.order_id': order_id
          }
        }
      };

      const update = { 
        $push: { 'subscriptions.$.regularPayments': newPayment._id },
        $set: { 'subscriptions.$.lastPaymentDate': end_date }, 
      };

      const options = {
        new: true, 
      };
      
      const user = await User.findOneAndUpdate(filter, update, options);
      subscribedUserId = user._id;
    }

    const userId = customer || subscribedUserId;

    if (status === 'unsubscribed') {
      await User.findOneAndUpdate({
        _id: customer,
        subscriptions: { 
          $elemMatch: { 
              'objSub.data.order_id': order_id
          }
        }
      }, 
      { $set: { 
          'subscriptions.$.isUnsubscribe': true 
        } 
      });
    }
    
    if (status === 'subscribed') {
      await User.findByIdAndUpdate(
        customer, 
        { $push: { subscriptions: {objSub: newPayment._id} } }
      );
    }

    if (status === 'success') {
      const user = await User.findByIdAndUpdate(
        userId, 
        { $push: { donats: newPayment._id } },
        { new: true }
      );

      if (userId !== MAIN_ID) {
        await distributesBonuses ({
          id: user.inviter, 
          email: user.email, 
          amount,
          paymentId: newPayment._id.toString(),
        });
      }
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


// const distributesBonuses = async (id, amount) => {
//   let inviterId = id; 
//   let bonus = amount * 0.45;
//   let userId;
//   let bonusAccount;
//   let level;
//   let fee;

//   for (let i = 1; i <= 8; i += 1) {       
//       do {
//           const user = await User.findById(inviterId)
//           .populate('donats', 'data.amount');
        
//           userId = user._id.toString();

//           if (userId === MAIN_ID) {
//               bonusAccount = user.bonusAccount + bonus;
//               await User.findByIdAndUpdate(MAIN_ID, {bonusAccount});
//               return console.log({ success: true, message: 'Головний акаунт досягнуто' });
//           }

//           inviterId = user.inviter;
//           bonusAccount = user.bonusAccount;
//           level = levelSupport(user);
//       } while (level < i);

//       fee = i === 1 
//           ? amount * 0.1
//           : amount * 0.05;

//           bonusAccount = bonusAccount + fee;
          
//       await User.findByIdAndUpdate(userId, {bonusAccount});
//       bonus = bonus - fee;

//       if (bonus === 0) {
//           return console.log({ success: true, message: 'Бонус повністю розподілено' });
//       }
//       if (bonus < 0) {
//         return console.log({ success: false, message: 'Розподілено більше допустимої суми бонусу' });
//       }
//   };
//   return console.log({ success: false, message: 'Бонус не було розподілено' });
// };