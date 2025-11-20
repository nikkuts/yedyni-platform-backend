const { HttpError } = require('../helpers');

const authorizeAdmin = async (req, res, next) => {
    const { status } = req.user;

    if (status === "admin") {
        next();
    } else {
        next(HttpError(403, "Недостатньо прав"));
    }
};

const authorizeModerator = async (req, res, next) => {
    const { status } = req.user;

    if ( status === "moderator" || status === "admin") {
        next();
    } else {
        next(HttpError(403, "Недостатньо прав"));
    }
};

module.exports = {authorizeAdmin, authorizeModerator};
