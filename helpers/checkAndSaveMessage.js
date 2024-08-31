const jwt = require('jsonwebtoken');
const { User } = require('../models/user');
const { Message } = require('../models/message');
const { deleteFileFromCloudinary } = require("../utils");
const { HttpError } = require('./HttpError');

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

const validateMessage = ({chat, messageId, text, fileURL}) => {
    if (!chat && !messageId) {
        throw HttpError(400, "Відсутні обов'язкові chat і messageId")
    }

    if (!text?.trim() && !fileURL) {
        throw HttpError(400, "Відсутні і текст, і файл");
    }
    
    if (text && text.trim().length > 500) {
        throw HttpError(400, "Текст повідомлення має містити не більше 500 символів")
    }
}

const checkAndSaveMessage = async ({
    token, 
    chat, 
    messageId, 
    text, 
    fileURL, 
    fileType,
    deletedFile, 
    isDeleteMessage,
}) => {
    const user = await checkUserAuthentication(token);

    if (messageId && isDeleteMessage) {
        if (fileURL && fileURL !== '') {
            await deleteFileFromCloudinary(fileURL);
        }

        await Message.findByIdAndDelete(messageId);

        return {_id: messageId, isDeleteMessage};
    }

    // text = text?.trim();
    validateMessage({chat, messageId, text, fileURL});

    if (chat) {
        const newMessage = await Message.create({
            chat,
            text: text.trim(),
            fileURL,
            fileType,
            sender: user._id,
          });
    
        return {
            _id: newMessage._id,
            chat: newMessage.chat,
            text: newMessage.text,
            fileURL: newMessage.fileURL,
            fileType: newMessage.fileType,
            date: newMessage.date,
            sender: {
                _id: user._id,
                name: user.name
              }
        }
    }

    if (messageId) {
        if (deletedFile) {
            await deleteFileFromCloudinary(deletedFile);
        }
        
        const updatedMessage = await Message.findByIdAndUpdate(
            messageId,
            { 
                text: text.trim(), 
                fileURL: fileURL || '',
                fileType: fileType || '', 
            },
            { new: true }
        );

        if (!updatedMessage) {
            throw HttpError(404, "Повідомлення не знайдено");
        }
    
        return {
            _id: messageId,
            text: updatedMessage.text,
            fileURL: updatedMessage.fileURL,
            fileType: updatedMessage.fileType,
        }
    }

    throw HttpError(400, "Жодна з обов'язкових умов не виконалася");
}

module.exports = checkAndSaveMessage;