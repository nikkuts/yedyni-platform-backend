const TelegramBot = require('node-telegram-bot-api');
const { ctrlWrapper} = require('../helpers');
require('dotenv').config();

const { TELEGRAM_BOT_TOKEN } = process.env;

const sendGift = async (req, res) => {
    const { message } = req.body;

    if (message && message.new_chat_member) {
        const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
        console.log('message', message);
        
        /* const chatId = message.new_chat_member.id;
        const giftFilePath = 'https://res.cloudinary.com/dwnbra6yc/image/upload/v1727889954/lm2hlqoe4ojvev4iat1b.png';

        bot.sendDocument(chatId, giftFilePath, { caption: "Вітаємо на курсі від руху 'Єдині'! 🎉 Ось ваш подарунок!" }); */

        const chatId = message.chat.id;
        const newMember = message.new_chat_member;
        const welcomeMessage = `Ласкаво просимо, ${newMember.first_name}! 🎉 Натисніть [тут](https://t.me/YedyniBot), щоб отримати ваш подарунок.`;
        bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    }

    res.sendStatus(200);
};

module.exports = {
    sendGift: ctrlWrapper(sendGift),
};