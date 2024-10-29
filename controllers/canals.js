const TelegramBot = require('node-telegram-bot-api');
const { ctrlWrapper} = require('../helpers');
require('dotenv').config();

const { TELEGRAM_BOT_TOKEN } = process.env;
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

// Функція надсилання привітання новому учаснику в групу
const sendWelcomeMessage = async (message) => { 
    if (message.new_chat_member) {
        const chatId = message.chat.id;
        const newMember = message.new_chat_member;
        const welcomeMessage = `Ласкаво просимо, ${newMember.first_name}! 🎉 Напишіть асистенту [тут](https://t.me/YedinyBot), щоб отримати ваш подарунок.`;
        
        await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    }
};

// Функція для обробки особистого повідомлення та надсилання подарунка
const handlePrivateMessage = async (message) => {
    if (message.chat.type === 'private') {
        const chatId = message.chat.id;
        const giftFilePath = 'https://res.cloudinary.com/dwnbra6yc/image/upload/v1727889954/lm2hlqoe4ojvev4iat1b.png';

        await bot.sendDocument(chatId, giftFilePath, { caption: "Вітаємо на курсі від руху 'Єдині'! 🎉 Ось ваш подарунок!" });
    }
};

const sendGift = async (req, res) => { 
    const { message } = req.body;
    
    // Виконуємо sendWelcomeMessage для нових учасників
    if (message && message.new_chat_member) {
        await sendWelcomeMessage(message);
    }

    // Виконуємо handlePrivateMessage для приватних повідомлень
    if (message && message.chat && message.chat.type === 'private') {
        await handlePrivateMessage(message);
    }

    res.sendStatus(200);
};

module.exports = {
    sendGift: ctrlWrapper(sendGift),
};