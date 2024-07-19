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

  const addTransition = async (req, res) => {
    const user = req.body;
    const course = courses.find(elem => elem.title === 'Курс переходу');
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
      contactUspacyId = contact.contactUspacyId;

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

    // Отримання JWT токена від Uspacy
    const jwt = await authUspacy();

    if (contactUspacyId) {
      // Перевірка, чи є контакт в Uspacy
      const contactUspacy = await getContactByIdUspacy({token: jwt, contactId: contactUspacyId});
      
      if (contactUspacy) {
        // Оновлення контакту в Uspacy
        await editContactUspacy({
          token: jwt, 
          contactId: contactUspacyId,
          user,
          registration: arrayRegistration
        })
      } else {
        contactUspacyId = null;
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
    }  

    if (dealUspacyId) {
      // Перевірка, чи є угода в Uspacy
      const dealUspacy = await getDealByIdUspacy({token: jwt, dealId: dealUspacyId});
        
      if (!dealUspacy) {
        dealUspacyId = null;
      } 
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

      // Відправка привітального листа
      const welcomeEmail = {
        to: [{ email: user.email }],
        subject: "Вітаємо з реєстрацією на курсі!",
        html: `
          <p>${user.first_name}, Вас зареєстровано на курс "Єдині": 28 днів підтримки у переході на українську мову. </p>
          <p>Наступний крок: приєднатися до нашої <a target="_blank" href="${course.canal}">Telegram</a> або <a target="_blank" href="${course.viber}">Viber</a>-групи!</p>
          <p>Просимо не поширювати це посилання серед осіб, не зареєстрованих на курс.</p>
          `
      };

      const isSendingEmail = await sendEmail(welcomeEmail);

      // Встановлення етапу автоматичної відправки посилання в угоді Uspacy
      if (isSendingEmail) {
        await moveStageDealUspacy({
          token: jwt,
          dealId: dealUspacyId,
          stageId: course.welcomeStageId
        })
      }
    }

    console.log(`Створено угоду ${course.title}, ${user.last_name} ${user.first_name}`);

    res.status(201).json({
      message: 'success',
    });
  };

  const addGrammatical = async (req, res) => {
    const user = req.body;
    const course = courses.find(elem => elem.title === 'Граматичний курс');
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

      // Відправка привітального листа
      const welcomeEmail = {
        to: [{ email: user.email }],
        subject: "Вітаємо з реєстрацією на курсі!",
        html: `
          <p>${user.first_name}, Вас зареєстровано на курс "Єдині": 28 днів вдосконалення Вашої української мови. </p>
          <p>Наступний крок: приєднатися до нашого <a target="_blank" href="${course.canal}">Telegram</a> або <a target="_blank" href="${course.classroom}">Google Classroom</a>!</p>
          <p>Просимо не поширювати це посилання серед осіб, не зареєстрованих на курс.</p>
          `
      };

      const isSendingEmail = await sendEmail(welcomeEmail);

      // Встановлення етапу автоматичної відправки посилання в угоді Uspacy
      if (isSendingEmail) {
        await moveStageDealUspacy({
          token: jwt,
          dealId: dealUspacyId,
          stageId: course.welcomeStageId
        })
      }
    }

    console.log(`Створено угоду ${course.title}, ${user.last_name} ${user.first_name}`);

    res.status(201).json({
      message: 'success',
    });
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
    addTransition: ctrlWrapper(addTransition),
    addGrammatical: ctrlWrapper(addGrammatical),
    sendEmailContact: ctrlWrapper(sendEmailContact),
    editLead: ctrlWrapper(editLead),
};


// const addGrammatical = async (req, res) => {
  //   const contact = req.body;
  //   const course = courses.find(elem => elem.title === 'Граматичний курс');
  
  //   try {
  //     // Створення нового контакту в локальній базі даних
  //     const newContact = await Contact.create({
  //       ...contact,
  //       registration: ["gramatichniy_kurs"],
  //     });
  
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
  //         ...contact,
  //         title: `${contact.last_name} ${contact.first_name}`,
  //         email: [{ value: contact.email }],
  //         phone: [{ value: contact.phone }],
  //         registration: ["gramatichniy_kurs"]
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
  //         title: "Граматичний курс",
  //         funnel_id: 4,
  //         contacts: [contactUspacyId],
  //         hvilya: course.wave
  //       }
  //     };
  
  //     const createDealResponse = await axios(createDealOptions);
  //     const dealUspacyId = createDealResponse.data.id;

  //     // Збереження в локальній базі id контакту та угоди
  //     await Contact.findByIdAndUpdate(newContact._id, 
  //       {contactUspacyId, dealUspacyId}
  //     )

  //      // Відправка привітального листа
  //      const welcomeEmail = {
  //       to: [{ email: contact.email }],
  //       subject: "Вітаємо з реєстрацією на курсі!",
  //       html: `
  //         <p>${contact.first_name}, Вас зареєстровано на курс "Єдині": 28 днів вдосконалення Вашої української мови. </p>
  //         <p>Наступний крок: приєднатися до нашого <a target="_blank" href="${course.canal}">Telegram</a> або <a target="_blank" href="${course.classroom}">Google Classroom</a>!</p>
  //         <p>Просимо не поширювати це посилання серед осіб, не зареєстрованих на курс.</p>
  //         `
  //     };

  //     const isSendingEmail = await sendEmail(welcomeEmail);

  //     // Встановлення етапу автоматичної відправки посилання в угоді Uspacy
  //    if (isSendingEmail) {
  //      const moveStageDealOptions = {
  //        method: 'POST',
  //        url: `https://yedyni.uspacy.ua/crm/v1/entities/deals/${dealUspacyId}/move/stage/${course.welcomeStageId}`,
  //        headers: {
  //          accept: 'application/json',
  //          'content-type': 'application/json',
  //          authorization: `Bearer ${jwt}`
  //        }
  //      };
 
  //      await axios(moveStageDealOptions);
  //    }

  //     res.status(201).json({
  //       message: 'success',
  //     });
  
  //   } catch (error) {
  //       if (error.response) {
  //           // Логування повної відповіді помилки, якщо вона є
  //           console.error('Error during the process:', error.message, error.response.data);
  //           res.status(error.response.status).json({ success: false, message: error.response.data.message || 'Помилка при обробці запиту' });
  //         } else {
  //           // Логування помилки без відповіді
  //           console.error('Error during the process:', error.message);
  //           res.status(500).json({ success: false, message: 'Помилка при обробці запиту' });
  //         }
  //   }
  // };