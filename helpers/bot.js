const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const { TELEGRAM_BOT_TOKEN } = process.env;

const initializeBot = () => {
    const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
console.log('yes');

    // Обробка події приєднання нового учасника
    bot.on('new_chat_members', (msg) => {
        const chatId = msg.chat.id;

        // Отримуємо нового учасника
        msg.new_chat_members.forEach((newMember) => {
            const welcomeMessage = `Ласкаво просимо в групу, ${newMember.first_name}! 🎉`;

            // Відправляємо привітання
            bot.sendMessage(chatId, welcomeMessage);

            const giftFilePath = 'https://res.cloudinary.com/dwnbra6yc/image/upload/v1727889954/lm2hlqoe4ojvev4iat1b.png'; 

            // Відправка файлу
            bot.sendDocument(chatId, giftFilePath, { caption: "Ось ваш подарунок!" });
        });
    });

    bot.on('polling_error', (error) => {
        console.error(error); 
    });
}

module.exports = initializeBot;