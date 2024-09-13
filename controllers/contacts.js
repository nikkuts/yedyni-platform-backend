const Base64 = require('crypto-js/enc-base64');
const SHA1 = require('crypto-js/sha1');
const Utf8 = require('crypto-js/enc-utf8');
const { Deal } = require('../models/deal');
const { Donat } = require('../models/donat');
const {ctrlWrapper, HttpError, sendEmail} = require('../helpers');
const handleContactDB = require('../helpers/handleContactDB');
const {createPaymentForm, createDonatForm} = require('../helpers/createPaymentForm');
const handleContactUspacy = require('../helpers/handleContactUspacy');
const {authUspacy, moveStageDealUspacy} = require('../utils');
const courses = require('../utils/courses.json');
require('dotenv').config();

const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const addServant = async (req, res) => {
  const {first_name, last_name, email, phone, promo_code} = req.body;
  const user = {first_name, last_name, email, phone};
  const course = courses.find(elem => elem.title === 'Курс з підготовки до держіспиту');

  const promokod = promo_code && promo_code.trim() === course.promoCode ? promo_code.trim() : null;

  const amountDeal = promokod ? 
    950 
    : course.amount;

  const { 
    contactId, 
    contactUspacyId, 
    dealId, 
    dealUspacyId, 
    arrayRegistration,
    redirectUrl,
  } = await handleContactDB({user, course, promokod});

  if (!redirectUrl) {
    const paymentForm = await createPaymentForm({
      PUBLIC_KEY,
      PRIVATE_KEY,
      user, 
      course, 
      dealId,
      amountDeal,
    });

    res.send(paymentForm);

    await handleContactUspacy({
      user,
      course,
      contactId, 
      contactUspacyId, 
      dealId, 
      dealUspacyId, 
      arrayRegistration,
      promokod,
      amountDeal,
    })
  } else {
    res.redirect(redirectUrl);
  }
};

const addCreative = async (req, res) => {
  const {first_name, last_name, email, phone, promo_code} = req.body;
  const user = {first_name, last_name, email, phone};
  const course = courses.find(elem => elem.title === 'Видноколо');

  const promokod = promo_code && promo_code.trim() === course.promoCode ? promo_code.trim() : null;

  const amountDeal = promokod ? 
    (1 - course.discountPercentage / 100) * course.amount 
    : course.amount;

  const { 
    contactId, 
    contactUspacyId, 
    dealId, 
    dealUspacyId, 
    arrayRegistration,
    redirectUrl,
  } = await handleContactDB({user, course, promokod});

  if (!redirectUrl) {
    // const paymentForm = await createPaymentForm({
    //   PUBLIC_KEY,
    //   PRIVATE_KEY,
    //   user, 
    //   course, 
    //   dealId,
    //   amountDeal,
    // });
    
    // res.send(paymentForm);

    await handleContactUspacy({
      user,
      course,
      contactId, 
      contactUspacyId, 
      dealId, 
      dealUspacyId, 
      arrayRegistration,
      promokod,
      amountDeal,
    })

    res.status(201).json({
      message: 'success',
    });
  } else {
    res.redirect(redirectUrl);
  }
};

const addProukrainian = async (req, res) => {
  const {first_name, last_name, email, phone, promo_code} = req.body;
  const user = {first_name, last_name, email, phone};
  const course = courses.find(elem => elem.title === 'Проукраїнська');

  const promokod = promo_code && promo_code.trim() === course.promoCode ? promo_code.trim() : null;

  const amountDeal = promokod ? 
    (1 - course.discountPercentage / 100) * course.amount 
    : course.amount;

  const { 
    contactId, 
    contactUspacyId, 
    dealId, 
    dealUspacyId, 
    arrayRegistration,
    redirectUrl,
  } = await handleContactDB({user, course, promokod});

  if (!redirectUrl) {
    // const paymentForm = await createPaymentForm({
    //   PUBLIC_KEY,
    //   PRIVATE_KEY,
    //   user, 
    //   course, 
    //   dealId,
    //   amountDeal,
    // });
    
    // res.send(paymentForm);

    await handleContactUspacy({
      user,
      course,
      contactId, 
      contactUspacyId, 
      dealId, 
      dealUspacyId, 
      arrayRegistration,
      promokod,
      amountDeal,
    })

    res.status(201).json({
      message: 'success',
    });
  } else {
    res.redirect(redirectUrl);
  }
};

const processesDeal = async (req, res) => {
  const {data, signature} = req.body;
  const hash = SHA1(PRIVATE_KEY + data + PRIVATE_KEY);
  const sign = Base64.stringify(hash);

  if (sign !== signature) {
    throw HttpError(400, "Несправжня відповідь LiqPay");
  }

  const dataString = Utf8.stringify(Base64.parse(data));
  const result = JSON.parse(dataString);

  const { status, customer, amount, description } = result;

  if (status === 'success') {

    try {
      const deal = await Deal.findByIdAndUpdate(customer, { payment: result }, { new: true })
        .populate("contact", "first_name email");

      const course = courses.find(elem => elem.title === deal.title);

      // Відправка привітального листа
      const welcomeEmail = {
        to: [{ email: deal.contact.email }],
        subject: "Вітаємо на курсі від Руху «Єдині»!",
        html: `
          <p>Дякуємо за реєстрацію на курс і фінансову підтримку Руху "Єдині"!</p> 
          <p>Внесена Вами грошова пожертва в розмірі ${amount} грн піде на розвиток проєкту і створення масових безоплатних курсів з освітньої та психологічної підтримки в переході на українську мову.</p>
          <p>Наступний крок: приєднатися до нашого <a target="_blank" href="${course.canal}">Telegram</a> каналу! Наші модератори вже з нетерпінням чекають на Вас!</p>
          <p>Просимо не поширювати це посилання серед осіб, не зареєстрованих на курс.</p>
          <p>Дякуємо, що Ви з нами!</p>
          <p>Ваша спільнота однодумців, Всеукраїнський Рух «Єдині»</p>
          `
      };

      const isSendingEmail = await sendEmail(welcomeEmail);

      // Отримання JWT токена від Uspacy
      const jwt = await authUspacy();

      // Встановлення етапу в угоді Uspacy
      await moveStageDealUspacy({
        token: jwt,
        dealId: deal.dealUspacyId,
        stageId: isSendingEmail ? course.welcomeStageId : course.paymentStageId,
      })

      console.log(`Успішна обробка платежу ${description}`);

    } catch (error) {
      console.error(error)
    }
  } else {
    console.log('Неуспішний платіж', result);
  }

  res.status(200).json({message: 'success'})
};

const getByIdDeal = async (req, res) => {
  const {dealId} = req.params;
  const deal = await Deal.findById(dealId);

  if (!deal) {
    throw HttpError (404, 'Не має даних')
  }

  if(!deal.payment) {
    throw HttpError (404, 'Очікування проведення платежу')
  }

  const {status} = deal.payment;

  if (status === "success") {
    res.json({ success: true, message: 'Платіж успішно проведено', product: deal.title });
  } else {
    res.status(500).json({ success: false, message: 'Помилка при проведенні платежу' });
  }
};

const addTransition = async (req, res) => {
  const user = req.body;
  const course = courses.find(elem => elem.title === 'Курс переходу');

  const { 
    contactId, 
    contactUspacyId, 
    dealId, 
    dealUspacyId, 
    arrayRegistration
  } = await handleContactDB({user, course});

  await handleContactUspacy({
    user,
    course,
    contactId, 
    contactUspacyId, 
    dealId, 
    dealUspacyId, 
    arrayRegistration,
  });

  res.status(201).json({
    message: 'success',
  });
};

const addGrammatical = async (req, res) => {
  const user = req.body;
  const course = courses.find(elem => elem.title === 'Граматичний курс');

  const { 
    contactId, 
    contactUspacyId, 
    dealId, 
    dealUspacyId, 
    arrayRegistration
  } = await handleContactDB({user, course});

  await handleContactUspacy({
    user,
    course,
    contactId, 
    contactUspacyId, 
    dealId, 
    dealUspacyId, 
    arrayRegistration,
  });

  res.status(201).json({
    message: 'success',
  });
};

const addDonat = async (req, res) => {
  const {pay_type, paid} = req.body;
  const amount = parseFloat(paid);
  
  const donatForm = await createDonatForm({
    PUBLIC_KEY,
    PRIVATE_KEY,
    pay_type,
    amount,
  });
  
  res.send(donatForm);
};

const processesDonat = async (req, res) => {
  const {data, signature} = req.body;
  const hash = SHA1(PRIVATE_KEY + data + PRIVATE_KEY);
  const sign = Base64.stringify(hash);

  if (sign !== signature) {
    throw HttpError(400, "Несправжня відповідь LiqPay");
  }

  const dataString = Utf8.stringify(Base64.parse(data));
  const result = JSON.parse(dataString);

  await Donat.create({data: result});

  const { action, status } = result;

  if (action === 'pay' && status === 'success') {
    console.log('Успішний разовий платіж', result);
  } else if (action === 'regular' && status === 'success') {
    console.log('Успішний платіж по підписці', result);
  } else if (action === 'subscribe' && status === 'subscribed') {
    console.log('Створення підписки', result);
  } else {
    console.log('Неуспішний платіж', result);
  }

  res.status(200).json({message: 'success'})
};

const sendEmailContact = async (req, res) => {
  const payload = JSON.parse(req.body);
  const message = JSON.parse(payload.Message);
  const data = message.data;
  // console.log('data', data);
  const contacts = data.entity.contacts;
  console.log("Пов'язаний контакт", contacts[0]);
  res.status(200);
};

const editLead = async (req, res) => {
  const payload = JSON.parse(req.body);
  const message = JSON.parse(payload.Message);
  const data = message.data;
  console.log('data', data);

  res.status(201);
};

module.exports = {
    addServant: ctrlWrapper(addServant),
    addCreative: ctrlWrapper(addCreative),
    addProukrainian: ctrlWrapper(addProukrainian),
    processesDeal: ctrlWrapper(processesDeal),
    getByIdDeal: ctrlWrapper(getByIdDeal),
    addTransition: ctrlWrapper(addTransition),
    addGrammatical: ctrlWrapper(addGrammatical),
    addDonat: ctrlWrapper(addDonat),
    processesDonat: ctrlWrapper(processesDonat),
    sendEmailContact: ctrlWrapper(sendEmailContact),
    editLead: ctrlWrapper(editLead),
};