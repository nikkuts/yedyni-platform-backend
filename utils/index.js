const {
    emailRegexp,
    dateRegexp,
    locationRegexp,
    nameRegexp,
    phoneRegexp,
    workScheduleRegexp,
    passwordRegex,
  } = require("./regexp");

  const {
    uploadImageToCloudinary,
    getFileInfo,
    deleteImageFromCloudinary,
  } = require("./cloudinary");
  
  
  module.exports = {
    emailRegexp,
    dateRegexp,
    locationRegexp,
    nameRegexp,
    phoneRegexp,
    workScheduleRegexp,
    passwordRegex,
    uploadImageToCloudinary,
    getFileInfo,
    deleteImageFromCloudinary,
  };