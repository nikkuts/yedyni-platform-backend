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

module.exports = {
    getExercise: ctrlWrapper(getExercise),
    addExercise: ctrlWrapper(addExercise),
    updateExercise: ctrlWrapper(updateExercise),
    deleteFileAndUpdateExercise: ctrlWrapper(deleteFileAndUpdateExercise),
};