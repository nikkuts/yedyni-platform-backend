const jwt = require('jsonwebtoken');
const {User} = require('../models/user');
const { Message } = require('../models/message');
const {HttpError} = require('./HttpError');

const {SECRET_KEY} = process.env;

const checkUserAuthentication = async (token) => {
    try {
        const {id} = jwt.verify(token, SECRET_KEY);
        const user = await User.findById(id);

        if (!user || !user.token || user.token !== token) {
            throw HttpError(401, 'Not authorized');
        }
        return user;
    }
    catch {
        throw HttpError(401, 'Not authorized');
    }
};

const validateMessage = ({chat, text}) => {
    if (!chat || !text || text === '') {
        throw HttpError(400, "Відсутні обов'язкові chat або text")
    }

    if (text.trim().length > 500) {
        throw HttpError(400, "Текст повідомлення має містити не більше 500 символів")
    }
}

const checkAndSaveMessage = async ({token, chat, text, fileURL}) => {
    const user = await checkUserAuthentication(token);
    validateMessage({chat, text});

    const newMessage = await Message.create({
        chat,
        text: text.trim(),
        fileURL,
        sender: user._id,
      });

    return {
        _id: newMessage._id,
        chat: newMessage.chat,
        text: newMessage.text,
        fileURL: newMessage.fileURL,
        date: newMessage.date,
        sender: {
            _id: user._id,
            name: user.name
          }
    }
}

module.exports = checkAndSaveMessage;