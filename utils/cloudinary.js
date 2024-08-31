const cloudinary = require("cloudinary").v2;
const { HttpError } = require("../helpers");
const fs = require("fs/promises");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// const uploadImageToCloudinary = async (file) => {
//   try {
//     const result = await cloudinary.uploader.upload(file, { quality: 80 });
//     fs.unlink(file);
//     return result;
//   } catch (error) {
//     throw HttpError(400, "Invalid request file");
//   }
// };

const uploadFileToCloudinary = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file);
    fs.unlink(file);
    return result;
  } catch (error) {
    throw HttpError(400, "Invalid request file");
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

const deleteImageFromCloudinary = async (imageUrlFromCloudinary) => {
  try {
    const lastDotIndex = imageUrlFromCloudinary.lastIndexOf(".");
    const lastSlashIndex = imageUrlFromCloudinary.lastIndexOf("/");
    const imageId = imageUrlFromCloudinary.substring(
      lastSlashIndex + 1,
      lastDotIndex
    );
    await cloudinary.uploader.destroy(imageId);
  } catch (error) {
    throw HttpError(400, "Invalid request for deleting image");
  }
};

module.exports = { uploadFileToCloudinary, getFileInfo, deleteImageFromCloudinary };