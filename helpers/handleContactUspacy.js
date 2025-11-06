const { Contact } = require('../models/contact');
const { Deal } = require('../models/deal');
const sendEmail = require('./sendEmail');
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
console.log(user,
    course,
    contactId, 
    contactUspacyId, 
    dealId, 
    dealUspacyId);

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
        
      if (dealUspacy) {
        // Оновлення угоди в Uspacy
        await editDealUspacy({
          token: jwt, 
          dealId: dealUspacyId,
          promokod,
          amountDeal,
        })
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
        promokod,
        amountDeal,
      })
      console.log(newDealUspacy);
      

      if (newDealUspacy) {
        dealUspacyId = newDealUspacy.id;

        // Оновлення угоди в локальній базі даних
        await Deal.findByIdAndUpdate(
          dealId,
          {$set: {dealUspacyId}}
        )
      }

      // Відправка привітального листа
      if (["Курс переходу", "Граматичний курс"].includes(course.title)) {
        const html = `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-family: Arial, Helvetica, sans-serif; background-color:#f8f8f8; padding:30px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; padding:30px; color:#111; line-height:1.6; font-size:16px;">
                <tr>
                  <td>
                    <p>Ми впевнені: українську можна вивчати не лише широко та глибоко, але й цікаво та комфортно!</p>

                    <p>Щоб розпочати навчання, зареєструйтеся на платформі ГО "Рух Єдині", натиснувши "Зареєструватися":<br>
                      <a href="https://bit.ly/3LEFKV1" style="color:#007bff; text-decoration:none;">https://bit.ly/3LEFKV1</a>
                    </p>

                    <p>Навчайтесь у зручному для вас темпі й ритмі.</p>

                    <h3 style="margin-top:24px;">ХОЧЕТЕ СПІЛКУВАТИСЯ?</h3>

                    <p>ГО "Рух Єдині" пропонує розмовні клуби української мови, де можна поспілкуватися наживо.</p>

                    <p>
                      📍 Центральна районна бібліотека імені Григорія Сковороди, вул. Освіти, 14а<br>
                      🗓 Вівторок 17:30 – 19:00
                    </p>

                    <p>
                      📍 Бібліотека імені Остапа Вишні, вул. Михайла Грушевського, 9, метро Арсенальна<br>
                      🗓 Неділя 12:00 – 13:30
                    </p>

                    <p>Реєстрація на розмовні клуби в інших містах:<br>
                      <a href="https://bit.ly/3Lk4xO8" style="color:#007bff; text-decoration:none;">https://bit.ly/3Lk4xO8</a>
                    </p>

                    <h3 style="margin-top:24px;">ШУКАЄТЕ РОЗМОВНИЙ КЛУБ ОНЛАЙН?</h3>

                    <p>Долучайтеся:</p>

                    <p>🔅 Щочетверга о 18:00 — Аля Божик<br>
                      <a href="https://us06web.zoom.us/j/86450739060?pwd=MKodrhqiiYQCr1yZ6bZSvzwsvHC0mi.1" style="color:#007bff; text-decoration:none;">
                        Zoom-посилання
                      </a>
                    </p>

                    <p>🔅 Щоп'ятниці о 18:30 — Олександра Малаш<br>
                      <a href="https://us05web.zoom.us/j/89991515079?pwd=mc3Z3edJJWSasJOOlObaSDVecu1Ubp.1" style="color:#007bff; text-decoration:none;">
                        Zoom-посилання
                      </a>
                    </p>

                    <p>🔅 Щонеділі о 16:00 — Галина Щерба<br>
                      <a href="https://us06web.zoom.us/j/84474894845?pwd=udXznaFUTG4gY41a6mnJwtn8FfaWXF.1" style="color:#007bff; text-decoration:none;">
                        Zoom-посилання
                      </a>
                    </p>

                    <h3 style="margin-top:24px;">ХОЧЕТЕ ПОКРАЩИТИ ГРАМАТИКУ ТА ПРАВОПИС?</h3>

                    <p>🔅 Приходьте щопонеділка о 18:30 на навчальний клас, щоб навчатися граючись!<br>
                      <a href="https://us05web.zoom.us/j/89991515079?pwd=mc3Z3edJJWSasJOOlObaSDVecu1Ubp.1" style="color:#007bff; text-decoration:none;">
                        Zoom-посилання
                      </a>
                    </p>

                    <h3 style="margin-top:24px;">ЛЮБИТЕ ЧИТАТИ?</h3>

                    <p>ГО "Рух Єдині" запрошує до книжкового клубу, де щомісяця обговорюється книжка українського або іноземного автора (онлайн та офлайн):</p>

                    <p>
                      Канал клубу: <a href="https://t.me/kk_yedyni" style="color:#007bff; text-decoration:none;">https://t.me/kk_yedyni</a><br>
                      Чат: <a href="https://t.me/kkyedyni" style="color:#007bff; text-decoration:none;">https://t.me/kkyedyni</a>
                    </p>

                    <h3 style="margin-top:24px;">ХОЧЕТЕ ЗНАТИ БІЛЬШЕ?</h3>

                    <p>Якщо виникатимуть запитання, звертайтеся до чатів підтримки:</p>

                    <p>
                      Whatsapp: <a href="https://chat.whatsapp.com/CAknKOIXagy6bjEBhA4Q9z?mode=ems_share_t" style="color:#007bff; text-decoration:none;">натисніть тут</a><br>
                      Telegram: <a href="https://t.me/+ejdjXWLIFxg3YWYy" style="color:#007bff; text-decoration:none;">натисніть тут</a><br>
                      Viber: <a href="https://invite.viber.com/?g=1rTxmM_Uj1XZo1KydfpQn8WzVhboWplp" style="color:#007bff; text-decoration:none;">натисніть тут</a>
                    </p>

                    <p style="margin-top:24px;">З повагою,<br>ГО "Рух Єдині"</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        `;

        const welcomeEmail = {
          to: [{ email: user.email }],
          subject: 'Вітаємо з реєстрацією на курс української мови від ГО «Рух Єдині»!',
          html,
        };

        const isSendingEmail = await sendEmail(welcomeEmail);

        // Встановлення етапу автоматичної відправки посилання в угоді Uspacy
        if (isSendingEmail) {
          await moveStageDealUspacy({
            token: jwt,
            dealId: dealUspacyId,
            stageId: course.welcomeStageId,
          });
        }
      }
    }
    console.log(`Створено угоду ${course.title}, ${user.last_name} ${user.first_name}`);
  };

module.exports = handleContactUspacy;