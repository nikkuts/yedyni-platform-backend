const multer = require('multer');
const path = require('path');
const fs = require('fs');

const tempDir = path.join(__dirname, '../', 'temp');

// переконайся, що каталог існує (Multer 2 не створює його автоматично)
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // безпечніше видалити потенційно небезпечні символи
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = upload;
