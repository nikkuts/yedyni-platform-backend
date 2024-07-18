const axios = require('axios');
const querystring = require('querystring');
const Base64 = require('crypto-js/enc-base64');
const SHA1 = require('crypto-js/sha1');
const Utf8 = require('crypto-js/enc-utf8');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const { Contact } = require('../models/contact');
const { Deal } = require('../models/deal');
const {ctrlWrapper, HttpError, sendEmail} = require('../helpers');
const {
  authUspacy,
  getContactByIdUspacy,
  getDealByIdUspacy,
  createContactUspacy,
  createDealUspacy,
  editContactUspacy,
  moveStageDealUspacy
} = require('../utils');
const courses = require('../utils/courses.json');

const PUBLIC_KEY = process.env.PUBLIC_KEY_TEST;
const PRIVATE_KEY = process.env.PRIVATE_KEY_TEST;
const BASE_SERVER_URL = process.env.BASE_SERVER_URL;
const {USPACY_LOGIN, USPACY_PASS} = process.env;

const addServant = async (req, res) => {
  const {first_name, last_name, email, phone} = req.body;
  const course = courses.find(elem => elem.title === 'Курс з підготовки до держіспиту');

  try {
    const newClient = await Deal.create({
      first_name,
      last_name, 
      email,
      phone,
      product: course.title,
    });

    const orderId = uuidv4();

      const dataObj = {
        public_key: PUBLIC_KEY, 
        version: '3',
        action: 'pay',
        amount: course.amount,
        currency: 'UAH',
        description: `${last_name} ${first_name} Донат за ${course.title}`,
        order_id: orderId,
        result_url: `https://yedyni.org/testpayment?client_id=${newClient._id}`,
        server_url: `${BASE_SERVER_URL}/api/clients/process`,
        customer: newClient._id,
      };

    // Кодуємо дані JSON у рядок та потім у Base64
    const dataString = JSON.stringify(dataObj);
    const data = Base64.stringify(Utf8.parse(dataString));

    // Створюємо підпис
    const hash = SHA1(PRIVATE_KEY + data + PRIVATE_KEY);
    const signature = Base64.stringify(hash);

    const paymentForm = `
      <form id="paymentForm" method="POST" action="https://www.liqpay.ua/api/3/checkout" accept-charset="utf-8">
        <input type="hidden" name="data" value='${data}' />
        <input type="hidden" name="signature" value='${signature}' />
        <input type="image" src="//static.liqpay.ua/buttons/payUk.png"/>
      </form>
      <script>
        document.addEventListener("DOMContentLoaded", function() {
        const paymentForm = document.getElementById("paymentForm");
            try {
              paymentForm.submit();
            }
            catch (error) {
              console.error('Помилка під час відправлення форми:', error);
              alert('Помилка відправки форми. Будь ласка, спробуйте повторити.');
            }
            finally {
              paymentForm.reset();
            }   
        });
      </script>
    `;

    res.send(paymentForm);

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
        title: `${last_name} ${first_name}`,
        first_name,
        last_name,
        email: [{ value: email }],
        phone: [{ value: phone }],
        registration: ["kurs_z_pidgotovki_do_derzhispitu"]
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
        title: "Курс з підготовки до держіспиту",
        funnel_id: 5,
        amount_of_the_deal: {currency: "UAH", value: course.amount},
        contacts: [contactUspacyId],
        hvilya: course.wave
      }
    };

    const createDealResponse = await axios(createDealOptions);
    const dealUspacyId = createDealResponse.data.id;

    // Збереження в локальній базі id контакту та угоди
    await Deal.findByIdAndUpdate(newClient._id, {contactUspacyId, dealUspacyId});
    console.log('Створено угоду "Курс з підготовки до держіспиту"', `${last_name} ${first_name}`);

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

const addCreative = async (req, res) => {
  const {first_name, last_name, email, phone} = req.body;
  const course = courses.find(elem => elem.title === 'Видноколо');

  try {
    const newClient = await Deal.create({
      first_name,
      last_name, 
      email,
      phone,
      product: course.title,
    });

    const orderId = uuidv4();

      const dataObj = {
        public_key: PUBLIC_KEY, 
        version: '3',
        action: 'pay',
        amount: 750,
        currency: 'UAH',
        description: `${last_name} ${first_name} Донат за Курс ${course.title}`,
        order_id: orderId,
        result_url: `https://yedyni.org/testpayment?client_id=${newClient._id}`,
        server_url: `${BASE_SERVER_URL}/api/clients/process`,
        customer: newClient._id,
      };

    // Кодуємо дані JSON у рядок та потім у Base64
    const dataString = JSON.stringify(dataObj);
    const data = Base64.stringify(Utf8.parse(dataString));

    // Створюємо підпис
    const hash = SHA1(PRIVATE_KEY + data + PRIVATE_KEY);
    const signature = Base64.stringify(hash);

    const paymentForm = `
      <form id="paymentForm" method="POST" action="https://www.liqpay.ua/api/3/checkout" accept-charset="utf-8">
        <input type="hidden" name="data" value='${data}' />
        <input type="hidden" name="signature" value='${signature}' />
        <input type="image" src="//static.liqpay.ua/buttons/payUk.png"/>
      </form>
      <script>
        document.addEventListener("DOMContentLoaded", function() {
        const paymentForm = document.getElementById("paymentForm");
            try {
              paymentForm.submit();
            }
            catch (error) {
              console.error('Помилка під час відправлення форми:', error);
              alert('Помилка відправки форми. Будь ласка, спробуйте повторити.');
            }
            finally {
              paymentForm.reset();
            }   
        });
      </script>
    `;

    res.send(paymentForm);

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
        title: `${last_name} ${first_name}`,
        first_name,
        last_name,
        email: [{ value: email }],
        phone: [{ value: phone }],
        registration: ["kurs_vidnokolo"]
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
        title: "Видноколо",
        funnel_id: 6,
        amount_of_the_deal: {currency: "UAH", value: course.amount},
        contacts: [contactUspacyId],
        hvilya: course.wave
      }
    };

    const createDealResponse = await axios(createDealOptions);
    const dealUspacyId = createDealResponse.data.id;

    // Збереження в локальній базі id контакту та угоди
    await Deal.findByIdAndUpdate(newClient._id, {contactUspacyId, dealUspacyId});
    console.log('Створено угоду "Видноколо"', `${last_name} ${first_name}`);

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

const addProukrainian = async (req, res) => {
  const user = req.body;
  const course = courses.find(elem => elem.title === 'Проукраїнська');
  let contactId = null;
  let contactUspacyId = null;
  let arrayRegistration = null;
  let dealId = null;
  let dealUspacyId = null;

    // Перевірка, чи є контакт у базі
    const contact = await Contact.findOne({email: user.email});

    if (!contact) {
      // Створення нового контакту в локальній базі даних
      const newContact = await Contact.create({
        ...user,
        registration: [course.registration],
      });

      contactId = newContact._id;
    } else { 
      contactId = contact._id;

      // Перевірка та додавання нової реєстрації контакту
      arrayRegistration = contact.registration;
      const isCurrentRegistration = arrayRegistration.find(elem => elem === course.registration);

      if (!isCurrentRegistration) {
        arrayRegistration.push(course.registration);
      }

      // Оновлення контакту в локальній базі
      await Contact.findByIdAndUpdate(
        contact._id,
        {$set: {...user, registration: arrayRegistration}}
      )

      // Перевірка, чи є угода в базі
      const deal = await Deal.findOne({
        contact: contact._id,
        title: course.title,
        wave: course.wave,
      });

      if (deal) { 
        dealId = deal._id;
        dealUspacyId = deal.dealUspacyId;
      }
    }

    if (!dealUspacyId) {
      // Створення нової угоди в локальній базі даних
      const newDeal = await Deal.create({
        contact: contactId,
        title: course.title,
        wave: course.wave,
      });

      dealId = newDeal._id;
    }
  
    // Створення та відправка форми до Liqpay
    const orderId = uuidv4();

      const dataObj = {
        public_key: PUBLIC_KEY, 
        version: '3',
        action: 'pay',
        amount: course.amount,
        currency: 'UAH',
        description: `${user.last_name} ${user.first_name} Донат за Курс ${course.title}`,
        order_id: orderId,
        result_url: `https://yedyni.org/testpayment?deal_id=${dealId}`,
        server_url: `${BASE_SERVER_URL}/api/deals/process`,
        customer: dealId,
      };

    // Кодуємо дані JSON у рядок та потім у Base64
    const dataString = JSON.stringify(dataObj);
    const data = Base64.stringify(Utf8.parse(dataString));

    // Створюємо підпис
    const hash = SHA1(PRIVATE_KEY + data + PRIVATE_KEY);
    const signature = Base64.stringify(hash);

    const paymentForm = `
      <form id="paymentForm" method="POST" action="https://www.liqpay.ua/api/3/checkout" accept-charset="utf-8">
        <input type="hidden" name="data" value='${data}' />
        <input type="hidden" name="signature" value='${signature}' />
        <input type="image" src="//static.liqpay.ua/buttons/payUk.png"/>
      </form>
      <script>
        document.addEventListener("DOMContentLoaded", function() {
        const paymentForm = document.getElementById("paymentForm");
            try {
              paymentForm.submit();
            }
            catch (error) {
              console.error('Помилка під час відправлення форми:', error);
              alert('Помилка відправки форми. Будь ласка, спробуйте повторити.');
            }
            finally {
              paymentForm.reset();
            }   
        });
      </script>
    `;

    res.send(paymentForm);

    // Отримання JWT токена від Uspacy
    const jwt = await authUspacy();

    if (contact) {
      // Перевірка, чи є контакт в Uspacy
      const contactUspacy = await getContactByIdUspacy({token: jwt, contactId: contact.contactUspacyId});
      
      if (contactUspacy) {
        contactUspacyId = contactUspacy.id;
      }
    } 

    if (dealUspacyId) {
      // Перевірка, чи є угода в Uspacy
      const dealUspacy = await getDealByIdUspacy({token: jwt, dealId: dealUspacyId});
        
      if (!dealUspacy) {
        dealUspacyId = null;
      } 
    }

    if (!contactUspacyId) {
      // Створення контакту в Uspacy
      const newContactUspacy = await createContactUspacy({
        token: jwt, 
        user,
        registration: [course.registration]
      });

      if (newContactUspacy) {
        contactUspacyId = newContactUspacy.id;
      }

      // Оновлення контакту в локальній базі даних
      await Contact.findByIdAndUpdate(
        contactId,
        {$set: {contactUspacyId}}
      )
    } else {
      // Оновлення контакту в Uspacy
      await editContactUspacy({
        token: jwt, 
        contactId: contactUspacyId,
        user,
        registration: arrayRegistration
      })
    } 

    if (!dealUspacyId) {
      // Створення угоди для контакту в Uspacy
      const newDealUspacy = await createDealUspacy({
        token: jwt, 
        course,
        contactId: contactUspacyId
      })

      if (newDealUspacy) {
        dealUspacyId = newDealUspacy.id;

        // Оновлення угоди в локальній базі даних
        await Deal.findByIdAndUpdate(
          dealId,
          {$set: {dealUspacyId}}
        )
      }
    }

    console.log(`Створено угоду ${course.title}, ${user.last_name} ${user.first_name}`);
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

  const { status, customer } = result;

  if (status === 'success') {

    try {
      const deal = await Deal.findByIdAndUpdate(customer, { payment: result }, { new: true })
        .populate("contact", "first_name email");

      const course = courses.find(elem => elem.title === deal.title);

      // Відправка привітального листа
      const welcomeEmail = {
        to: [{ email: deal.contact.email }],
        subject: "Вітаємо на курсі!",
        html: `
          <p>${deal.contact.first_name}, дякуємо за реєстрацію на курс і фінансову підтримку Руху "Єдині"!</p> 
          <p>Внесена Вами грошова пожертва в розмірі ${course.amount} грн піде на розвиток проєкту і створення масових безоплатних курсів з освітньої та психологічної підтримки в переході на українську мову.</p>
          <p>Наступний крок: приєднатися до нашого Telegram!</p> 
          <p>Просимо не поширювати це посилання серед осіб, не зареєстрованих на курс.</p>
          <p><a target="_blank" href="${course.canal}">Приєднатися до курсу</a></p>
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

      // Отримання угоди з Uspacy
      const dealUspacy = await getDealByIdUspacy({token: jwt, dealId: deal.dealUspacyId});
      const dealStatus = dealUspacy.kanban_status;

      // if (dealStatus === course.welcomeStageId) {
      //   console.log('Встановлено статус угоди', 'Автоматична відправка посилання по email');
      // } else if (dealStatus === course.paymentStageId) {
      //   console.log('Встановлено статус угоди', 'Оплата');
      // } else {
      //   console.log('Статус угоди', dealStatus);
      // }

      switch (dealStatus) {
        case course.welcomeStageId:
          console.log('Встановлено статус угоди', 'Автоматична відправка посилання по email');
          break;

        case course.paymentStageId:
          console.log('Встановлено статус угоди', 'Оплата');
          break;

        default:
          console.log('Статус угоди', dealStatus);
      }

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
  } else {
    console.log('Статус платежу', status);
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

module.exports = {
    addServant: ctrlWrapper(addServant),
    addCreative: ctrlWrapper(addCreative),
    addProukrainian: ctrlWrapper(addProukrainian),
    processesDeal: ctrlWrapper(processesDeal),
    getByIdDeal: ctrlWrapper(getByIdDeal),
};


// const addServant = async (req, res) => {
//   const {first_name, last_name, email, phone} = req.body;
//   const course = courses.find(elem => elem.title === 'Курс з підготовки до держіспиту');

//   try {
//     const newClient = await Client.create({
//       first_name,
//       last_name, 
//       email,
//       phone,
//       product: course.title,
//     });

//     const orderId = uuidv4();

//       const dataObj = {
//         public_key: PUBLIC_KEY, 
//         version: '3',
//         action: 'pay',
//         amount: course.amount,
//         currency: 'UAH',
//         description: `${last_name} ${first_name} Донат за ${course.title}`,
//         order_id: orderId,
//         result_url: `https://yedyni.org/testpayment?client_id=${newClient._id}`,
//         server_url: `${BASE_SERVER_URL}/api/clients/process`,
//         customer: newClient._id,
//       };

//     // Кодуємо дані JSON у рядок та потім у Base64
//     const dataString = JSON.stringify(dataObj);
//     const data = Base64.stringify(Utf8.parse(dataString));

//     // Створюємо підпис
//     const hash = SHA1(PRIVATE_KEY + data + PRIVATE_KEY);
//     const signature = Base64.stringify(hash);

//     const paymentForm = `
//       <form id="paymentForm" method="POST" action="https://www.liqpay.ua/api/3/checkout" accept-charset="utf-8">
//         <input type="hidden" name="data" value='${data}' />
//         <input type="hidden" name="signature" value='${signature}' />
//         <input type="image" src="//static.liqpay.ua/buttons/payUk.png"/>
//       </form>
//       <script>
//         document.addEventListener("DOMContentLoaded", function() {
//         const paymentForm = document.getElementById("paymentForm");
//             try {
//               paymentForm.submit();
//             }
//             catch (error) {
//               console.error('Помилка під час відправлення форми:', error);
//               alert('Помилка відправки форми. Будь ласка, спробуйте повторити.');
//             }
//             finally {
//               paymentForm.reset();
//             }   
//         });
//       </script>
//     `;

//     res.send(paymentForm);

//     // Отримання JWT токена від Uspacy
//     const authOptions = {
//       method: 'POST',
//       url: 'https://yedyni.uspacy.ua/auth/v1/auth/sign_in',
//       headers: { accept: 'application/json', 'content-type': 'application/json' },
//       data: { email: USPACY_LOGIN, password: USPACY_PASS }
//     };

//     const authResponse = await axios(authOptions);
//     const jwt = authResponse.data.jwt;

//     // Створення контакту в Uspacy
//     const createContactOptions = {
//       method: 'POST',
//       url: 'https://yedyni.uspacy.ua/crm/v1/entities/contacts',
//       headers: {
//         accept: 'application/json',
//         'content-type': 'application/json',
//         authorization: `Bearer ${jwt}`
//       },
//       data: {
//         title: `${last_name} ${first_name}`,
//         first_name,
//         last_name,
//         email: [{ value: email }],
//         phone: [{ value: phone }],
//         registration: ["kurs_z_pidgotovki_do_derzhispitu"]
//       }
//     };

//     const createContactResponse = await axios(createContactOptions);
//     const contactUspacyId = createContactResponse.data.id;

//     // Створення угоди для контакту в Uspacy
//     const createDealOptions = {
//       method: 'POST',
//       url: 'https://yedyni.uspacy.ua/crm/v1/entities/deals',
//       headers: {
//         accept: 'application/json',
//         'content-type': 'application/json',
//         authorization: `Bearer ${jwt}`
//       },
//       data: {
//         title: "Курс з підготовки до держіспиту",
//         funnel_id: 5,
//         amount_of_the_deal: {currency: "UAH", value: course.amount},
//         contacts: [contactUspacyId],
//         hvilya: course.wave
//       }
//     };

//     const createDealResponse = await axios(createDealOptions);
//     const dealUspacyId = createDealResponse.data.id;

//     // Збереження в локальній базі id контакту та угоди
//     await Client.findByIdAndUpdate(newClient._id, {contactUspacyId, dealUspacyId});
//     console.log('Створено угоду "Курс з підготовки до держіспиту"', `${last_name} ${first_name}`);

//   } catch (error) {
//     if (error.response) {
//         // Логування повної відповіді помилки, якщо вона є
//         console.error('Error during the process:', error.message, error.response.data);
//         res.status(error.response.status).json({ success: false, message: error.response.data.message || 'Помилка при обробці запиту' });
//       } else {
//         // Логування помилки без відповіді
//         console.error('Error during the process:', error.message);
//         res.status(500).json({ success: false, message: 'Помилка при обробці запиту' });
//       }
//   }
// };



// const processesDeal = async (req, res) => {
//   const {data, signature} = req.body;
//   const hash = SHA1(PRIVATE_KEY + data + PRIVATE_KEY);
//   const sign = Base64.stringify(hash);

//   if (sign !== signature) {
//     throw HttpError(400, "Несправжня відповідь LiqPay");
//   }

//   const dataString = Utf8.stringify(Base64.parse(data));
//   const result = JSON.parse(dataString);

//   const { status, customer } = result;

//   if (status === 'success') {

//     try {
//       const client = await Deal.findByIdAndUpdate(
//         customer, 
//         { payment: result },
//         { new: true }
//       );

//       const course = courses.find(elem => elem.title === client.product);

//       // Отримання JWT токена від Uspacy
//       const authOptions = {
//         method: 'POST',
//         url: 'https://yedyni.uspacy.ua/auth/v1/auth/sign_in',
//         headers: { accept: 'application/json', 'content-type': 'application/json' },
//         data: { email: USPACY_LOGIN, password: USPACY_PASS }
//       };

//       const authResponse = await axios(authOptions);
//       const jwt = authResponse.data.jwt;

//       // Відправка привітального листа
//       const welcomeEmail = {
//         to: [{ email: client.email }],
//         subject: "Вітаємо на курсі!",
//         html: `
//           <p>${client.first_name}, дякуємо за реєстрацію на курс і фінансову підтримку Руху "Єдині"!</p> 
//           <p>Внесена Вами грошова пожертва в розмірі ${course.amount} грн піде на розвиток проєкту і створення масових безоплатних курсів з освітньої та психологічної підтримки в переході на українську мову.</p>
//           <p>Наступний крок: приєднатися до нашого Telegram!</p> 
//           <p>Просимо не поширювати це посилання серед осіб, не зареєстрованих на курс.</p>
//           <p><a target="_blank" href="${course.canal}">Приєднатися до курсу</a></p>
//           `
//       };

//       const isSendingEmail = await sendEmail(welcomeEmail);

//        // Встановлення етапу в угоді Uspacy
//       const stageId = isSendingEmail ? course.welcomeStageId : course.paymentStageId;

//       const moveStageDealOptions = {
//         method: 'POST',
//         url: `https://yedyni.uspacy.ua/crm/v1/entities/deals/${client.dealUspacyId}/move/stage/${stageId}`,
//         headers: {
//           accept: 'application/json',
//           'content-type': 'application/json',
//           authorization: `Bearer ${jwt}`
//         }
//       };

//       await axios(moveStageDealOptions);

//       // Отримання угоди з Uspacy
//       const getDealOptions = {
//         method: 'GET',
//         url: `https://yedyni.uspacy.ua/crm/v1/entities/deals/${client.dealUspacyId}`,
//         headers: {
//           accept: 'application/json',
//           authorization: `Bearer ${jwt}`
//         }
//       };

//       const getDealResponse = await axios(getDealOptions);
//       const dealStatus = getDealResponse.data.kanban_status;

//       console.log('Встановлено статус угоди', dealStatus);

//     } catch (error) {
//       if (error.response) {
//         // Логування повної відповіді помилки, якщо вона є
//         console.error('Error during the process:', error.message, error.response.data);
//         res.status(error.response.status).json({ success: false, message: error.response.data.message || 'Помилка при обробці запиту' });
//       } else {
//         // Логування помилки без відповіді
//         console.error('Error during the process:', error.message);
//         res.status(500).json({ success: false, message: 'Помилка при обробці запиту' });
//       }
//     }
//   }

//   res.status(200).json({message: 'success'})
// };



// const getServants = async (req, res) => {
//   const result = await Client.find(
//     { product: "Курс для держслужбовців" }, 
//     "-_id -updatedAt"
//   );
  
//   if (!result || result.length === 0) {
//     throw HttpError(404, 'Не знайдено даних');
//   }

//   res.json(result);
// };

// const getCreatives = async (req, res) => {
//   const result = await Client.find(
//     { product: "Видноколо" }, 
//     "-_id -updatedAt"
//   );
  
//   if (!result || result.length === 0) {
//     throw HttpError(404, 'Не знайдено даних');
//   }

//   res.json(result);
// };