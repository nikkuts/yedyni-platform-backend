const { Message } = require('../models/message');
const { User } = require('../models/user');
const {
  uploadFileToCloudinary,
  deleteFileFromCloudinary,
} = require("../utils");
const {HttpError, ctrlWrapper} = require('../helpers');

const getMessages = async (req, res) => {
  const { chat, page = 1, limit = 10, firstMessageDate } = req.query;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const firstMessageDateNum = parseInt(firstMessageDate, 10);

  const skip = (pageNum - 1) * limitNum;

  const query = { chat };
    
  if (firstMessageDate) {
    query.date = { $lte: new Date(firstMessageDateNum) }; 
  }

  const messages = await Message.find(
    query, 
    "-createdAt -updatedAt"
  )
  .sort({ date: -1 })
  .skip(skip)
  .limit(limitNum)
  .populate("sender", "_id name");

  const result = { messages };

  if (pageNum === 1 && !firstMessageDate) {
    result.firstMessageDate = messages[0]?.date;;
  }
  
  return res.status(200).json(result);
};

const uploadFile = async (req, res) => {
    const { file } = req;
    const { originalname } = req.body;
    console.log('file', file);
    console.log('originalname', originalname);
    
    
    const downloadedFile = await uploadFileToCloudinary(file);
    console.log('downloadedFile', downloadedFile);
    
    const fileURL = downloadedFile.secure_url;
    // const fileName = downloadedFile.original_filename;
    const fileType = file.mimetype;
    const fileName = originalname;
  console.log(fileURL, fileType, fileName);
  
  res.status(201).json({fileURL, fileType, fileName});
};

const addMessage = async (req, res) => {
  const { file, originalname } = req;
  const { _id: sender } = req.user;
  const {chat, text} = req.body;

  let fileURL;
  let fileType;
  let fileName;

  if (file) {
    const downloadedFile = await uploadFileToCloudinary(file);
    fileURL = downloadedFile.secure_url;
    // fileName = downloadedFile.original_filename;
    fileType = file.mimetype;
    fileName = originalname;
  }

  const newMessage = await Message.create({
    chat,
    text,
    fileURL,
    fileType,
    fileName,
    sender,
  });

  const user = await User.findById(sender);

  res.status(201).json({
    _id: newMessage._id,
    chat: newMessage.chat,
    text: newMessage.text,
    fileURL: newMessage.fileURL,
    fileType: newMessage.fileType,
    fileName: newMessage.fileName,
    date: newMessage.date,
    sender: {
      _id: user._id,
      name: user.name
    }
  });
};

const updateMessage = async (req, res) => {
  const { file, originalname } = req;
  const {messageId, text} = req.body;
  const update = { 
    text, 
  };

  if (file) {
    const downloadedFile = await uploadFileToCloudinary(file);
    const fileURL = downloadedFile.secure_url;
    // const fileName = downloadedFile.original_filename;
    const fileType = file.mimetype;
    const fileName = originalname;

    if (fileURL) {
      update.fileURL = fileURL;
      update.fileType = fileType;
      update.fileName = fileName;
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
    { $set: {fileURL: '', fileType: '', fileName: ''} },
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