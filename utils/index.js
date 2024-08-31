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
    uploadFileToCloudinary,
    getFileInfo,
    deleteImageFromCloudinary,
  } = require("./cloudinary");

  const {
    authUspacy,
    getContactByIdUspacy,
    getDealByIdUspacy,
    createContactUspacy,
    editContactUspacy,
    createDealUspacy,
    editDealUspacy,
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
    uploadFileToCloudinary,
    getFileInfo,
    deleteImageFromCloudinary,
    authUspacy,
    getContactByIdUspacy,
    getDealByIdUspacy,
    createContactUspacy,
    editContactUspacy,
    createDealUspacy,
    editDealUspacy,
    moveStageDealUspacy
  };