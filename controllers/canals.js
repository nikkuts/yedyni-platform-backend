const TelegramBot = require('node-telegram-bot-api');
const { ctrlWrapper} = require('../helpers');
require('dotenv').config();

const { TELEGRAM_BOT_TOKEN } = process.env;

const sendGift = async (req, res) => {
    const { message } = req.body;
    console.log(req.body);
    
    /* const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

    if (message && message.new_chat_members) {
        const chatId = message.chat.id;
       
        message.new_chat_members.forEach((newMember) => {
            console.log('newMember', newMember);
            
            const welcomeMessage = `Ласкаво просимо, ${newMember.first_name}! 🎉`;
            bot.sendMessage(chatId, welcomeMessage);
         
            const giftFilePath = 'https://res.cloudinary.com/dwnbra6yc/image/upload/v1727889954/lm2hlqoe4ojvev4iat1b.png';
            bot.sendDocument(chatId, giftFilePath, { caption: "Ось ваш подарунок!" });
        });
        console.log('OK');
    } */
console.log('ok');

    res.sendStatus(200);
};

module.exports = {
    sendGift: ctrlWrapper(sendGift),
};

/* app.post('/webhook', async (req, res) => {
    const {message} = req.body;

    if (message && message.new_chat_members) {
        const newMember = message.new_chat_members[0];
        const chatId = message.chat.id;

        await sendGift(chatId, newMember.id);
    }

    res.sendStatus(200);
});

const sendGift = async (chatId, userId) => {
    const token = 'YOUR_BOT_TOKEN';
    const fileUrl = 'https://link-to-your-file.com/file.pdf';

    await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            document: fileUrl,
            caption: "Дякуємо за підписку! Ось ваш подарунок."
        })
    });
}; */