const cloudinary = require("cloudinary").v2;
const { HttpError } = require("../helpers");
const fs = require("fs/promises");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFileToCloudinary = async (file) => {
  const { path, mimetype } = file;

  try {
    let resourceType = 'image';  // За замовчуванням, обробка як зображення

    if (mimetype.startsWith('video/') || mimetype.startsWith('audio/')) {
      resourceType = 'video';
    } else if (!mimetype.startsWith('image/')) {
      resourceType = 'raw';  // Для текстових, Excel та інших файлів
    }

    const result = await cloudinary.uploader.upload(path, {
      resource_type: resourceType, 
      quality: resourceType === 'image' ? 80 : undefined,
      secure: true  // Додає HTTPS до URL
    });

    fs.unlink(path);

    return result;
  } catch (error) {
    throw HttpError(400, "Помилка при збереженні файлу");
  }
};

const getFileInfo = async (fileUrl) => {
  try {
    const fileInfo = await cloudinary.api.resource(fileUrl);
    return fileInfo;
  } catch (error) {
    throw HttpError(400, 'Помилка при отриманні інформації про файл');
  }
}

const deleteFileFromCloudinary = async (fileUrlFromCloudinary) => {
  try {
    const lastDotIndex = fileUrlFromCloudinary.lastIndexOf(".");
    const lastSlashIndex = fileUrlFromCloudinary.lastIndexOf("/");
    const fileId = fileUrlFromCloudinary.substring(
      lastSlashIndex + 1,
      lastDotIndex
    );
    await cloudinary.uploader.destroy(fileId);
  } catch (error) {
    throw HttpError(400, "Помилка при видаленні файлу");
  }
};

module.exports = { uploadFileToCloudinary, getFileInfo, deleteFileFromCloudinary };