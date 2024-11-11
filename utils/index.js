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
    deleteFileFromCloudinary,
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
  
 const {
    updateCurrentWaveCourses,
  } = require("./cron");
  
  
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
    deleteFileFromCloudinary,
    authUspacy,
    getContactByIdUspacy,
    getDealByIdUspacy,
    createContactUspacy,
    editContactUspacy,
    createDealUspacy,
    editDealUspacy,
    moveStageDealUspacy,
    updateCurrentWaveCourses
  };