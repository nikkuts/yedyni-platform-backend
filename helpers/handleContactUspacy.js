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

  const handleContactUspacy = async ({
    user,
    course,
    contactId, 
    contactUspacyId, 
    dealId, 
    dealUspacyId, 
    arrayRegistration,
    promokod,
    amountDeal,
  }) => {
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
        contactId: contactUspacyId,
        promokod,
        amountDeal,
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
      if (course.title === "Курс переходу" || course.title === "Граматичний курс") {
        
        const welcomeTransition = `
            <p>Раді вітати Вас в нашій спільноті Руху «Єдині» та дякуємо за долучення до мовної боротьби! Українська - мова Перемоги!</p>
            <p>Ваша реєстрація пройшла успішно і тепер Ви є учасником курсу «28 днів підтримки у переході на українську мову». Відтепер ми наближаємо перемогу разом та будемо завжди поруч на Вашому шляху до рідної мови.</p>
            <p>Наступний крок: приєднатися до нашої <a target="_blank" href="${course.canal}">Telegram</a> або <a target="_blank" href="${course.viber}">Viber</a>-групи! Наші модератори вже з нетерпінням чекають на Вас!</p>
            <p>Також ми просимо не поширювати ці посилання серед осіб, не зареєстрованих на курс. А ось рекомендувати наші курси своїм друзями та родичам - класна ідея!</p>
            <p>Дякуємо, що Ви з нами!</p>
            <p>Ваша спільнота однодумців, Всеукраїнський Рух «Єдині»</p>
        `;

        const welcomeGrammatical = `
            <p>Раді вітати Вас в нашій спільноті Руху «Єдині» та дякуємо за долучення до мовної боротьби! Українська - мова Перемоги!</p>
            <p>Ваша реєстрація пройшла успішно і тепер Ви є учасником курсу «28 днів вдосконалення Вашої української мови». Відтепер ми наближаємо перемогу разом та будемо завжди поруч на Вашому шляху до рідної мови.</p>
            <p>Наступний крок: приєднатися до нашого <a target="_blank" href="${course.canal}">Telegram</a> або <a target="_blank" href="${course.classroom}">Google Classroom</a>! Наші модератори вже з нетерпінням чекають на Вас!</p>
            <p>Також ми просимо не поширювати ці посилання серед осіб, не зареєстрованих на курс. А ось рекомендувати наші курси своїм друзями та родичам - класна ідея!</p>
            <p>Дякуємо, що Ви з нами!</p>
            <p>Ваша спільнота однодумців, Всеукраїнський Рух «Єдині»</p>
        `;

        const html = (course.title === "Курс переходу") ? welcomeTransition : welcomeGrammatical;

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
    }

    console.log(`Створено угоду ${course.title}, ${user.last_name} ${user.first_name}`);
  };

  module.exports = handleContactUspacy;