const Base64 = require('crypto-js/enc-base64');
const SHA1 = require('crypto-js/sha1');
const Utf8 = require('crypto-js/enc-utf8');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const BASE_SERVER_URL = process.env.BASE_SERVER_URL;

const createPaymentForm = async ({
    PUBLIC_KEY,
    PRIVATE_KEY,
    user, 
    course, 
    dealId
}) => {
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
        server_url: `${BASE_SERVER_URL}/api/contacts/process`,
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

    return paymentForm;
};

module.exports = createPaymentForm;