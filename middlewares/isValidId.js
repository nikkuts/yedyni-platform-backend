const {isValidObjectId} = require('mongoose');

const {HttpError} = require('../helpers');

const isValidId = (req, res, next) => {
    const {objId} = req.params;
    if (!isValidObjectId(objId)) {
        next(HttpError(400, `${objId} is not valid id`))
    }
    next();
};

module.exports = isValidId;