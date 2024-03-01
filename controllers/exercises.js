const { Exercises } = require('../models/exercise');
const {
  uploadImageToCloudinary,
  getFileInfo,
  deleteImageFromCloudinary,
} = require("../utils");
const {HttpError, ctrlWrapper} = require('../helpers');

const getExercise = async (req, res) => {
  const {_id: owner} = req.user;
  const {courseId, lessonId} = req.query;

  const result = await Exercises.findOne(
    { owner, courseId, lessonId }, 
    "-_id -owner -createdAt -updatedAt"
  );
  
  if (!result) {
    return res.status(204).send("Вправа вказаного уроку ще не створена");
  }

  return res.status(200).json(result);
};

const addExercise = async (req, res) => {
  const { _id: owner } = req.user;
  const {courseId, lessonId, homework} = req.body;

  const exercise = await Exercises.findOne(
    { owner, courseId, lessonId }
  );

  if (exercise) {
    throw HttpError(409, "Вправа вказаного уроку вже створена");
  }

  let fileURL;
  if (req.file) {
    const { path } = req.file;
    const image = await uploadImageToCloudinary(path);
    fileURL = image.url;
  }

  const newExercise = await Exercises.create({
    courseId,
    lessonId,
    homework,
    fileURL,
    owner,
  });

  res.status(201).json({
    courseId: newExercise.courseId,
    lessonId: newExercise.lessonId,
    homework: newExercise.homework,
    fileURL: newExercise.fileURL,
  });
};

const updateExercise = async (req, res) => {
  const {_id: owner} = req.user;
  const {courseId, lessonId, homework} = req.body;

  const exercise = await Exercises.findOne(
    { owner, courseId, lessonId }
  );

  if (!exercise) {
    throw HttpError(404, "Вправа вказаного уроку не знайдена");
  }

  let fileURL;
  if (req.file) {
    const { path } = req.file;
    const image = await uploadImageToCloudinary(path);
    fileURL = image.url;
  }

  const update = { homework };
  if (fileURL) {
    update.fileURL = fileURL;
  }

  const updatedExercise = await Exercises.findOneAndUpdate(
    { owner, courseId, lessonId },
    { $set: update },
    { 
      new: true,
      projection: { _id: 0, owner: 0, createdAt: 0, updatedAt: 0 } 
    }
  );

  res.status(201).json(updatedExercise);
};

const deleteFileAndUpdateExercise = async (req, res) => {
  const {_id: owner} = req.user;
  const {courseId, lessonId, fileURL} = req.body;

  await deleteImageFromCloudinary(fileURL);
  
  // const fileInfo = await getFileInfo(fileURL);

  // if (fileInfo && Object.keys(fileInfo).length > 0) {
  //   await deleteImageFromCloudinary(fileURL);
  // } else {
  //   throw HttpError(404, "Файл не знайдено");
  // } 

  const updatedExercise = await Exercises.findOneAndUpdate(
    { owner, courseId, lessonId },
    { $set: {fileURL: ''} },
    { 
      new: true,
      projection: { _id: 0, owner: 0, createdAt: 0, updatedAt: 0 } 
    }
  );

  res.status(201).json(updatedExercise);
};

// const getAll = async (req, res) => {
//     const {_id: owner} = req.user;
//     const {page = 1, limit = 10, favorite} = req.query;
//     const skip = (page - 1) * limit;
//     const result = await Contact.find({owner, favorite: favorite}, "-createdAt -updatedAt", {skip, limit});
//     res.json(result);
// };

// const getById = async (req, res) => {
//     const {contactId} = req.params;
//     const result = await Contact.findOne({_id: contactId});

//     if(!result) {
//       throw HttpError (404, 'Not found')
//     }
//     res.json(result);
// };

// const add = async (req, res) => {
//     const {_id: owner} = req.user;
//     const result = await Contact.create({...req.body, owner});
//     res.status(201).json(result);
// };

// const removeById = async (req, res) => {
//     const {contactId} = req.params;
//     const result = await Contact.findByIdAndRemove(contactId);

//     if(!result) {
//       throw HttpError (404, 'Not found')
//     }
//     res.json({ message: 'contact deleted' })
// };

// const updateStatusContact = async (req, res) => {
//     const {contactId} = req.params;
//     const result = await Contact.findByIdAndUpdate(contactId, req.body, {new: true});
    
//     if(!result) {
//       throw HttpError (404, 'Not found')
//     }
//     res.json(result);
// };

module.exports = {
    getExercise: ctrlWrapper(getExercise),
    // getById: ctrlWrapper(getById),
    addExercise: ctrlWrapper(addExercise),
    updateExercise: ctrlWrapper(updateExercise),
    deleteFileAndUpdateExercise: ctrlWrapper(deleteFileAndUpdateExercise),
    // removeById: ctrlWrapper(removeById),
};