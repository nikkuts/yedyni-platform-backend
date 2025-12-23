const Base64 = require('crypto-js/enc-base64');
const SHA1 = require('crypto-js/sha1');
const Utf8 = require('crypto-js/enc-utf8');
const { Course } = require('../models/course');
const { Deal } = require('../models/deal');
const { Donat } = require('../models/donat');
const { ctrlWrapper, HttpError } = require('../helpers');
const handleContactDB = require('../helpers/handleContactDB');
const handleContactUspacy = require('../helpers/handleContactUspacy');
const {createPaymentForm, createDonatForm} = require('../helpers/createPaymentForm');
const provideAccessToCourse = require('../helpers/provideAccessToCourse');
const { authUspacy, moveStageDealUspacy } = require('../utils');
const sendCourseEmail = require('../emails');
require('dotenv').config();

const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const registerContact = async (req, res) => {
  const { courseId } = req.params;
  const { first_name, last_name, phone, promo_code, mode } = req.body;

  if (!['pay', 'save'].includes(mode)) {
    throw HttpError(400, 'Invalid mode');
  }

  const email = req.body.email.trim().toLowerCase();
  const contactData = {first_name, last_name, email, phone};

  const course = await Course.findById(courseId);

  const promokod = promo_code && promo_code.trim() === course.promoCode ? promo_code.trim() : null;
  const amountDeal = promokod ? 2000 : course.amount;

  const { 
    contactId, 
    contactUspacyId, 
    dealId, 
    dealUspacyId, 
    arrayRegistration,
    redirectUrl,
  } = await handleContactDB({contactData, course, promokod});

  if (redirectUrl) {
    return res.redirect(redirectUrl);
  }

  const { currentDealUspacyId } = await handleContactUspacy({
    contactData,
    course,
    contactId, 
    contactUspacyId, 
    dealId, 
    dealUspacyId, 
    arrayRegistration,
    promokod,
    amountDeal,
  })

  if (mode === "pay") {
    const paymentForm = await createPaymentForm({
      PUBLIC_KEY,
      PRIVATE_KEY,
      dealUspacyId: currentDealUspacyId,
      amountDeal,
    });

    return res.send(paymentForm);
  }

  return res.redirect('https://yedyni.org/');
};

const resendPaymentForm = async (req, res) => {
  const { dealUspacyId, amountDeal } = req.query;

  const paymentForm = await createPaymentForm({
    PUBLIC_KEY,
    PRIVATE_KEY,
    dealUspacyId,
    amountDeal,
  });

  return res.send(paymentForm);
};

const addCreative = async (req, res) => {
  const { first_name, last_name, phone, promo_code } = req.body;
  const email = req.body.email.trim().toLowerCase();
  const contactData = {first_name, last_name, email, phone};

  const course = await Course.findOne({ title: 'Видноколо' });

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
  } = await handleContactDB({contactData, course, promokod});

  if (redirectUrl) {
    return res.redirect(redirectUrl);
  }

  await handleContactUspacy({
    contactData,
    course,
    contactId, 
    contactUspacyId, 
    dealId, 
    dealUspacyId, 
    arrayRegistration,
    promokod,
    amountDeal,
  })

  // const paymentForm = await createPaymentForm({
  //   PUBLIC_KEY,
  //   PRIVATE_KEY,
  //   contact: contactData, 
  //   course, 
  //   dealId,
  //   amountDeal,
  // });

  // res.send(paymentForm);

  res.redirect('https://yedyni.org/');
};

const addProukrainian = async (req, res) => {
  const { first_name, last_name, phone, promo_code } = req.body;
  const email = req.body.email.trim().toLowerCase();
  const contactData = {first_name, last_name, email, phone};

  const course = await Course.findOne({ title: 'Проукраїнська' });

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
  } = await handleContactDB({contactData, course, promokod});

  if (redirectUrl) {
    return res.redirect(redirectUrl);
  }

  await handleContactUspacy({
    contactData,
    course,
    contactId, 
    contactUspacyId, 
    dealId, 
    dealUspacyId, 
    arrayRegistration,
    promokod,
    amountDeal,
  })

  // const paymentForm = await createPaymentForm({
  //   PUBLIC_KEY,
  //   PRIVATE_KEY,
  //   contact: contactData, 
  //   course, 
  //   dealId,
  //   amountDeal,
  // });

  // res.send(paymentForm);

  res.redirect('https://yedyni.org/');
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

  const { status, order_id, amount, description } = result;
  const dealUspacyId = order_id;

  if (status === 'success') {
    await provideAccessToCourse(dealUspacyId, result);
    console.log(`✅ Успішна оплата ${amount} грн. ${description}`);
  } else {
    console.log('⚠️ Неуспішний платіж:', result);
  }

  res.status(200).json({message: 'success'})
};

const manualProcessesDeal = async (req, res) => {
  const { dealUspacyId } = req.body;
  const result = { status: "success" };
  await provideAccessToCourse(dealUspacyId, result);
  res.status(200).json({message: 'success'})
};

const getByIdDeal = async (req, res) => {
  const {dealId} = req.params;
  const deal = await Deal.findById(dealId)
  .populate('course', 'title'); 

  if (!deal) {
    throw HttpError (404, 'Не має даних')
  }

  if(!deal.payment) {
    throw HttpError (404, 'Очікування проведення платежу')
  }

  const {status} = deal.payment;

  if (status === "success") {
    res.json({ success: true, message: 'Платіж успішно проведено', product: deal.course.title });
  } else {
    res.status(500).json({ success: false, message: 'Помилка при проведенні платежу' });
  }
};

const addTransition = async (req, res) => {
  const contactData = req.body;
  contactData.email = contactData.email.trim().toLowerCase();

  const course = await Course.findOne({ title: 'Курс переходу' });

  const { 
    contactId, 
    contactUspacyId, 
    dealId, 
    dealUspacyId, 
    arrayRegistration
  } = await handleContactDB({contactData, course});

  await handleContactUspacy({
    contactData,
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
  const contactData = req.body;
  contactData.email = contactData.email.trim().toLowerCase();

  const course = await Course.findOne({ title: 'Граматичний курс' });

  const { 
    contactId, 
    contactUspacyId, 
    dealId, 
    dealUspacyId, 
    arrayRegistration
  } = await handleContactDB({contactData, course});

  await handleContactUspacy({
    contactData,
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
  registerContact: ctrlWrapper(registerContact),
  resendPaymentForm: ctrlWrapper(resendPaymentForm),
  addCreative: ctrlWrapper(addCreative),
  addProukrainian: ctrlWrapper(addProukrainian),
  processesDeal: ctrlWrapper(processesDeal),
  manualProcessesDeal: ctrlWrapper(manualProcessesDeal),
  getByIdDeal: ctrlWrapper(getByIdDeal),
  addTransition: ctrlWrapper(addTransition),
  addGrammatical: ctrlWrapper(addGrammatical),
  addDonat: ctrlWrapper(addDonat),
  processesDonat: ctrlWrapper(processesDonat),
  sendEmailContact: ctrlWrapper(sendEmailContact),
  editLead: ctrlWrapper(editLead),
};
