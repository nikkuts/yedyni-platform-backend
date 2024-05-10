const {isValidObjectId} = require('mongoose');

const {HttpError} = require('../helpers');

const isValidId = (req, res, next) => {
    const {partnerId} = req.params;
    if (!isValidObjectId(partnerId)) {
        next(HttpError(400, `${partnerId} is not valid id`))
    }
    next();
};

module.exports = isValidId;