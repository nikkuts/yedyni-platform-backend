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

  const {
    authUspacy,
    getContactByIdUspacy,
    getDealByIdUspacy,
    createContactUspacy,
    createDealUspacy,
    editContactUspacy,
    moveStageDealUspacy
  } = require("./uspacy");
  
  
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
    authUspacy,
    getContactByIdUspacy,
    getDealByIdUspacy,
    createContactUspacy,
    createDealUspacy,
    editContactUspacy,
    moveStageDealUspacy
  };