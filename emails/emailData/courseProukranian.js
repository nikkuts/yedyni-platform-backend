module.exports = {
  welcome: {
    subject: "Дякуємо за реєстрацію на курс української мови!",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #2b6cb0;">Дякуємо за реєстрацію!</h2>
        
        <p>
          Ви успішно зареєструвалися на <strong>курс "Проукраїнська"</strong>.
        </p>
        
        <p>
          Щоб отримати доступ до курсу, будь ласка, <a href="https://server.yedyni.org/api/contacts/resend-payment?dealUspacyId={{dealUspacyId}}&amountDeal={{amountDeal}}" target="_blank" style="color: #0057B7; text-decoration: none;">натисніть тут</a> та проведіть оплату.
        </p>
        
        <p style="margin-top: 20px;">
          Після підтвердження оплати ви отримаєте лист із деталями доступу.
        </p>
        
        <p style="margin-top: 30px;">З повагою,<br><strong>Команда ГО «Рух Єдині»</strong></p>
      </div>
    `,
    text: `
Дякуємо за реєстрацію!

Ви успішно зареєструвалися на курс "Проукраїнська".

Щоб отримати доступ до курсу, будь ласка, перейдіть за посиланням та проведіть оплату:
https://server.yedyni.org/api/contacts/resend-payment?dealUspacyId={{dealUspacyId}}&amountDeal={{amountDeal}}

Після підтвердження оплати ви отримаєте лист із деталями доступу.

З повагою,
Команда ГО «Рух Єдині»
    `
  },

  payment: {
    subject: 'Ви успішно оплатили курс "Проукраїнська"!',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #2b6cb0;">Вітаємо!</h2>
        
        <p>
          Щоб розпочати навчання, увійдіть за посиланням на платформу ГО «Рух Єдині»:
          <a href="https://platform.yedyni.org/uk/learn/67326ab41c9fedb128321f03" target="_blank" style="color: #0057B7; text-decoration: none;">https://platform.yedyni.org/uk/learn/67326a711c9fedb128321f01</a>
        </p>
        
        <p style="margin-top: 30px;">
          Бажаємо успіху у навчанні!<br>
          <strong>Команда ГО «Рух Єдині»</strong>
        </p>
      </div>
    `,
    text: `
Вітаємо!

Щоб розпочати навчання, увійдіть на платформу ГО «Рух Єдині»: https://platform.yedyni.org/uk/learn/67326ab41c9fedb128321f03

Бажаємо успіху у навчанні!
Команда ГО «Рух Єдині»
    `
  },

  access: {
    subject: 'Ваш доступ до курсу "Проукраїнська"!',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #2b6cb0;">Вітаємо!</h2>

        <p>
          Ми створили для вас особистий акаунт на платформі ГО «Рух Єдині».
        </p>

        <p>
          <b>Ваші дані для входу:</b><br>
          Email: <b>{{email}}</b><br>
          Пароль: <b>{{password}}</b>
        </p>

        <p>
          Увійдіть за посиланням:
          <a href="https://platform.yedyni.org/uk/learn/67326ab41c9fedb128321f03" target="_blank" style="color: #0057B7; text-decoration: none;">https://platform.yedyni.org/uk/learn/67326a711c9fedb128321f01</a>
        </p>
        
        <p style="margin-top: 30px;">
          Бажаємо успіху у навчанні!<br>
          <strong>Команда ГО «Рух Єдині»</strong>
        </p>
      </div>
    `,
    text: `
Вітаємо!

Ми створили для вас особистий акаунт на платформі ГО «Рух Єдині».

Ваші дані для входу:
Email: {{email}}
Пароль: {{password}}

Увійдіть за посиланням: https://platform.yedyni.org/uk/learn/67326ab41c9fedb128321f03

Бажаємо успіху у навчанні!
Команда ГО «Рух Єдині»
    `
  }
};
