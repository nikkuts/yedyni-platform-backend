const fs = require("fs/promises");
const { HttpError } = require("../helpers");

const checkFileSize = async (req, res, next) => {
  const { file } = req;
  const maxFileSize = 10 * 1024 * 1024;

  if (!file) {
    next();
  } else if (file.size > maxFileSize) {
    await fs.unlink(file.path);
    next(HttpError(400, "Розмір файлу перевищує 10 MB"));
  } else {
    next();
  }
};

module.exports = checkFileSize;