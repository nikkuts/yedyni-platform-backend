const isValidId = require('./isValidId');
const validateBody = require('./validateBody');
const authenticate = require('./authenticate');
const upload = require('./upload');
const checkFileSize = require('./checkFileSize');
const resizesAvatar = require('./resizesAvatar');

module.exports = {
    validateBody,
    isValidId,
    authenticate,
    upload,
    checkFileSize,
    resizesAvatar,
}