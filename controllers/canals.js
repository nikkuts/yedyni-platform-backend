const TelegramBot = require('node-telegram-bot-api');
const { ctrlWrapper} = require('../helpers');
require('dotenv').config();

const { TELEGRAM_BOT_TOKEN } = process.env;

const sendWelcomeMessage = async (req, res) => { 
    const { message } = req.body;
    console.log('message', message);

    if (message && message.new_chat_member) {
        const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

        const chatId = message.chat.id;
        const newMember = message.new_chat_member;
        const welcomeMessage = `Ласкаво просимо, ${newMember.first_name}! 🎉 Натисніть [тут](https://t.me/YedinyBot), щоб отримати ваш подарунок.`;
        bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    }

    res.sendStatus(200);
};

const sendGift = async (req, res) => { 
    const { message } = req.body;
    console.log('message', message);

    if (message && message.chat) {
        const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
        
        const chatId = message.chat.id;
        const giftFilePath = 'https://res.cloudinary.com/dwnbra6yc/image/upload/v1727889954/lm2hlqoe4ojvev4iat1b.png';

        bot.sendDocument(chatId, giftFilePath, { caption: "Вітаємо на курсі від руху 'Єдині'! 🎉 Ось ваш подарунок!" });
    }

    res.sendStatus(200);
};

module.exports = {
    sendWelcomeMessage: ctrlWrapper(sendWelcomeMessage),
    sendGift: ctrlWrapper(sendGift),
};