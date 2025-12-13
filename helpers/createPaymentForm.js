const Base64 = require('crypto-js/enc-base64');
const SHA1 = require('crypto-js/sha1');
const Utf8 = require('crypto-js/enc-utf8');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const BASE_SERVER_URL = process.env.BASE_SERVER_URL;

const createPaymentForm = async ({
  PUBLIC_KEY,
  PRIVATE_KEY,
  contact, 
  course, 
  dealId,
  amountDeal
}) => {
    // Створення та відправка форми до Liqpay
      const dataObj = {
        public_key: PUBLIC_KEY, 
        version: '3',
        action: 'pay',
        amount: amountDeal,
        currency: 'UAH',
        description: 'Безповоротна благодійна допомога на статутну діяльність',
        order_id: dealId,
        // result_url: `https://yedyni.org/testpayment?deal_id=${dealId}&amount=${amountDeal}`,
        result_url: 'https://yedyni.org/',
        server_url: `${BASE_SERVER_URL}/api/contacts/process`,
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

const createDonatForm = async ({
  PUBLIC_KEY,
  PRIVATE_KEY,
  pay_type, 
  amount,
}) => {
  // Створення та відправка форми до Liqpay
  const orderId = uuidv4();

  const dataObj = {
    public_key: PUBLIC_KEY, 
    version: '3',
    action: 'pay',
    amount,
    currency: 'UAH',
    description: 'Безповоротна благодійна допомога на статутну діяльність',
    order_id: orderId,
    result_url: 'https://yedyni.org/thank-you/',
    server_url: `${BASE_SERVER_URL}/api/contacts/process-donat`,
  };

  if (pay_type === 'subscribe') {
    const currentTimeUtc = new Date().toISOString();
    const formattedTimeUtc = currentTimeUtc.replace('T', ' ').substring(0, 19);
    dataObj.action = 'subscribe';
    dataObj.subscribe = '1';
    dataObj.subscribe_date_start = formattedTimeUtc;
    dataObj.subscribe_periodicity = 'month';
  }

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

module.exports = {createPaymentForm, createDonatForm};