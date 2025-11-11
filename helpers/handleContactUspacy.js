const { Contact } = require('../models/contact');
const { Deal } = require('../models/deal');
const sendCourseEmail = require('../emails/index');
const {
  authUspacy,
  getContactByIdUspacy,
  getDealByIdUspacy,
  createContactUspacy,
  editContactUspacy,
  createDealUspacy,
  editDealUspacy,
  moveStageDealUspacy,
} = require('../utils');

const handleContactUspacy = async ({
  contactData,
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
        user: contactData,
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
      user: contactData,
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
    const dealUspacy = await getDealByIdUspacy({ token: jwt, dealId: dealUspacyId });
      
    if (dealUspacy) {
      // Оновлення угоди в Uspacy
      await editDealUspacy({
        token: jwt, 
        dealId: dealUspacyId,
        promokod: promokod,
        amountDeal: amountDeal,
      })
      console.log(`Оновлено угоду ${course.title}, ${contactData.last_name} ${contactData.first_name}`);
    } else {
      dealUspacyId = null;
    }
  }

  if (!dealUspacyId) {
    // Створення угоди для контакту в Uspacy
    const newDealUspacy = await createDealUspacy({
      token: jwt,
      course,
      contactId: contactUspacyId,
      promokod: promokod,
      amountDeal: amountDeal,
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
    const isSendingEmail = await sendCourseEmail(
      course.registration,
      "welcome",
      contactData.email,
      { dealUspacyId }
    );

    // Встановлення етапу автоматичної відправки привітального листа в угоді Uspacy
    if (isSendingEmail) {
      await moveStageDealUspacy({
        token: jwt,
        dealId: dealUspacyId,
        stageId: course.welcomeStageId,
      });
    }
    console.log(`Створено угоду ${course.title}, ${contactData.last_name} ${contactData.first_name}`);
  }
};

module.exports = handleContactUspacy;
