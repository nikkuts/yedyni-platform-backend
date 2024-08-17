const { Message } = require('../models/message');
const {
  uploadImageToCloudinary,
  getFileInfo,
  deleteImageFromCloudinary,
} = require("../utils");
const {HttpError, ctrlWrapper} = require('../helpers');

const getMessages = async (req, res) => {
  const {chat} = req.body;

  const result = await Message.find(
    { chat }, 
    "-createdAt -updatedAt"
  ).sort({ date: 1 })
  .populate("sender", "_id name");
  
  if (!result) {
    return res.status(204).send("В чаті ще не має повідомлень");
  }

  return res.status(200).json(result);
};

const uploadFile = async (req, res) => {
    const { path } = req.file;
    const image = await uploadImageToCloudinary(path);
    const fileURL = image.url;
  
  res.status(201).json(fileURL);
};

const addMessage = async (req, res) => {
  const { _id: sender } = req.user;
  const {chat, text} = req.body;

  let fileURL;
  if (req.file) {
    const { path } = req.file;
    const image = await uploadImageToCloudinary(path);
    fileURL = image.url;
  }

  const newMessage = await Message.create({
    chat,
    text,
    fileURL,
    sender,
  });

  res.status(201).json({
    _id: newMessage._id,
    chat: newMessage.chat,
    text: newMessage.text,
    fileURL: newMessage.fileURL,
    date: newMessage.date,
  });
};

const updateMessage = async (req, res) => {
  const {messageId, text, likes} = req.body;
  const update = { 
    text,
    likes, 
  };

  if (req.file) {
    const { path } = req.file;
    const image = await uploadImageToCloudinary(path);
    const fileURL = image.url;

    if (fileURL) {
      update.fileURL = fileURL;
    }
  }

  const result = await Message.findByIdAndUpdate(
    messageId,
    { $set: update },
    { 
      new: true,
      projection: { createdAt: 0, updatedAt: 0 } 
    }
  )
  .populate("sender", "_id name");

  if (!result) {
    throw HttpError(404, "Відсутнє повідомлення");
  }

  res.status(201).json(result);
};

const deleteFileAndUpdateMessage = async (req, res) => {
  const {messageId, fileURL} = req.body;

  await deleteImageFromCloudinary(fileURL);

  const result = await Message.findByIdAndUpdate(
    messageId,
    { $set: {fileURL: ''} },
    { 
      new: true,
      projection: { createdAt: 0, updatedAt: 0 } 
    }
  )
  .populate("sender", "_id name");

  res.status(201).json(result);
};

const deleteMessage = async (req, res) => {
  const { messageId } = req.query;

  try {
    await Message.findByIdAndDelete(messageId);

    res.json({messageId});
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Помилка при видаленні повідомлення' });
  }
}

module.exports = {
    getMessages: ctrlWrapper(getMessages),
    uploadFile: ctrlWrapper(uploadFile),
    addMessage: ctrlWrapper(addMessage),
    updateMessage: ctrlWrapper(updateMessage),
    deleteFileAndUpdateMessage: ctrlWrapper(deleteFileAndUpdateMessage),
    deleteMessage: ctrlWrapper(deleteMessage),
};