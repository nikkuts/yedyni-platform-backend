const isValidId = require('./isValidId');
const validateBody = require('./validateBody');
const authenticate = require('./authenticate');
const {
    authorizeAdmin,
    authorizeModerator
} = require('./authorize');
const upload = require('./upload');
const checkFileSize = require('./checkFileSize');
const resizesAvatar = require('./resizesAvatar');

module.exports = {
    validateBody,
    isValidId,
    authenticate,
    authorizeAdmin,
    authorizeModerator,
    upload,
    checkFileSize,
    resizesAvatar,
}