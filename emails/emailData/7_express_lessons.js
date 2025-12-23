module.exports = {
  welcome: {
    subject: "Дякуємо за реєстрацію на курс української мови!",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #2b6cb0;">Дякуємо за реєстрацію!</h2>
        
        <p>
          Ви успішно зареєструвалися на курс <strong>7 експрес-уроків ділової української мови</strong>.
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

Ви успішно зареєструвалися на курс 7 експрес-уроків ділової української мови.

Щоб отримати доступ до курсу, будь ласка, перейдіть за посиланням та проведіть оплату:
https://server.yedyni.org/api/contacts/resend-payment?dealUspacyId={{dealUspacyId}}&amountDeal={{amountDeal}}

Після підтвердження оплати ви отримаєте лист із деталями доступу.

З повагою,
Команда ГО «Рух Єдині»
    `
  },

  payment: {
    subject: 'Ви успішно оплатили курс "7 експрес-уроків ділової української мови"!',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #2b6cb0;">Вітаємо!</h2>
        
        <p>
          Ви успішно оплатили курс <strong>7 експрес-уроків ділової української мови</strong>.
        </p>
                
        <p>
          Щоб розпочати навчання, увійдіть за посиланням на платформу ГО «Рух Єдині»:
          <a href="https://platform.yedyni.org/uk/learn/694ac200ff0c994e3ca08608" target="_blank" style="color: #0057B7; text-decoration: none;">https://platform.yedyni.org/uk/learn/694ac200ff0c994e3ca08608</a>
        </p>
        
        <p>Також запрошуємо вас у закритий Telegram-канал курсу:
		<a href="https://t.me/+LjM_EAi5QqQ1N2My" target="_blank" style="color: #0057B7; text-decoration: none;">https://t.me/+LjM_EAi5QqQ1N2My</a>
	</p>
        
        <p style="margin-top: 30px;">
          До зустрічі на заняттях!<br>
          <strong>Команда ГО «Рух Єдині»</strong>
        </p>
      </div>
    `,
    text: `
Вітаємо!

Ви успішно оплатили курс "7 експрес-уроків ділової української мови".

Щоб розпочати навчання, увійдіть на платформу ГО «Рух Єдині»: https://platform.yedyni.org/uk/learn/694ac200ff0c994e3ca08608

Також запрошуємо вас у закритий Telegram-канал курсу: https://t.me/+LjM_EAi5QqQ1N2My

До зустрічі на заняттях!
Команда ГО «Рух Єдині»
    `
  },

  access: {
    subject: 'Ваш доступ до курсу "7 експрес-уроків ділової української мови"!',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #2b6cb0;">Вітаємо!</h2>
        
        <p>
          Ви успішно оплатили курс <strong>7 експрес-уроків ділової української мови</strong>.
        </p>
        
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
          <a href="https://platform.yedyni.org/uk/learn/694ac200ff0c994e3ca08608" target="_blank" style="color: #0057B7; text-decoration: none;">https://platform.yedyni.org/uk/learn/694ac200ff0c994e3ca08608</a>
        </p>

        <p>Також запрошуємо вас у закритий Telegram-канал курсу:
		<a href="https://t.me/+LjM_EAi5QqQ1N2My" target="_blank" style="color: #0057B7; text-decoration: none;">https://t.me/+LjM_EAi5QqQ1N2My</a>
	</p>
        
        <p style="margin-top: 30px;">
          До зустрічі на заняттях!<br>
          <strong>Команда ГО «Рух Єдині»</strong>
        </p>
      </div>
    `,
    text: `
Вітаємо!

Ви успішно оплатили курс "7 експрес-уроків ділової української мови".

Ми створили для вас особистий акаунт на платформі ГО «Рух Єдині».

Ваші дані для входу:
Email: {{email}}
Пароль: {{password}}

Увійдіть за посиланням: https://platform.yedyni.org/uk/learn/694ac200ff0c994e3ca08608

Також запрошуємо вас у закритий Telegram-канал курсу: https://t.me/+LjM_EAi5QqQ1N2My

До зустрічі на заняттях!
Команда ГО «Рух Єдині»
    `
  }
};
