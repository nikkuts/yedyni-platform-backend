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

      await Contact.findByIdAndUpdate(newContact._id, 
        {contactUspacyId}
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
  const {fio, mail, phone} = req.body;

  const newClient = await Contact.create({
    name: fio, 
    email: mail,
    phone,
    product: "Видноколо",
  });
};

// const processesClient = async (req, res) => {
//   const {data, signature} = req.body;
//   const hash = SHA1(PRIVATE_KEY + data + PRIVATE_KEY);
//   const sign = Base64.stringify(hash);

//   if (sign !== signature) {
//     throw HttpError(400, "Несправжня відповідь LiqPay");
//   }

//   const dataString = Utf8.stringify(Base64.parse(data));
//   const result = JSON.parse(dataString);

//   const {order_id, action, status, customer, amount, end_date} = result;

//   if (status === 'success') {
//     const client = await Client.findByIdAndUpdate(
//       customer, 
//       { payment: result },
//       { new: true }
//     );
//   }

//   res.status(200).json({
//     message: 'success',
//   })
// };

module.exports = {
    addTransition: ctrlWrapper(addTransition),
    addGrammatical: ctrlWrapper(addGrammatical),
    // processesClient: ctrlWrapper(processesClient),
};