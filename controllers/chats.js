const { Message } = require('../models/message');
const { User } = require('../models/user');
const {
  uploadFileToCloudinary,
  deleteFileFromCloudinary,
} = require("../utils");
const {HttpError, ctrlWrapper} = require('../helpers');

const getMessages = async (req, res) => {
  const {chat} = req.query;

  const result = await Message.find(
    { chat }, 
    "-createdAt -updatedAt"
  ).sort({ date: 1 })
  .populate("sender", "_id name");
  
  if (result.length === 0) {
    return res.status(204);
  }

  return res.status(200).json(result);
};

const uploadFile = async (req, res) => {
    // const { path, mimetype } = req.file;
    // console.log('path', path);
    // console.log('mimetype', mimetype);
    
    const result = await uploadFileToCloudinary(req.file);
    const fileURL = result.url;
    const fileType = req.file.mimetype;
  
  res.status(201).json({fileURL, fileType});
  // res.status(201).json({message: 'файл отримав'});
};

const addMessage = async (req, res) => {
  const { _id: sender } = req.user;
  const {chat, text} = req.body;

  let fileURL;
  if (req.file) {
    const result = await uploadFileToCloudinary(req.file);
    const fileURL = result.url;
    const fileType = req.file.mimetype;
  }

  const newMessage = await Message.create({
    chat,
    text,
    fileURL,
    fileType,
    sender,
  });

  const user = await User.findById(sender);

  res.status(201).json({
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
  });
};

const updateMessage = async (req, res) => {
  const {messageId, text} = req.body;
  const update = { 
    text, 
  };

  if (req.file) {
    const result = await uploadFileToCloudinary(req.file);
    const fileURL = result.url;
    const fileType = req.file.mimetype;

    if (fileURL) {
      update.fileURL = fileURL;
      update.fileType = fileType;
    }
  }

  const updatedMessage = await Message.findByIdAndUpdate(
    messageId,
    { $set: update },
    { 
      new: true,
      projection: { createdAt: 0, updatedAt: 0 } 
    }
  )
  .populate("sender", "_id name");

  if (!updatedMessage) {
    throw HttpError(404, "Відсутнє повідомлення");
  }

  res.status(201).json(updatedMessage);
};

const deleteFileAndUpdateMessage = async (req, res) => {
  const {messageId, fileURL} = req.body;

  await deleteFileFromCloudinary(fileURL);

  const result = await Message.findByIdAndUpdate(
    messageId,
    { $set: {fileURL: '', fileType: ''} },
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