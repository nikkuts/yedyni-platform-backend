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
    comments: newExercise.comments,
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

const addComment = async (req, res) => {
  const { _id: owner } = req.user;
  const {courseId, lessonId, author, comment} = req.body;

  const updatedExercise = await Exercises.findOneAndUpdate(
    { owner, courseId, lessonId },
    {
      $push: {
        comments: {
          author,
          comment,
        }
      }
    },
    { new: true }
  );

  if (!updatedExercise) {
    throw HttpError(404, "Відсутня домашня робота");
  }
  
  res.status(201).json(updatedExercise.comments[updatedExercise.comments.length - 1]);
};

const updateComment = async (req, res) => {
  const { _id: owner } = req.user;
  const { courseId, lessonId, author, comment, commentId } = req.body;

  await Exercises.findOneAndUpdate(
    { owner, courseId, lessonId, 'comments._id': commentId },
    {
      $set: {
        'comments.$.date': Date.now(),
        'comments.$.author': author,
        'comments.$.comment': comment,
        'comments.$.status': "active"
      }
    }
  );

  const updatedExercise = await Exercises.findOne(
    { owner, courseId, lessonId, 'comments._id': commentId },
    { 'comments.$': 1 }
  );

  if (!updatedExercise) {
    throw HttpError(404, "Вправу не знайдено");
  }

  res.status(201).json(updatedExercise.comments[0]);
};

const deleteComment = async (req, res) => {
  const { _id: owner } = req.user;
  const { courseId, lessonId, commentId } = req.query;

  try {
    await Exercises.findOneAndUpdate(
      { owner, courseId, lessonId },
      {
        $pull: {
          comments: { _id: commentId } 
        }
      }
    );

    res.json({ commentId });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Помилка при видаленні коментаря' });
  }
}

module.exports = {
    getExercise: ctrlWrapper(getExercise),
    addExercise: ctrlWrapper(addExercise),
    updateExercise: ctrlWrapper(updateExercise),
    deleteFileAndUpdateExercise: ctrlWrapper(deleteFileAndUpdateExercise),
    addComment: ctrlWrapper(addComment),
    updateComment: ctrlWrapper(updateComment),
    deleteComment: ctrlWrapper(deleteComment),
};