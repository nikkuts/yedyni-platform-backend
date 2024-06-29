const axios = require('axios');
require('dotenv').config();
const { Contact } = require('../models/contact');
const {ctrlWrapper, HttpError} = require('../helpers');

const {USPACY_LOGIN, USPACY_PASS} = process.env;

const addTransition = async (req, res) => {
    const contact = req.body;
  
    try {
      // Створення нового контакту в локальній базі даних
      const newContact = await Contact.create({
        ...contact,
        registration: ["kurs_perehodu"],
      });
  
      // Отримання JWT токена від Uspacy
      const authOptions = {
        method: 'POST',
        url: 'https://yedyni.uspacy.ua/auth/v1/auth/sign_in',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        data: { email: USPACY_LOGIN, password: USPACY_PASS }
      };
  
      const authResponse = await axios(authOptions);
      const jwt = authResponse.data.jwt;
  
      // Створення контакту в Uspacy
      const createContactOptions = {
        method: 'POST',
        url: 'https://yedyni.uspacy.ua/crm/v1/entities/contacts',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${jwt}`
        },
        data: {
          ...contact,
          title: contact.first_name,
          email: [{ value: contact.email }],
          phone: [{ value: contact.phone }],
          registration: ["kurs_perehodu"]
        }
      };
  
      const createContactResponse = await axios(createContactOptions);
      const contactUspacyId = createContactResponse.data.id;

      // Створення угоди для контакту в Uspacy
      const createDealOptions = {
        method: 'POST',
        url: 'https://yedyni.uspacy.ua/crm/v1/entities/deals',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${jwt}`
        },
        data: {
          title: "Курс переходу",
          funnel_id: 3,
          contacts: [contactUspacyId]
        }
      };
  
      const createDealResponse = await axios(createDealOptions);
      const dealUspacyId = createDealResponse.data.id;

      // Збереження в локальній базі id контакту та угоди
      await Contact.findByIdAndUpdate(newContact._id, 
        {contactUspacyId, dealUspacyId}
      )

      res.status(201).json({
        message: 'success',
      });
  
    } catch (error) {
        if (error.response) {
            // Логування повної відповіді помилки, якщо вона є
            console.error('Error during the process:', error.message, error.response.data);
            res.status(error.response.status).json({ success: false, message: error.response.data.message || 'Помилка при обробці запиту' });
          } else {
            // Логування помилки без відповіді
            console.error('Error during the process:', error.message);
            res.status(500).json({ success: false, message: 'Помилка при обробці запиту' });
          }
    }
  };

  const addGrammatical = async (req, res) => {
    const contact = req.body;
  
    try {
      // Створення нового контакту в локальній базі даних
      const newContact = await Contact.create({
        ...contact,
        registration: ["gramatichniy_kurs"],
      });
  
      // Отримання JWT токена від Uspacy
      const authOptions = {
        method: 'POST',
        url: 'https://yedyni.uspacy.ua/auth/v1/auth/sign_in',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        data: { email: USPACY_LOGIN, password: USPACY_PASS }
      };
  
      const authResponse = await axios(authOptions);
      const jwt = authResponse.data.jwt;
  
      // Створення контакту в Uspacy
      const createContactOptions = {
        method: 'POST',
        url: 'https://yedyni.uspacy.ua/crm/v1/entities/contacts',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${jwt}`
        },
        data: {
          ...contact,
          title: contact.first_name,
          email: [{ value: contact.email }],
          phone: [{ value: contact.phone }],
          registration: ["gramatichniy_kurs"]
        }
      };
  
      const createContactResponse = await axios(createContactOptions);
      const contactUspacyId = createContactResponse.data.id;

      // Створення угоди для контакту в Uspacy  
      const createDealOptions = {
        method: 'POST',
        url: 'https://yedyni.uspacy.ua/crm/v1/entities/deals',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${jwt}`
        },
        data: {
          title: "Граматичний курс",
          funnel_id: 4,
          contacts: [contactUspacyId]
        }
      };
  
      const createDealResponse = await axios(createDealOptions);
      const dealUspacyId = createDealResponse.data.id;

      // Збереження в локальній базі id контакту та угоди
      await Contact.findByIdAndUpdate(newContact._id, 
        {contactUspacyId, dealUspacyId}
      )

      res.status(201).json({
        message: 'success',
      });
  
    } catch (error) {
        if (error.response) {
            // Логування повної відповіді помилки, якщо вона є
            console.error('Error during the process:', error.message, error.response.data);
            res.status(error.response.status).json({ success: false, message: error.response.data.message || 'Помилка при обробці запиту' });
          } else {
            // Логування помилки без відповіді
            console.error('Error during the process:', error.message);
            res.status(500).json({ success: false, message: 'Помилка при обробці запиту' });
          }
    }
  };

  const sendEmailContact = async (req, res) => {
    const payload = req.body;
    console.log(payload.Message);
    // const message = JSON.parse(payload.Message);
    //         console.log('Message:', message);
    res.status(200);
  };

module.exports = {
    addTransition: ctrlWrapper(addTransition),
    addGrammatical: ctrlWrapper(addGrammatical),
    sendEmailContact: ctrlWrapper(sendEmailContact),
};