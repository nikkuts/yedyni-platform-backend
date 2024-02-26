const fs = require("fs/promises");
const { HttpError } = require("../helpers");

const checkFileSize = async (req, res, next) => {
  const { file } = req;
  const maxFileSize = 1 * 1024 * 1024;
//   if (!file) {
//     next(HttpError(400, "No added image"));
//   } else if (file.size > maxFileSize) {
//     fs.unlink(file.path);
//     next(HttpError(400, "File size exceeds 1 MB"));
//   } else {
//     next();
//   }
if (!file) {
    next();
  } else if (file.size > maxFileSize) {
    fs.unlink(file.path);
    next(HttpError(400, "Розмір файлу перевищує 1 MB"));
  } else {
    next();
  }
};

module.exports = checkFileSize;