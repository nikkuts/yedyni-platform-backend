const { Contact } = require('../models/contact');
const { Deal } = require('../models/deal');

  const handleContactDB = async ({user, course}) => {
    let contactId = null;
    let contactUspacyId = null;
    let arrayRegistration = null;
    let dealId = null;
    let dealUspacyId = null;
    let redirectUrl = null;

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

        if (deal.payment && deal.payment.status === 'success') {
          redirectUrl = course.welcome;
        }
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

    return {
      contactId, 
      contactUspacyId, 
      dealId, 
      dealUspacyId, 
      arrayRegistration,
      redirectUrl,
    };
  }

  module.exports = handleContactDB;