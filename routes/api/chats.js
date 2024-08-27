const express = require('express');

const ctrl = require('../../controllers/chats');

const {authenticate, validateBody, upload, checkFileSize} = require('../../middlewares');

const {schemas} = require('../../models/message');

const router = express.Router();

router.get('/', authenticate, ctrl.getMessages);

router.post('/upload', upload.single("file"), checkFileSize, ctrl.uploadFile);

router.post('/message', authenticate, upload.single("file"), checkFileSize, validateBody(schemas.addMessageSchema), ctrl.addMessage);

router.patch('/message', authenticate, upload.single("file"), checkFileSize, validateBody(schemas.updateMessageSchema), ctrl.updateMessage);

router.patch('/message/file', authenticate, validateBody(schemas.deleteFileSchema), ctrl.deleteFileAndUpdateMessage);

router.delete('/message/:messageId', authenticate, validateBody(schemas.deleteMessageSchema), ctrl.deleteMessage);

module.exports = router;
