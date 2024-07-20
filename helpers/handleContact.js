const { Contact } = require('../models/contact');
const { Deal } = require('../models/deal');
const sendEmail = require('./sendEmail');
const {
  authUspacy,
  getContactByIdUspacy,
  getDealByIdUspacy,
  createContactUspacy,
  createDealUspacy,
  editContactUspacy,
  moveStageDealUspacy
} = require('../utils');

  const handleContact = async ({user, course}) => {
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
      let html;

      switch (course.title) {
        case "Курс переходу":
            html = `
          <p>Шановний/-а пане/пані! Раді вітати Вас в нашій спільноті Руху «Єдині» та дякуємо за долучення до мовної боротьби! Українська - мова Перемоги!</p>
          <p>Ваша реєстрація пройшла успішно і тепер Ви є учасником курсу «28 днів підтримки у переході на українську мову». Відтепер ми наближаємо перемогу разом та будемо завжди поруч на Вашому шляху до рідної мови.</p>
          <p>Наступний крок: приєднатися до нашої <a target="_blank" href="${course.canal}">Telegram</a> або <a target="_blank" href="${course.viber}">Viber</a>-групи! Наші модератори вже з нетерпінням чекають на Вас!</p>
          <p>Також ми просимо не поширювати ці посилання серед осіб, не зареєстрованих на курс. А ось рекомендувати наші курси своїм друзями та родичам - класна ідея!</p>
          <p>Дякуємо, що Ви з нами!</p>
          <p>Ваша спільнота однодумців, Всеукраїнський Рух «Єдині»</p>
          `;
          break;

        case "Граматичний курс":
            html = `
          <p>Пане/пані! Раді вітати Вас в нашій спільноті Руху «Єдині» та дякуємо за долучення до мовної боротьби! Українська - мова Перемоги!</p>
          <p>Ваша реєстрація пройшла успішно і тепер Ви є учасником курсу «28 днів вдосконалення Вашої української мови». Відтепер ми наближаємо перемогу разом та будемо завжди поруч на Вашому шляху до рідної мови.</p>
          <p>Наступний крок: приєднатися до нашого <a target="_blank" href="${course.canal}">Telegram</a> або <a target="_blank" href="${course.classroom}">Google Classroom</a>! Наші модератори вже з нетерпінням чекають на Вас!</p>
          <p>Також ми просимо не поширювати ці посилання серед осіб, не зареєстрованих на курс. А ось рекомендувати наші курси своїм друзями та родичам - класна ідея!</p>
          <p>Дякуємо, що Ви з нами!</p>
          <p>Ваша спільнота однодумців, Всеукраїнський Рух «Єдині»</p>
          `;
          break;

        default:
            html = `
            <p>Шановний/-а пане/пані! Раді вітати Вас в нашій спільноті Руху «Єдині» та дякуємо за долучення до мовної боротьби! Українська - мова Перемоги!</p>
            <p>Ваша реєстрація пройшла успішно і тепер Ви є учасником курсу «28 днів підтримки у переході на українську мову». Відтепер ми наближаємо перемогу разом та будемо завжди поруч на Вашому шляху до рідної мови.</p>
            <p>Наступний крок: приєднатися до нашої <a target="_blank" href="${course.canal}">Telegram</a> або <a target="_blank" href="${course.viber}">Viber</a>-групи! Наші модератори вже з нетерпінням чекають на Вас!</p>
            <p>Також ми просимо не поширювати ці посилання серед осіб, не зареєстрованих на курс. А ось рекомендувати наші курси своїм друзями та родичам - класна ідея!</p>
            <p>Дякуємо, що Ви з нами!</p>
            <p>Ваша спільнота однодумців, Всеукраїнський Рух «Єдині»</p>
            `; 
      }

      const welcomeEmail = {
        to: [{ email: user.email }],
        subject: 'Вітаємо з реєстрацією на курсі від Руху «Єдині»!',
        html,
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
  };

  module.exports = handleContact;