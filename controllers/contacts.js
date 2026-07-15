const Base64 = require('crypto-js/enc-base64');
const SHA1 = require('crypto-js/sha1');
const Utf8 = require('crypto-js/enc-utf8');
const { Course } = require('../models/course');
const { Contact } = require('../models/contact');
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
const BASE_CLIENT_URL = process.env.BASE_CLIENT_URL;

const registerContact = async (req, res) => {
  const token = req.body["cf-turnstile-response"];

  if (!token) {
      return res.status(400).json({
          message: "Captcha token is missing"
      });
  }

  const verifyResponse = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
          "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
      }),
    }
  );

  const verifyData = await verifyResponse.json();

  if (!verifyData.success) {
    return res.status(403).json({
        message: "Captcha verification failed",
    });
  }

  const { courseId } = req.params;
  const { first_name, last_name, phone, promo_code, mode } = req.body;

  if (!['pay', 'save'].includes(mode)) {
    throw HttpError(400, 'Invalid mode');
  }

  const email = req.body.email.trim().toLowerCase();
  const contactData = {first_name, last_name, email, phone};

  const course = await Course.findById(courseId);

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
  } = await handleContactDB({ contactData, course, promokod });
  
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

  return res.redirect(`${course.welcome}?canal=${course.canal}&courseId=${courseId}`);
};

const registerContactForm = async (req, res) => {
  const { courseId } = req.params;
  const contactData = req.body;
  contactData.email = contactData.email.trim().toLowerCase();

  const course = await Course.findById(courseId);

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
    message: "success",
  });
};

const getRegisterUrl = async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({
            message: "Email is required",
        });
    }

    const contact = await Contact.findOne({ email })
        .sort({ createdAt: -1 });

    if (!contact) {
        return res.status(404).json({
            message: "Contact not found",
        });
    }

  return res.json({
      registerUrl: `${BASE_CLIENT_URL}/register?contactId=${contact._id}`
    });

};

const getByIdContact = async (req, res) => {
  const { contactId } = req.params;
  
  const contact = await Contact.findById(
    contactId,
    "-_id first_name last_name email"
  )

  if (!contact) {
    throw HttpError (404, 'Не має даних')
  }

  return res.status(200).json(contact);
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
  const { dealId } = req.params;
  
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
  registerContactForm: ctrlWrapper(registerContactForm),
  resendPaymentForm: ctrlWrapper(resendPaymentForm),
  getRegisterUrl: ctrlWrapper(getRegisterUrl),
  getByIdContact: ctrlWrapper(getByIdContact),
  processesDeal: ctrlWrapper(processesDeal),
  manualProcessesDeal: ctrlWrapper(manualProcessesDeal),
  getByIdDeal: ctrlWrapper(getByIdDeal),
  addTransition: ctrlWrapper(addTransition),
  // addGrammatical: ctrlWrapper(addGrammatical),
  addDonat: ctrlWrapper(addDonat),
  processesDonat: ctrlWrapper(processesDonat),
  sendEmailContact: ctrlWrapper(sendEmailContact),
  editLead: ctrlWrapper(editLead),
};
