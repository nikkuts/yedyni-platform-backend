const fs = require("fs/promises");
const {
  HttpError,
  getMaxFileSize
} = require("../helpers");

const checkFileSize = async (req, res, next) => {
  const { file } = req;

  if (!file) {
    return next();
  }

  const maxFileSize = getMaxFileSize(file.mimetype);

  if (file.size > maxFileSize) {
    await fs.unlink(file.path);

    return next(
      HttpError(
        400,
        `Розмір файлу перевищує ${maxFileSize / 1024 / 1024} MB`
      )
    );
  }

  next();
};

module.exports = checkFileSize;
